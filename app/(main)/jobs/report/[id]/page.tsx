"use client";

import {
  getJobDetailById,
  getSearchResults,
} from "@/app/(main)/jobs/report/[id]/request";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import SearchResultList from "./search-result-list";
import { formatDateTime, calculateWaylineLength } from "./action";

export default function Page() {
  const AMapRef = useRef<typeof AMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<AMap.Map | null>(null);
  // Add a ref to store active editors and info windows
  const activeEditorRef = useRef<number>(-1);
  const infoWindowsRef = useRef<AMap.InfoWindow[]>([]);
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const editorsRef = useRef<AMap.PolygonEditor[]>([]);
  // Add new ref for polylines
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  // Add new ref for markers
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 区域面积状态
  const [areaSize, setAreaSize] = useState<number>(0);

  // 计算工作状态
  const { idPart } = useIsCreateMode();

  // 当前选中的搜索区域路径
  const [path, setPath] = useState<AMap.LngLat[]>([]);

  // WGS84坐标转GCJ02坐标的函数 (GPS坐标转高德坐标)
  const transformWGS84ToGCJ02 = (
    lng: number,
    lat: number
  ): [number, number] => {
    // 判断是否在中国境内，如果不在国内，则不进行偏移
    const outOfChina =
      lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    if (outOfChina) {
      return [lng, lat];
    }

    // 转换参数
    const PI = 3.14159265358979324;
    const a = 6378245.0; // 长半轴
    const ee = 0.00669342162296594323; // 扁率

    let dlng = transformLng(lng - 105.0, lat - 35.0);
    let dlat = transformLat(lng - 105.0, lat - 35.0);

    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;

    const sqrtMagic = Math.sqrt(magic);
    dlng = (dlng * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * PI);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI);

    return [lng + dlng, lat + dlat];

    // 内部辅助函数 - 经度转换
    function transformLng(x: number, y: number): number {
      let ret =
        300.0 +
        x +
        2.0 * y +
        0.1 * x * x +
        0.1 * x * y +
        0.1 * Math.sqrt(Math.abs(x));
      ret +=
        ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) /
        3.0;
      ret +=
        ((150.0 * Math.sin((x / 12.0) * PI) +
          300.0 * Math.sin((x / 30.0) * PI)) *
          2.0) /
        3.0;
      return ret;
    }

    // 内部辅助函数 - 纬度转换
    function transformLat(x: number, y: number): number {
      let ret =
        -100.0 +
        2.0 * x +
        3.0 * y +
        0.2 * y * y +
        0.1 * x * y +
        0.2 * Math.sqrt(Math.abs(x));
      ret +=
        ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) /
        3.0;
      ret +=
        ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) *
          2.0) /
        3.0;
      return ret;
    }
  };

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba",
      version: "2.0",
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        mapRef.current = new AMap.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });

        // Add standard controls
        AMap.plugin(
          ["AMap.ToolBar", "AMap.Scale", "AMap.MapType"],
          function () {
            const mapType = new AMap.MapType({
              defaultType: 0, //使用2D
            });
            mapRef.current?.addControl(mapType);

            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);
            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);
          }
        );

        setIsMapLoaded(true);
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      // 清除地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      // 清除AMap实例
      if (AMapRef.current) {
        AMapRef.current = null;
      }
    };
  }, []);

  const dataQuery = useQuery({
    queryKey: ["jobDetail", idPart],
    queryFn: () => getJobDetailById(Number(idPart)),
  });

  const resultQuery = useQuery({
    queryKey: ["result"],
    queryFn: () => getSearchResults(Number(idPart)),
  });

  // 优化 dataQuery useEffect
  useEffect(() => {
    console.log("dataQuery useEffect 触发", {
      isSuccess: dataQuery.isSuccess,
      hasData: !!dataQuery.data,
      isMapLoaded,
    });

    if (
      !dataQuery.isSuccess ||
      !dataQuery.data ||
      !isMapLoaded ||
      !AMapRef.current
    )
      return;

    const { area } = dataQuery.data;

    // 设置地图区域路径
    if (area?.points) {
      const areaPath = area.points.map(
        (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
      );
      setPath(areaPath);

      // 计算区域面积
      console.log("Points: ", areaPath);

      const areaSizeInSqMeters =
        AMapRef.current!.GeometryUtil.ringArea(areaPath);
      console.log("Area size: ", areaSizeInSqMeters);

      setAreaSize(areaSizeInSqMeters);
    }
  }, [dataQuery.isSuccess, dataQuery.data, isMapLoaded, AMapRef]);

  // 选择区域时绘制选中的搜索区域多边形
  useEffect(() => {
    if (
      !path ||
      path.length <= 0 ||
      !isMapLoaded ||
      !AMapRef.current ||
      !mapRef.current
    )
      return;

    // 清除之前的多边形
    mapRef.current.clearMap();

    const polygon = new AMapRef.current.Polygon();
    polygon.setPath(path);
    polygon.setOptions({
      strokeColor: "#3366FF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#3366FF",
      fillOpacity: 0.3,
    });

    mapRef.current?.add(polygon);
    mapRef.current?.setFitView([polygon]);
  }, [path, isMapLoaded]);

  // 优化航线区域 useEffect
  useEffect(() => {
    if (!isMapLoaded || !AMapRef.current || !mapRef.current) {
      console.log("缺少必要数据，跳过航线区域更新");
      return;
    }

    // Store current map references
    const currentMap = mapRef.current;
    const currentAMap = AMapRef.current;

    // 清除旧的地图元素
    currentMap.clearMap();

    // 清除引用
    infoWindowsRef.current = [];
    polygonsRef.current = [];
    editorsRef.current = [];
    polylinesRef.current = [];
    markersRef.current = [];

    // 重新绘制搜索区域
    if (path && path.length > 0) {
      const areaPolygon = new currentAMap.Polygon();
      areaPolygon.setPath(path);
      areaPolygon.setOptions({
        path: path,
        strokeColor: "#3366FF",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#3366FF",
        fillOpacity: 0.3,
      });
      currentMap.add(areaPolygon);
    }

    // 适应视图
    currentMap.setFitView();

    return () => {
      console.log("清除航线区域编辑器", {
        editorsCount: editorsRef.current.length,
        activeEditor: activeEditorRef.current,
      });
      editorsRef.current.forEach((editor) => {
        if (editor) editor.close();
      });
      activeEditorRef.current = -1;
    };
  }, [isMapLoaded, AMapRef, mapRef]);

  // 在地图上绘制搜索结果标记点
  useEffect(() => {
    console.log("搜索结果 useEffect 触发", {
      isSuccess: resultQuery.isSuccess,
      hasResults: !!resultQuery.data?.items?.length,
      isMapLoaded,
    });

    // 如果地图未加载或搜索结果未加载，则退出
    if (
      !isMapLoaded ||
      !AMapRef.current ||
      !mapRef.current ||
      !resultQuery.isSuccess ||
      !resultQuery.data?.items?.length
    ) {
      return;
    }

    const currentMap = mapRef.current;
    const currentAMap = AMapRef.current;
    const searchResults = resultQuery.data.items;

    // 清除之前的标记点
    const currentMarkers = markersRef.current[0] || [];
    if (currentMarkers.length > 0) {
      currentMap.remove(currentMarkers);
      markersRef.current[0] = [];
    }

    // 为每个搜索结果创建标记点
    const markers: AMap.Marker[] = [];

    searchResults.forEach((result) => {
      // 解析经纬度
      const wgsLng = parseFloat(result.lng);
      const wgsLat = parseFloat(result.lat);

      // 将WGS84坐标转换为GCJ-02坐标（高德地图坐标系）
      const [gcjLng, gcjLat] = transformWGS84ToGCJ02(wgsLng, wgsLat);

      // 创建信息窗体内容
      const infoWindowContent = `
        <div class="p-2">
          <div class="font-bold">${result.target_label}</div>
          <div class="mt-1">ID: ${result.id}</div>
          <div class="mt-1">任务: ${result.job_name}</div>
          <div class="mt-1">创建时间: ${new Date(
            result.created_at
          ).toLocaleString()}</div>
          <div class="mt-1">
            <img src="${result.image_url}" alt="${
        result.target_label
      }" class="max-w-[200px] max-h-[150px] object-cover rounded" />
          </div>
        </div>
      `;

      // 创建信息窗体
      const infoWindow = new currentAMap.InfoWindow({
        content: infoWindowContent,
        offset: new currentAMap.Pixel(0, -30),
      });
      infoWindowsRef.current.push(infoWindow);

      // 创建标记点
      const marker = new currentAMap.Marker({
        position: new currentAMap.LngLat(gcjLng, gcjLat),
        title: result.target_label,
        clickable: true,
        // 添加标签显示ID
        label: {
          // 标签内容
          content: `ID: ${result.id}`,
          // 标签方向，以右下角为例
          direction: "right",
          // 标签样式
          offset: new currentAMap.Pixel(0, 0),
        },
        // 自定义标记点的图标和样式
        icon: new currentAMap.Icon({
          // 使用红色标记图标
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
          size: new currentAMap.Size(25, 34),
          imageSize: new currentAMap.Size(25, 34),
        }),
      });

      // 添加点击事件监听器
      marker.on("click", () => {
        // 关闭所有已打开的信息窗体
        infoWindowsRef.current.forEach((window) => {
          window.close();
        });

        // 打开当前标记点的信息窗体
        // 直接传入转换后的经纬度值作为 Vector2 类型参数
        infoWindow.open(currentMap, [gcjLng, gcjLat]);

        // 也可以触发列表中对应项的点击事件，实现地图和列表的联动
        console.log("点击地图标记", result, {
          原始坐标: [wgsLng, wgsLat],
          转换坐标: [gcjLng, gcjLat],
        });
      });

      markers.push(marker);
    });

    // 将所有标记点添加到地图上
    if (markers.length > 0) {
      currentMap.add(markers);
      markersRef.current[0] = markers;

      // 调整地图视图以包含所有标记点
      // if (path && path.length > 0) {
      //   // 如果存在搜索区域，则将其与标记点一起纳入视图范围
      //   const allElements = [...markers, ...polygonsRef.current];
      //   currentMap.setFitView(allElements);
      // } else {
      // 如果不存在搜索区域，则仅将标记点纳入视图范围
      currentMap.setFitView(markers);
      // }
    }

    console.log(`已在地图上添加 ${markers.length} 个搜索结果标记点`);
  }, [
    resultQuery.isSuccess,
    resultQuery.data,
    isMapLoaded,
    AMapRef,
    mapRef,
    path,
  ]);

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="h-[calc(100vh-132px)] w-[calc(100%-480px)] border rounded-md shadow-sm"
        />
        <div className="w-[480px] h-[calc(100vh-132px)] overflow-y-auto border rounded-md shadow-sm p-4">
          {/* 顶部下载报告按钮 */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                // 实现下载报告功能
                alert("报告下载功能即将上线");
              }}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            >
              下载报告
            </button>
          </div>

          {/* 任务基本信息 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">
              任务基本信息
            </h2>
            {dataQuery.isLoading ? (
              <div className="flex items-center justify-center h-24">
                <span>加载中...</span>
              </div>
            ) : dataQuery.isError ? (
              <div className="flex items-center justify-center h-24 text-red-500">
                <span>加载失败</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">任务名称:</span>
                  <span className="font-medium">
                    {dataQuery.data?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">任务介绍:</span>
                  <span className="font-medium">
                    {dataQuery.data?.description || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">搜索区域面积:</span>
                  <span className="font-medium">
                    {areaSize > 0
                      ? `${
                          areaSize < 10000
                            ? areaSize.toFixed(2)
                            : (areaSize / 10000).toFixed(2)
                        } ${areaSize < 10000 ? "平方米" : "公顷"}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">起飞时间:</span>
                  <span className="font-medium">
                    {formatDateTime(new Date(Date.now() - 1000 * 60 * 60))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">降落时间:</span>
                  <span className="font-medium">
                    {formatDateTime(new Date())}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 无人机飞行统计 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">
              无人机飞行统计
            </h2>
            {dataQuery.isLoading ? (
              <div className="flex items-center justify-center h-24">
                <span>加载中...</span>
              </div>
            ) : dataQuery.isError ? (
              <div className="flex items-center justify-center h-24 text-red-500">
                <span>加载失败</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 获取无人机数据 */}
                {(() => {
                  // 获取真实数据
                  const drones = dataQuery.data?.drones || [];
                  const mappings = dataQuery.data?.mappings || [];
                  const waylines = dataQuery.data?.waylines || [];

                  // 存储每个无人机的飞行长度
                  const droneFlightLengths: Record<string, number> = {};

                  // 计算每个无人机的飞行长度
                  waylines.forEach((wayline) => {
                    // 如果没有路径点，跳过
                    if (!wayline.path || wayline.path.length < 2) return;

                    // 计算航线长度（米）
                    const lengthInMeters = calculateWaylineLength(wayline.path);
                    // 转换为千米，保留1位小数
                    const lengthInKm = lengthInMeters / 1000;

                    // 存储到对应的无人机键下
                    droneFlightLengths[wayline.drone_key] =
                      (droneFlightLengths[wayline.drone_key] || 0) + lengthInKm;
                  });

                  // 如果没有计算出任何航线长度，使用示例数据
                  const hasRealFlightData =
                    Object.keys(droneFlightLengths).length > 0;
                  if (!hasRealFlightData) {
                    // 使用示例数据
                    drones.forEach((drone, index) => {
                      if (index < 3) {
                        // 示例长度：3.2, 2.8, 4.1 千米
                        const exampleLengths = [3.2, 2.8, 4.1];
                        droneFlightLengths[drone.key] = exampleLengths[index];
                      }
                    });

                    // 如果没有无人机数据，创建示例数据
                    if (drones.length === 0) {
                      for (let i = 0; i < 3; i++) {
                        const exampleKey = `example-${i}`;
                        droneFlightLengths[exampleKey] = [3.2, 2.8, 4.1][i];
                      }
                    }
                  }

                  // 计算总长度（千米）
                  const totalLength = Object.values(droneFlightLengths).reduce(
                    (sum, length) => sum + length,
                    0
                  );

                  // 生成呼号映射
                  const callsignMap: Record<string, string> = {};
                  mappings.forEach((mapping, index) => {
                    // 在实际数据中获取物理无人机的序列号或呼号作为显示名称
                    callsignMap[mapping.selected_drone_key] =
                      mapping.physical_drone_callsign || `无人机${index + 1}`;
                  });

                  // 获取有飞行长度数据的无人机键列表
                  const droneKeysWithFlightData =
                    Object.keys(droneFlightLengths);

                  // 无人机实际数量（有飞行数据的无人机数量）
                  const actualDroneCount = hasRealFlightData
                    ? droneKeysWithFlightData.length
                    : drones.length || 3;

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">无人机总数:</span>
                        <span className="font-medium">
                          {actualDroneCount} 台
                        </span>
                      </div>

                      {/* 显示每架无人机的飞行长度 */}
                      {droneKeysWithFlightData.map((droneKey, index) => {
                        // 获取对应的无人机信息
                        const drone = drones.find((d) => d.key === droneKey);

                        // 获取呼号或名称
                        let displayName = "未知";
                        if (callsignMap[droneKey]) {
                          displayName = callsignMap[droneKey];
                        } else if (drone?.name) {
                          displayName = drone.name;
                        } else {
                          displayName = `无人机${index + 1}`;
                        }

                        return (
                          <div key={droneKey} className="flex justify-between">
                            <span className="text-gray-500">
                              {displayName} 飞行长度:
                            </span>
                            <span className="font-medium">
                              {droneFlightLengths[droneKey].toFixed(1)} 千米
                            </span>
                          </div>
                        );
                      })}

                      {/* 如果没有无人机数据，显示示例数据 */}
                      {droneKeysWithFlightData.length === 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              无人机 1 飞行长度:
                            </span>
                            <span className="font-medium">3.2 千米</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              无人机 2 飞行长度:
                            </span>
                            <span className="font-medium">2.8 千米</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              无人机 3 飞行长度:
                            </span>
                            <span className="font-medium">4.1 千米</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                        <span>飞行总长度:</span>
                        <span>{totalLength.toFixed(1)} 千米</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 检测结果统计 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">
              检测结果统计
            </h2>
            {resultQuery.isLoading ? (
              <div className="flex items-center justify-center h-24">
                <span>加载中...</span>
              </div>
            ) : resultQuery.isError ? (
              <div className="flex items-center justify-center h-24 text-red-500">
                <span>加载失败</span>
              </div>
            ) : !resultQuery.data?.items?.length ? (
              <div className="flex items-center justify-center h-24 text-gray-500">
                <span>暂无检测结果</span>
              </div>
            ) : (
              <div>
                {/* 计算不同类型的检测结果数量 */}
                {(() => {
                  const resultsByType: Record<string, number> = {};
                  resultQuery.data.items.forEach((item) => {
                    resultsByType[item.target_label] =
                      (resultsByType[item.target_label] || 0) + 1;
                  });

                  return (
                    <div className="space-y-2 mb-4">
                      {Object.entries(resultsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-gray-500">{type}:</span>
                          <span className="font-medium">{count} 个</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold mt-2 pt-2">
                        <span>检测总数:</span>
                        <span>{resultQuery.data.items.length} 个</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 检测结果列表 */}
          <div>
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">
              检测结果列表
            </h2>
            <SearchResultList
              searchResults={resultQuery.data?.items || []}
              onResultClick={(result) => {
                console.log("点击搜索结果", result);
                // 处理点击事件，例如在地图上显示标记并打开信息窗体
                if (
                  mapRef.current &&
                  AMapRef.current &&
                  result.lng &&
                  result.lat
                ) {
                  const wgsLng = parseFloat(result.lng);
                  const wgsLat = parseFloat(result.lat);
                  const [gcjLng, gcjLat] = transformWGS84ToGCJ02(
                    wgsLng,
                    wgsLat
                  );

                  // 关闭所有已打开的信息窗体
                  infoWindowsRef.current.forEach((window) => {
                    window.close();
                  });

                  // 找到对应的信息窗体
                  const resultIndex = resultQuery.data?.items.findIndex(
                    (item) => item.id === result.id
                  );

                  if (resultIndex !== undefined && resultIndex >= 0) {
                    const infoWindow = infoWindowsRef.current[resultIndex];
                    if (infoWindow) {
                      infoWindow.open(mapRef.current, [gcjLng, gcjLat]);
                    }
                  }

                  // 调整地图视图
                  mapRef.current.setZoomAndCenter(17, [gcjLng, gcjLat]);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
