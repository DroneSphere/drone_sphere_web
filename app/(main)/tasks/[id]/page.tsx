"use client";

import { fetchJobDetail } from "@/app/(main)/jobs/[id]/request";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LeftPanel from "./left-panel";
import DroneMonitorPanel from "./right-panel";

export default function JobDetailPage() {
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const query = useQuery({
    queryKey: ["jobs", id],
    queryFn: () => {
      return fetchJobDetail(Number(id));
    },
  });
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

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
    setIsMapReady(false);
    if (!AMapRef.current || !mapRef.current || !query.data) return;
    const { area, drones } = query.data;
    console.log("map", area, drones);
    if (!area || !area.points || !drones) return;

    // 添加区域
    const points = area.points?.map((point) => {
      return new AMap.LngLat(point.lng, point.lat);
    });
    const polygon = new AMap.Polygon();
    polygon.setPath(points);
    polygon.setMap(mapRef.current);
    mapRef.current.setFitView();
    setIsMapReady(true);
  }, [query.data]);

  return (
    <div className="px-4">
      <div className="flex space-x-4 mb-4">
        {/* 左侧边栏 */}
        <LeftPanel
          id={Number(id)}
          mapRef={mapRef}
          AMapRef={AMapRef}
          isMapReady={isMapReady}
        />
        <div
          id="map"
          className="h-[calc(100vh-160px)] flex-1 border rounded-md shadow-sm"
        />
        {/* 右侧边栏组件 */}
        <DroneMonitorPanel
          drones={query.data?.drones}
          mapRef={mapRef}
          AMapRef={AMapRef}
        />
      </div>
    </div>
  );
}
