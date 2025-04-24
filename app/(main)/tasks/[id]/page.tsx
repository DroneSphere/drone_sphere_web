"use client";

import { DroneState } from "@/app/(main)/drones/types";
import { baseURL } from "@/api/http_client";
import { getJobDetailById } from "@/app/(main)/jobs/[id]/request";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchResultItem } from "./type";
import { getSearchResults } from "./request";
import DroneCardList from "./drone-card-list";
import SearchResultList from "./search-result-list";

export default function JobDetailPage() {
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  console.log("JobDetailPage", id);

  const query = useQuery({
    queryKey: ["jobs", id],
    queryFn: () => {
      return getJobDetailById(Number(id));
    },
  });

  // 地图相关引用
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 无人机状态管理
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});
  const [droneConnections, setDroneConnections] = useState<
    Record<string, boolean>
  >({});
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  // 处理drones和mappings数据，生成合并后的无人机数据
  const processedDrones = () => {
    if (!query.data || !query.data.drones || !query.data.mappings) return [];

    const { drones, mappings } = query.data;

    return mappings.map((mapping) => {
      const droneType = drones.find(
        (d) => d.key === mapping.selected_drone_key
      );
      if (!droneType)
        return {
          ...mapping,
          color: "#FF0000", // 为未找到型号的无人机设置默认颜色
        };

      // 合并drone型号数据和mapping中的具体无人机数据
      return {
        ...droneType,
        ...mapping,
        sn: mapping.physical_drone_sn,
        callsign: mapping.physical_drone_callsign,
        model: droneType.name,
        color: droneType.color || "#3366FF", // 确保color属性存在
      };
    });
  };

  // 首次渲染时挂载地图
  useEffect(() => {
    // window._AMapSecurityConfig = {
    //   securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    // };

    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba",
      version: "2.0",
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        if (!AMapRef.current) return;

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
        });
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  // 数据刷新时修改地图
  useEffect(() => {
    if (!AMapRef.current || !mapRef.current || !query.data) return;
    const { area, drones, waylines } = query.data;
    if (!area || !area.points || !drones) return;

    // 清除之前的地图元素
    mapRef.current.clearMap();
    polygonsRef.current = [];
    polylinesRef.current = [];
    markersRef.current = [];

    // 添加区域
    const points = area.points?.map((point) => {
      return new AMap.LngLat(point.lng, point.lat);
    });
    const polygon = new AMapRef.current.Polygon();
    polygon.setOptions({
      path: points,
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
        const drone = drones.find((d) => d.key === wayline.drone_key) || {
          color: "#FF0000",
          name: "未知无人机",
        };

        // 创建航线区域多边形
        const waylinePath = wayline.path.map((point) => {
          return new AMapRef.current!.LngLat(point.lng, point.lat);
        });
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

        // 如果有具体航点，绘制为折线
        if (wayline.points && wayline.points.length > 0) {
          const points = wayline.points.map((point) => {
            return new AMapRef.current!.LngLat(point.lng, point.lat);
          });

          // 创建折线
          const polyline = new AMapRef.current!.Polyline({
            path: points,
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

          points.forEach((point, pointIndex) => {
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

    mapRef.current.setFitView();
  }, [query.data]);

  // SSE连接管理
  useEffect(() => {
    const drones = processedDrones();
    if (!drones || drones.length === 0) return;

    // 初始化连接状态
    setDroneConnections((prev) => {
      const updatedConnections = { ...prev };
      drones.forEach((drone) => {
        if (
          drone.physical_drone_sn &&
          updatedConnections[drone.physical_drone_sn] === undefined
        ) {
          updatedConnections[drone.physical_drone_sn] = false;
        }
      });
      return updatedConnections;
    });

    // 创建和保存EventSource实例
    drones.forEach((drone) => {
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
          const newState: DroneState = JSON.parse(event.data);
          setDroneStates((prev) => ({
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
      };
    });

    const currentEventSources = eventSourcesRef.current;
    return () => {
      Object.keys(currentEventSources).forEach((key) => {
        currentEventSources[key]?.close();
        delete currentEventSources[key];
      });
    };
  }, [query.data]);

  // 无人机位置标记更新
  useEffect(() => {
    if (!AMapRef.current || !mapRef.current) return;

    Object.entries(droneStates).forEach(([droneSN, state]) => {
      const drone = processedDrones().find(
        (d) => d.physical_drone_sn === droneSN
      );
      if (!drone) return;

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
          ">${drone.physical_drone_callsign || droneSN}</div>
        </div>
      `;

      const existingMarker = droneMarkers[droneSN];
      if (existingMarker) {
        existingMarker.setPosition([lng, lat]);
        existingMarker.setContent(markerContent);
      } else {
        try {
          const marker = new AMapRef.current!.Marker({
            position: new AMapRef.current!.LngLat(lng, lat),
            title: drone.physical_drone_callsign || droneSN,
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
      }
    });

    Object.entries(droneMarkers).forEach(([sn, marker]) => {
      if (!droneStates[sn] && marker) {
        mapRef.current?.remove(marker);
        setDroneMarkers((prev) => {
          const updated = { ...prev };
          delete updated[sn];
          return updated;
        });
      }
    });
  }, [droneStates]);

  // 搜索结果管理
  useEffect(() => {
    const jobId = id;
    const intervalId = setInterval(async () => {
      try {
        const result = await getSearchResults(jobId);
        setSearchResults(result.data.items);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id]);

  // 处理搜索结果点击
  const handleSearchResultClick = (result: SearchResultItem) => {
    if (!mapRef.current) return;
    console.log("SearchResultItem", result);

    // mapRef.current.setCenter([Number(result.lng), Number(result.lat)]);
    // mapRef.current.setZoom(18);
  };

  return (
    <div className="px-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="h-[calc(100vh-160px)] flex-1 border rounded-md shadow-sm"
        />
        {/* 右侧面板 */}
        <div className="flex flex-col gap-3 w-96 max-h-[calc(100vh-4rem)]">
          {/* 实时数据区域 */}
          <div className="flex-1 h-auto overflow-y-auto flex flex-col gap-3">
            <DroneCardList
              drones={processedDrones()}
              droneStates={droneStates}
              droneConnections={droneConnections}
            />
          </div>

          {/* 搜索结果区域 */}
          <div className="h-[300px] overflow-y-auto flex flex-col">
            <SearchResultList
              searchResults={searchResults}
              onResultClick={handleSearchResultClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
