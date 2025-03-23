"use client";

import { getJobDetailById } from "@/app/(main)/jobs/[id]/request";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import DroneMonitorPanel from "./right-panel";

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
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);

  // 记录所有地图元素的引用，以便清除
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 处理drones和mappings数据，生成合并后的无人机数据
  const processedDrones = () => {
    if (!query.data || !query.data.drones || !query.data.mappings) return [];

    const { drones, mappings } = query.data;

    // 将mappings中的信息合并到对应的drone型号中
    return mappings.map((mapping) => {
      // 查找对应的drone型号数据
      const droneType = drones.find(
        (d) => d.key === mapping.selected_drone_key
      );
      if (!droneType) return mapping; // 如果没找到对应型号，直接返回mapping数据
      console.log("droneType", droneType, mapping);
      

      // 合并drone型号数据和mapping中的具体无人机数据
      return {
        ...droneType,
        ...mapping,
        // 确保保留mapping中的重要字段，如sn等
        sn: mapping.physical_drone_sn,
        callsign: mapping.physical_drone_callsign,
        model: droneType.name,
      };
    });
  };

  // 完成数据加载后开始处理挂载地图逻辑
  // 首次渲染时挂载地图，并添加AMapRef
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    };

    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba", // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        if (!AMapRef.current) return;

        mapRef.current = new AMapRef.current.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });
        // 添加工具条
        AMap.plugin(["AMap.ToolBar", "AMap.Scale"], () => {
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
    const { area, drones, waylines, mappings } = query.data;
    console.log("map", area, drones, waylines, mappings);
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
              offset: new AMapRef.current!.Pixel(-8, -8), // 居中偏移
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
            });

            // 为每个标记添加鼠标悬停信息窗口
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

  return (
    <div className="px-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="h-[calc(100vh-160px)] flex-1 border rounded-md shadow-sm"
        />
        {/* 右侧边栏组件 - 传递合并后的drones数据 */}
        <DroneMonitorPanel
          drones={processedDrones()}
          mapRef={mapRef}
          AMapRef={AMapRef}
        />
      </div>
    </div>
  );
}
