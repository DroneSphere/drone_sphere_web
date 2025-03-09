"use client";

import { DroneState } from "@/api/drone/drone";
import { baseURL } from "@/api/http_client";
import { fetchJobDetail } from "@/api/job/request";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  Battery,
  BatteryCharging,
  Compass,
  Navigation,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function JobDetailPage() {
  const pathname = usePathname();
  const id = pathname.split("/")[3];
  const query = useQuery({
    queryKey: ["jobs", id],
    queryFn: () => {
      return fetchJobDetail(Number(id));
    },
  });
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});

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
    console.log("map", query.data, AMapRef.current, mapRef.current);

    if (!AMapRef.current || !mapRef.current || !query.data) return;
    const { area, drones } = query.data;
    console.log("map", area, drones);
    if (!area || !area.points || !drones) return;
    // 清除地图上的所有覆盖物
    mapRef.current.clearMap();

    // 添加区域
    const points = area.points?.map((point) => {
      return new AMap.LngLat(point.lng, point.lat);
    });
    const polygon = new AMap.Polygon();
    polygon.setPath(points);
    polygon.setMap(mapRef.current);
    mapRef.current.setFitView();
  }, [query.data, AMapRef.current, mapRef.current]);

  // SSE处理逻辑
  useEffect(() => {
    if (!query.data || query.isLoading || !query.data.drones) return;
    console.log("drones", query.data.drones);

    const eventSources: EventSource[] = [];

    query.data.drones.forEach((drone) => {
      if (!drone.sn) return; // 确保有sn

      const droneSN = drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`; // 添加sn参数以便服务器识别

      const source = new EventSource(sseUrl);
      eventSources.push(source);

      source.onmessage = (event) => {
        const newState: DroneState = JSON.parse(event.data);

        setDroneStates((prev) => ({
          ...prev,
          [droneSN]: newState,
        }));
        // 绘制飞机位置
        if (!AMapRef.current || !mapRef.current) return;
        const lng = newState.lng;
        const lat = newState.lat;
        const marker = new AMap.Marker({
          position: new AMap.LngLat(lng, lat),
          title: drone.callsign || droneSN,
        });

        // 更新marker
        setDroneMarkers((prev) => ({
          ...prev,
          [droneSN]: marker,
        }));
        // 如果是首次渲染，则添加marker
        if (!droneMarkers[droneSN]) {
          mapRef.current.add(marker);
        } else {
          // 如果不是首次渲染，则先移除marker再添加
          droneMarkers[droneSN]?.setMap(null);
          mapRef.current.add(marker);
          marker.setMap(mapRef.current);
        }
        // 打印SSE消息
        console.log(`SSE message for drone ${droneSN}:`, newState);
      };

      source.onerror = (error) => {
        console.error(`SSE error for drone ${droneSN}:`, error);
        source.close();
      };
    });

    return () => {
      eventSources.forEach((source) => source.close());
    };
  }, [query.data, query.isLoading, droneStates]);

  return (
    <div className="px-4">
      <div className="text-2xl font-semibold mb-4">任务详情</div>

      <div className="flex space-x-4 mb-4">
        <div
          id="map"
          className="h-[calc(100vh-160px)] w-full border rounded-md shadow-sm"
        />
        <div className="flex flex-col gap-4 w-[660px]">
          {query.data?.drones &&
            query.data.drones.map((drone, index) => (
              <Card key={index} className="w-full h-min">
                <CardHeader className="p-4">
                  <CardTitle>{drone.callsign || drone.sn}</CardTitle>
                  <CardDescription>
                    {drone.sn} - {drone.model}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-0">
                  <div className="grid grid-cols-12 gap-2 text-sm">
                    {/* 位置信息组 - 左列 */}
                    <div className="col-span-5 space-y-1">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 opacity-75" />
                        <span className="font-medium">位置状态</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <span className="w-12 min-w-[3rem]">经度:</span>
                          <span className="font-mono">
                            {(drone.sn &&
                              droneStates[drone.sn]?.lng.toFixed(6)) ??
                              "--"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-12 min-w-[3rem]">纬度:</span>
                          <span className="font-mono">
                            {(drone.sn &&
                              droneStates[drone.sn]?.lat.toFixed(6)) ??
                              "--"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 飞行状态组 - 中列 */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 opacity-75" />
                        <span className="font-medium">飞行状态</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-4 w-4" />
                          <span className="w-12 min-w-[3rem]">高度:</span>
                          <span className="font-mono">
                            {(drone.sn && droneStates[drone.sn]?.height) ??
                              "--"}
                            m
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4" />
                          <span className="w-12 min-w-[3rem]">速度:</span>
                          <span className="font-mono">
                            {(drone.sn && droneStates[drone.sn]?.speed) ?? "--"}
                            m/s
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-4 w-4" />
                          <span className="w-12 min-w-[3rem]">航向:</span>
                          <span className="font-mono">
                            {(drone.sn && droneStates[drone.sn]?.heading) ??
                              "--"}
                            °
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 电池信息组 - 右列 */}
                    <div className="col-span-3 flex flex-col items-end space-y-2">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 opacity-75" />
                        <span className="font-medium">电量状态</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="h-4 w-4 opacity-75" />
                        <span className="font-medium">
                          {(drone.sn && droneStates[drone.sn]?.battery) ?? "--"}
                          %
                        </span>
                      </div>
                      <div className="h-6 w-full rounded bg-gradient-to-r from-green-400 to-green-600/80 p-0">
                        <div
                          className="h-full rounded-r bg-background/80"
                          style={{
                            width: `${
                              100 -
                              (Number(
                                drone.sn && droneStates[drone.sn]?.battery
                              ) || 0)
                            }%`,
                            marginLeft: "auto",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-4 p-4">
                  <Button size="sm" variant="outline">
                    返航
                  </Button>
                  <Button size="sm">开始</Button>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
