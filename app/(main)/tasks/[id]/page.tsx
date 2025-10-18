"use client";

import { baseURL } from "@/api/http_client";
import { DroneRTState } from "@/app/(main)/drones/types";
import { JobDetailResult } from "@/app/(main)/jobs/[id]/types";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { formatDronesData } from "../../jobs/[id]/data-utils";
import {
  getJobCreateOptions,
  getJobDetailById,
} from "../../jobs/[id]/requests";
import DroneCardList from "./drone-card-list";

// 地图数据持久化接口
interface MapDataState {
  id: string;
  area: any;
  waylines: any[];
  drones: any[];
  droneOptions: any[];
  timestamp: number;
}

export default function JobDetailPage() {
  const pathname = usePathname();
  const id = pathname.split("/")[2];

  const query = useQuery<JobDetailResult>({
    queryKey: ["jobs", id, "taskDetail"],
    queryFn: () => {
      return getJobDetailById(Number(id));
    },
  });
  const optionsQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => getJobCreateOptions(),
  });

  // 地图数据持久化键
  const mapDataKey = `map_data_${id}`;

  // 保存地图数据到 localStorage
  const saveMapData = useCallback((data: MapDataState) => {
    if (typeof window === 'undefined') return; // 防止SSR错误

    try {
      localStorage.setItem(mapDataKey, JSON.stringify(data));
    } catch (error) {
      console.warn("保存地图数据失败:", error);
    }
  }, [mapDataKey]);

  // 从 localStorage 获取地图数据
  const getSavedMapData = useCallback((): MapDataState | null => {
    if (typeof window === 'undefined') return null; // 防止SSR错误

    try {
      const saved = localStorage.getItem(mapDataKey);
      if (saved) {
        const data = JSON.parse(saved) as MapDataState;
        // 检查数据是否过期（24小时）
        const now = Date.now();
        if (now - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        } else {
          // 清除过期数据
          localStorage.removeItem(mapDataKey);
        }
      }
    } catch (error) {
      console.warn("获取地图数据失败:", error);
      localStorage.removeItem(mapDataKey);
    }
    return null;
  }, [mapDataKey]);

  // 地图相关引用
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 地图初始化状态
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [mapDataLoaded, setMapDataLoaded] = useState(false);

  // 无人机状态管理
  const [droneRTStates, setDroneRTStates] = useState<
    Record<string, DroneRTState>
  >({});
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});
  const [droneConnections, setDroneConnections] = useState<
    Record<string, boolean>
  >({});
  // const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  // 从保存的数据恢复地图图层
  const restoreMapLayers = useCallback((savedData: MapDataState) => {
    if (!AMapRef.current || !mapRef.current) return;

    console.log("恢复地图图层:", savedData.id);

    try {
      const { area, waylines, drones, droneOptions } = savedData;
      const droneStates = formatDronesData(drones, droneOptions);

      // 检查地图是否真的需要恢复（可能已经有图层了）
      const existingOverlays = mapRef.current.getAllOverlays();
      if (existingOverlays && existingOverlays.length > 0) {
        console.log("地图已有图层，跳过恢复");
        setMapDataLoaded(true);
        return;
      }

      // 清除当前地图元素
      mapRef.current.clearMap();
      polygonsRef.current = [];
      polylinesRef.current = [];
      markersRef.current = [];

      // 延迟执行恢复，确保地图完全就绪
      setTimeout(() => {
        if (!mapRef.current || !AMapRef.current) return;

        // 添加区域
        const areaPoints = area.points?.map((point: any) => {
          return new AMap.LngLat(point.lng, point.lat);
        });
        if (areaPoints && areaPoints.length > 0) {
          const polygon = new AMapRef.current.Polygon();
          polygon.setOptions({
            path: areaPoints,
            strokeColor: "#3366FF",
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: "#3366FF",
            fillOpacity: 0.3,
            zIndex: 50,
          });
          polygonsRef.current.push(polygon);
          mapRef.current.add(polygon);
        }

        // 添加航线
        if (waylines && waylines.length > 0) {
          waylines.forEach((wayline: any, index: number) => {
            const drone = droneStates.find((d) => d.key === wayline.drone_key);
            if (!drone) return;

            // 创建航线区域多边形
            const waylinePath = wayline.path.map((point: any) => {
              return new AMapRef.current!.LngLat(point.lng, point.lat);
            });
            if (waylinePath && waylinePath.length > 0) {
              const waylinePolygon = new AMapRef.current!.Polygon();
              waylinePolygon.setOptions({
                path: waylinePath,
                strokeColor: drone.color,
                strokeWeight: 2,
                strokeOpacity: 1,
                fillColor: drone.color,
                fillOpacity: 0.3,
                zIndex: 100,
              });
              polygonsRef.current.push(waylinePolygon);
              mapRef.current!.add(waylinePolygon);
            }

            // 如果有具体航点，绘制为折线
            if (wayline.waypoints && wayline.waypoints.length > 0) {
              const waylineRoutePoints = wayline.waypoints.map((point: any) => {
                return new AMapRef.current!.LngLat(point.lng, point.lat);
              });

              const polyline = new AMapRef.current!.Polyline({
                path: waylineRoutePoints,
                strokeColor: drone.color,
                strokeWeight: 4,
                strokeOpacity: 0.9,
                strokeStyle: "solid",
                strokeDasharray: [10, 5],
                lineJoin: "round",
                lineCap: "round",
                showDir: true,
              });
              polylinesRef.current.push(polyline);
              mapRef.current!.add(polyline);

              // 在每个转折点添加圆形标记
              const waylineMarkers: AMap.Marker[] = [];
              markersRef.current[index] = waylineMarkers;

              waylineRoutePoints.forEach((point: any, pointIndex: number) => {
                const marker = new AMapRef.current!.Marker({
                  position: point,
                  content: `<div style="
                    background-color: ${drone.color};
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                  ">${pointIndex + 1}</div>`,
                  offset: new AMapRef.current!.Pixel(-8, -8),
                });

                const markerInfo = new AMapRef.current!.InfoWindow({
                  content: `<div style="padding: 5px;">
                            <p>航点 ${pointIndex + 1}</p>
                            <p>经度: ${point.getLng().toFixed(6)}</p>
                            <p>纬度: ${point.getLat().toFixed(6)}</p>
                          </div>`,
                  offset: new AMapRef.current!.Pixel(0, -20),
                });

                AMapRef.current!.Event.addListener(marker, "mouseover", () => {
                  markerInfo.open(mapRef.current!, [
                    point.getLng(),
                    point.getLat(),
                  ]);
                });

                AMapRef.current!.Event.addListener(marker, "mouseout", () => {
                  markerInfo.close();
                });

                waylineMarkers.push(marker);
                mapRef.current!.add(marker);
              });
            }
          });
        }

        // 调整视图以包含所有覆盖物
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setFitView();
          }
        }, 100);

        setMapDataLoaded(true);
        console.log("地图图层恢复完成");
      }, 100); // 短暂延迟确保地图状态稳定

    } catch (error) {
      console.error("恢复地图图层时出错:", error);
      setMapDataLoaded(false);
    }
  }, []);

  // 首次渲染时挂载地图
  useEffect(() => {
    // 如果地图已经初始化，不重复初始化
    if (isMapInitialized) return;

    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba",
      version: "2.0",
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        if (!AMapRef.current) return;

        // 检查地图容器是否存在
        const mapContainer = document.getElementById("map");
        if (!mapContainer) {
          console.error("地图容器未找到");
          return;
        }

        mapRef.current = new AMapRef.current.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });

        AMap.plugin(["AMap.ToolBar", "AMap.Scale", "AMap.MapType"], () => {
          // 添加地图控件
          const mapType = new AMap.MapType({
            defaultType: 0,
          });
          mapRef.current?.addControl(mapType);
          const toolBar = new AMap.ToolBar();
          const scale = new AMap.Scale();
          mapRef.current?.addControl(toolBar);
          mapRef.current?.addControl(scale);

          // 地图初始化完成，设置状态
          setIsMapInitialized(true);

          // 尝试恢复保存的地图数据
          const savedData = getSavedMapData();
          if (savedData) {
            console.log("发现保存的地图数据，开始恢复");
            restoreMapLayers(savedData);
          }
        });
      })
      .catch((e) => {
        console.error("地图加载失败:", e);
      });

    return () => {
      // 不要销毁地图，因为页面切换时需要保持
      // mapRef.current?.destroy();
    };
  }, [isMapInitialized, getSavedMapData, restoreMapLayers]);

  // 数据刷新时修改地图
  useEffect(() => {
    if (
      !AMapRef.current ||
      !mapRef.current ||
      !query.data ||
      !optionsQuery.data ||
      !isMapInitialized
    )
      return;

    // 如果已经从保存的数据恢复，则不需要重新绘制
    if (mapDataLoaded) return;

    const { area, waylines } = query.data;
    const droneStates = formatDronesData(
      query.data.drones,
      optionsQuery.data?.drones
    );

    // 清除之前的地图元素
    mapRef.current.clearMap();
    polygonsRef.current = [];
    polylinesRef.current = [];
    markersRef.current = [];

    // 添加区域
    const areaPoints = area.points?.map((point) => {
      return new AMap.LngLat(point.lng, point.lat);
    });
    const polygon = new AMapRef.current.Polygon();
    polygon.setOptions({
      path: areaPoints,
      strokeColor: "#3366FF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#3366FF",
      fillOpacity: 0.3,
      zIndex: 50,
    });
    polygonsRef.current.push(polygon);
    mapRef.current.add(polygon);

    // 添加航线
    if (waylines && waylines.length > 0) {
      waylines.forEach((wayline, index) => {
        const drone = droneStates.find((d) => d.key === wayline.drone_key);
        if (!drone) {
          console.log("未查询到无人机信息", drone);
          return;
        }

        // 创建航线区域多边形
        const waylinePath = wayline.path.map((point) => {
          return new AMapRef.current!.LngLat(point.lng, point.lat);
        });
        const waylinePolygon = new AMapRef.current!.Polygon();
        waylinePolygon.setOptions({
          path: waylinePath,
          strokeColor: drone.color, // 使用匹配到的无人机颜色
          strokeWeight: 2,
          strokeOpacity: 1,
          fillColor: drone.color, // 使用匹配到的无人机颜色
          fillOpacity: 0.3,
          zIndex: 100,
        });
        polygonsRef.current.push(waylinePolygon);
        mapRef.current!.add(waylinePolygon);

        // 如果有具体航点，绘制为折线
        if (wayline.waypoints && wayline.waypoints.length > 0) {
          const waylineRoutePoints = wayline.waypoints.map((point) => {
            return new AMapRef.current!.LngLat(point.lng, point.lat);
          });

          // 创建折线
          const polyline = new AMapRef.current!.Polyline({
            path: waylineRoutePoints,
            strokeColor: drone.color, // 使用匹配到的无人机颜色
            strokeWeight: 4,
            strokeOpacity: 0.9,
            strokeStyle: "solid",
            strokeDasharray: [10, 5],
            lineJoin: "round",
            lineCap: "round",
            showDir: true,
          });
          polylinesRef.current.push(polyline);
          mapRef.current!.add(polyline);

          // 在每个转折点添加圆形标记
          const waylineMarkers: AMap.Marker[] = [];
          markersRef.current[index] = waylineMarkers;

          waylineRoutePoints.forEach((point, pointIndex) => {
            const marker = new AMapRef.current!.Marker({
              position: point,
              content: `<div style="
                background-color: ${drone.color}; /* 使用匹配到的无人机颜色 */
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
              ">${pointIndex + 1}</div>`,
              offset: new AMapRef.current!.Pixel(-8, -8),
            });

            const markerInfo = new AMapRef.current!.InfoWindow({
              content: `<div style="padding: 5px;">
                        <p>航点 ${pointIndex + 1}</p>
                        <p>经度: ${point.getLng().toFixed(6)}</p>
                        <p>纬度: ${point.getLat().toFixed(6)}</p>
                      </div>`,
              offset: new AMapRef.current!.Pixel(0, -20),
            });

            AMapRef.current!.Event.addListener(marker, "mouseover", () => {
              markerInfo.open(mapRef.current!, [
                point.getLng(),
                point.getLat(),
              ]);
            });

            AMapRef.current!.Event.addListener(marker, "mouseout", () => {
              markerInfo.close();
            });

            waylineMarkers.push(marker);
            mapRef.current!.add(marker);
          });
        }
      });
    }

    mapRef.current.setFitView();

    // 保存地图数据以供后续恢复
    const mapData: MapDataState = {
      id: id,
      area: area,
      waylines: waylines,
      drones: query.data.drones,
      droneOptions: optionsQuery.data.drones,
      timestamp: Date.now(),
    };
    saveMapData(mapData);
  }, [optionsQuery.data, optionsQuery.data?.drones, query.data, isMapInitialized, mapDataLoaded, id, saveMapData]);

  // SSE连接管理
  useEffect(() => {
    const droneStates = formatDronesData(
      query.data?.drones,
      optionsQuery.data?.drones
    );
    // 初始化连接状态
    setDroneConnections((prev) => {
      const updatedConnections = { ...prev };
      droneStates.forEach((drone) => {
        if (
          drone.physical_drone_id &&
          updatedConnections[drone.physical_drone_sn!] === undefined
        ) {
          updatedConnections[drone.physical_drone_sn!] = false;
        }
      });
      return updatedConnections;
    });

    // 创建和保存EventSource实例
    droneStates.forEach((drone) => {
      if (!drone.physical_drone_sn) return;
      if (eventSourcesRef.current[drone.physical_drone_sn]) return;

      const droneSN = drone.physical_drone_sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`;
      const source = new EventSource(sseUrl);
      eventSourcesRef.current[droneSN] = source;

      source.onopen = () => {
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: true,
        }));
      };

      source.onmessage = (event) => {
        try {
          const newState: DroneRTState = JSON.parse(event.data);
          // console.log("New state", event.data);

          setDroneRTStates((prev) => ({
            ...prev,
            [droneSN]: newState,
          }));
          setDroneConnections((prev) => ({
            ...prev,
            [droneSN]: true,
          }));
        } catch (error) {
          console.error(`Error processing message for ${droneSN}:`, error);
        }
      };

      source.onerror = () => {
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: false,
        }));
        // Consider closing and removing the EventSource instance from eventSourcesRef.current here
        source.close();
        delete eventSourcesRef.current[droneSN];
      };
    });

    const currentEventSources = eventSourcesRef.current;
    return () => {
      Object.keys(currentEventSources).forEach((key) => {
        currentEventSources[key]?.close();
        delete currentEventSources[key];
      });
    };
  }, [optionsQuery.data?.drones, query.data?.drones]); // 添加 processedDrones 到依赖项

  // 无人机位置标记更新
  useEffect(() => {
    if (!AMapRef.current || !mapRef.current) return;

    Object.entries(droneRTStates).forEach(([droneSN, state]) => {
      // console.log("update marker", droneSN, state);

      const drone = query!.data!.drones.find(
        (d) => d.physical_drone!.sn === droneSN
      );
      if (!drone) {
        console.log("1111");
        return;
      } else {
        // console.log("drone found", drone);
      }

      const lng = state.lng;
      const lat = state.lat;
      const droneColor = drone.color || "#3366FF";
      const markerContent = `
        <div style="position: relative;">
          <div style="
            width: 28px; 
            height: 28px; 
            background-color: ${droneColor}; 
            border-radius: 50%; 
            border: 2px solid white;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            transform: rotate(${state.heading || 0}deg);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            white-space: nowrap;
          ">${drone.physical_drone?.callsign || droneSN}</div>
        </div>
      `;

      const existingMarker = droneMarkers[droneSN];
      if (existingMarker) {
        // console.log("Marker 已存在");
        existingMarker.setPosition([lng, lat]);
        existingMarker.setContent(markerContent);
        // console.log("Marker 已更新");
      } else {
        // console.log("创建新 Marker");
        try {
          const marker = new AMapRef.current!.Marker({
            position: new AMapRef.current!.LngLat(lng, lat),
            title: drone.physical_drone?.callsign || droneSN,
            content: markerContent,
            anchor: "center",
            zIndex: 100,
          });

          mapRef.current!.add(marker);
          setDroneMarkers((prev) => ({
            ...prev,
            [droneSN]: marker,
          }));
        } catch (error) {
          console.error(`Error creating marker for drone ${droneSN}:`, error);
        }
        // console.log("新 Marker 创建");
      }
    });

    // Object.entries(droneMarkers).forEach(([sn, marker]) => {
    //   if (!droneRTStates[sn] && marker) {
    //     mapRef.current?.remove(marker);
    //     setDroneMarkers((prev) => {
    //       const updated = { ...prev };
    //       delete updated[sn];
    //       return updated;
    //     });
    //   }
    // });
  }, [droneRTStates, droneMarkers, query.data, query]); // 添加 droneMarkers 和 processedDrones 到依赖项

  // 页面可见性变化和焦点变化处理
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    const checkAndRestoreMap = () => {
      if (isMapInitialized && AMapRef.current && mapRef.current) {
        // 多种方式检查地图状态
        const mapDestroyed = !mapRef.current ||
                           mapRef.current.getCenter() === null ||
                           mapRef.current.getZoom() === undefined ||
                           mapRef.current.getSize() === null;

        if (mapDestroyed) {
          console.log("检测到地图被销毁，需要重新初始化");
          setIsMapInitialized(false);
          setMapDataLoaded(false);
        } else {
          // 检查地图是否缺少图层（通过检查是否有覆盖物）
          const overlays = mapRef.current.getAllOverlays('polygon');
          const hasPolygons = overlays && overlays.length > 0;

          if (!hasPolygons && !mapDataLoaded) {
            console.log("检测到地图缺少图层，尝试恢复");
            const savedData = getSavedMapData();
            if (savedData) {
              console.log("从保存的数据恢复地图图层");
              restoreMapLayers(savedData);
            }
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("页面重新可见，检查地图状态");
        checkAndRestoreMap();
      }
    };

    const handleWindowFocus = () => {
      console.log("窗口获得焦点，检查地图状态");
      checkAndRestoreMap();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      console.log("页面显示，检查地图状态", event.persisted);
      checkAndRestoreMap();
    };

    // 添加各种事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handlePageShow);

    // 添加定期检查（每5秒检查一次，但只在页面可见时）
    const startPeriodicCheck = () => {
      if (!document.hidden && !checkInterval) {
        checkInterval = setInterval(() => {
          checkAndRestoreMap();
        }, 5000);
      }
    };

    const stopPeriodicCheck = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    };

    const handleVisibilityChangeWithPeriodic = () => {
      if (!document.hidden) {
        startPeriodicCheck();
      } else {
        stopPeriodicCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChangeWithPeriodic);
    startPeriodicCheck(); // 初始启动定期检查

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChangeWithPeriodic);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handlePageShow);
      stopPeriodicCheck();
    };
  }, [isMapInitialized, mapDataLoaded, getSavedMapData, restoreMapLayers]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      // 清理事件监听器
      document.removeEventListener('visibilitychange', () => {});
    };
  }, []);

  // 搜索结果管理
  // useEffect(() => {
  //   const jobId = id;
  //   const intervalId = setInterval(async () => {
  //     try {
  //       const result = await getSearchResults(jobId);
  //       setSearchResults(result.data.items);
  //     } catch (error) {
  //       console.error("获取搜索结果失败:", error);
  //     }
  //   }, 3000);

  //   return () => clearInterval(intervalId);
  // }, [id]);

  // 处理搜索结果点击
  // const handleSearchResultClick = (result: SearchResultItem) => {
  //   if (!mapRef.current) return;
  //   console.log("SearchResultItem", result);

  //   // mapRef.current.setCenter([Number(result.lng), Number(result.lat)]);
  //   // mapRef.current.setZoom(18);
  // };

  return (
    <div className="px-4 h-[calc(100vh-160px)]">
      <div className="flex gap-2 sm:gap-4 h-full">
        <div
          id="map"
          className="flex-1 border rounded-md shadow-sm"
        />
        {/* 右侧面板 */}
        <div className="hidden sm:flex flex-col gap-3 w-80 max-h-full">
          {/* 实时数据区域 */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {query.data && query.data.drones && optionsQuery.data && (
              <DroneCardList
                drones={formatDronesData(
                  query.data.drones,
                  optionsQuery.data.drones
                )}
                droneRTStates={droneRTStates}
                droneConnections={droneConnections}
              />
            )}
          </div>
        </div>

        {/* 移动端浮动按钮 */}
        <div className="sm:hidden fixed bottom-4 right-4 z-50">
          <button
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
            onClick={() => {
              const panel = document.getElementById('mobile-drone-panel');
              if (panel) {
                panel.classList.toggle('hidden');
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 移动端面板 */}
        <div
          id="mobile-drone-panel"
          className="sm:hidden fixed inset-0 bg-white z-40 hidden overflow-auto"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">无人机列表</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  const panel = document.getElementById('mobile-drone-panel');
                  if (panel) {
                    panel.classList.add('hidden');
                  }
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {query.data && query.data.drones && optionsQuery.data && (
              <DroneCardList
                drones={formatDronesData(
                  query.data.drones,
                  optionsQuery.data.drones
                )}
                droneRTStates={droneRTStates}
                droneConnections={droneConnections}
              />
            )}
          </div>
        </div>

        {/* <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold mb-3 pb-2">搜索结果</h2>
          <SearchResultList
            searchResults={searchResults}
            onResultClick={handleSearchResultClick}
          />
        </div> */}
      </div>
    </div>
  );
}
