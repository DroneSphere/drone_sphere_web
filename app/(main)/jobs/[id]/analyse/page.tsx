"use client";

import {
  getJobDetailById,
  getSearchResults,
} from "@/app/(main)/jobs/report/[id]/request";
import { fetchObjectTypeOptions } from "@/app/(main)/result/requests";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import SearchResultList from "./search-result-list";
import GroundTruthInput from "./ground-truth-input";
import GroundTruthList from "./ground-truth-list";
import AnalysisResults from "./analysis-results";
import { usePathname } from "next/navigation";
import { GroundTruthItem, MatchResult, ErrorStatistics } from "./types";
import {
  matchGroundTruthsWithDetections,
  calculateErrorStatistics,
} from "./utils";

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
  // Add new ref for ground truth markers
  const groundTruthMarkersRef = useRef<AMap.Marker[]>([]);

  // 计算工作状态
  const pathname = usePathname().match(/\/jobs\/(\d+)\/analyse/);
  const idPart = pathname ? pathname[1] : "";

  // 当前选中的搜索区域路径
  const [path, setPath] = useState<AMap.LngLat[]>([]);

  // 真值数据管理
  const [groundTruths, setGroundTruths] = useState<GroundTruthItem[]>([]);

  // 分析结果状态
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [errorStatistics, setErrorStatistics] =
    useState<ErrorStatistics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 查询目标类型选项
  const objectTypesQuery = useQuery({
    queryKey: ["objectTypes"],
    queryFn: fetchObjectTypeOptions,
  });

  // 添加真值处理函数
  const handleAddGroundTruth = (groundTruth: GroundTruthItem) => {
    setGroundTruths((prev) => [...prev, groundTruth]);
  };

  // 删除真值处理函数
  const handleDeleteGroundTruth = (id: string) => {
    setGroundTruths((prev) => prev.filter((gt) => gt.id !== id));
  };

  // 执行匹配分析
  const handleStartAnalysis = async () => {
    if (groundTruths.length === 0) {
      alert("请先添加真值数据");
      return;
    }

    if (!resultQuery.data?.items || resultQuery.data.items.length === 0) {
      alert("没有检测结果数据");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('=== 开始匹配分析 ===');
      console.log('真值数据:', groundTruths);
      console.log('检测结果数据:', resultQuery.data.items);
      
      // 执行匹配
      const matches = matchGroundTruthsWithDetections(
        groundTruths,
        resultQuery.data.items,
        50 // 50米匹配距离
      );

      console.log('匹配结果:', matches);

      // 计算统计信息
      const stats = calculateErrorStatistics(matches, resultQuery.data.items.length);
      
      console.log('统计信息:', stats);

      setMatchResults(matches);
      setErrorStatistics(stats);
    } catch (error) {
      console.error("分析过程出错:", error);
      alert("分析过程出错，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 清空分析结果
  const handleClearAnalysis = () => {
    setMatchResults([]);
    setErrorStatistics(null);
  };

  // 在地图上绘制真值标记点
  useEffect(() => {
    if (
      !isMapLoaded ||
      !AMapRef.current ||
      !mapRef.current ||
      groundTruths.length === 0
    ) {
      return;
    }

    const currentMap = mapRef.current;
    const currentAMap = AMapRef.current;

    // 清除之前的真值标记点
    if (groundTruthMarkersRef.current.length > 0) {
      currentMap.remove(groundTruthMarkersRef.current);
      groundTruthMarkersRef.current = [];
    }

    // 为每个真值创建标记点
    const markers: AMap.Marker[] = [];

    groundTruths.forEach((groundTruth) => {
      // 将WGS84坐标转换为GCJ-02坐标（高德地图坐标系）
      const [gcjLng, gcjLat] = transformWGS84ToGCJ02(
        groundTruth.lng,
        groundTruth.lat
      );

      // 创建标记点
      const marker = new currentAMap.Marker({
        position: new currentAMap.LngLat(gcjLng, gcjLat),
        title: `真值: ${groundTruth.target_label}`,
        clickable: true,
        // 添加标签显示
        label: {
          // 标签内容
          content: `真值: ${groundTruth.target_label}`,
          // 标签方向，以右下角为例
          direction: "right",
          // 标签样式
          offset: new currentAMap.Pixel(0, 0),
        },
        // 自定义标记点的图标和样式 - 使用绿色标记图标
        icon: new currentAMap.Icon({
          // 使用绿色标记图标
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png",
          size: new currentAMap.Size(25, 34),
          imageSize: new currentAMap.Size(25, 34),
        }),
      });

      // 添加点击事件监听器
      marker.on("click", () => {
        console.log("点击真值标记", groundTruth);
      });

      markers.push(marker);
    });

    // 将所有标记点添加到地图上
    if (markers.length > 0) {
      currentMap.add(markers);
      groundTruthMarkersRef.current = markers;
    }

    console.log(`已在地图上添加 ${markers.length} 个真值标记点`);
  }, [groundTruths, isMapLoaded, AMapRef, mapRef]);

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

      // 计算区域周长 - 需要复制路径并闭合
      const pathForLength = [...areaPath];
      // 将第一个点添加到末尾以闭合多边形
      pathForLength.push(areaPath[0]);
      // 使用高德地图API计算路径长度（周长）
      const areaLengthInMeters =
        AMapRef.current!.GeometryUtil.distanceOfLine(pathForLength);
      console.log("Area length: ", areaLengthInMeters);
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
  }, [isMapLoaded, AMapRef, mapRef, path]); // 添加 path 到依赖数组中

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
        {/* 左侧地图 */}
        <div className="flex-1">
          <div
            id="map"
            className="h-[calc(100vh-132px)] border rounded-md shadow-sm"
          />
        </div>

        {/* 右侧面板 */}
        <div className="flex-1 h-[calc(100vh-132px)] overflow-y-auto">
          <div className="space-y-4 pr-2">
            {/* 检测结果列表 */}
            <div>
              <h2 className="text-lg font-bold mb-3 pb-2">检测结果列表</h2>
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

            {/* 真值输入 */}
            <GroundTruthInput
              objectTypes={objectTypesQuery.data || []}
              onAddGroundTruth={handleAddGroundTruth}
              isLoading={objectTypesQuery.isLoading}
            />

            {/* 真值列表 */}
            <GroundTruthList
              groundTruths={groundTruths}
              onDeleteGroundTruth={handleDeleteGroundTruth}
              onGroundTruthClick={(groundTruth) => {
                console.log("点击真值", groundTruth);
                // 在地图上定位到该真值
                if (mapRef.current && AMapRef.current) {
                  const [gcjLng, gcjLat] = transformWGS84ToGCJ02(
                    groundTruth.lng,
                    groundTruth.lat
                  );
                  mapRef.current.setZoomAndCenter(17, [gcjLng, gcjLat]);
                }
              }}
            />

            {/* 分析控制按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || groundTruths.length === 0}
                className="flex-1 bg-blue-600 text-white"
              >
                {isAnalyzing ? "分析中..." : "开始匹配分析"}
              </Button>
              {errorStatistics && (
                <Button
                  variant="outline"
                  onClick={handleClearAnalysis}
                  className="flex-1"
                >
                  清空分析
                </Button>
              )}
            </div>

            {/* 分析结果 */}
            {errorStatistics && (
              <AnalysisResults
                statistics={errorStatistics}
                matchResults={matchResults}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
