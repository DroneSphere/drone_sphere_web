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
  const mapRef = useRef<AMap.Map | null>(null);
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
    if (query.isSuccess && query.data) {
      window._AMapSecurityConfig = {
        securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
      };
      AMapLoader.load({
        key: "82ea7ca3d47546f079185e7ccdade9ba", // 申请好的Web端开发者Key，首次调用 load 时必填
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      })
        .then((AMap) => {
          mapRef.current = new AMap.Map("map", {
            viewMode: "3D", // 是否为3D地图模式
            zoom: 17, // 初始化地图级别
          });

          AMap.plugin(["AMap.ToolBar", "AMap.Scale"], function () {
            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);
            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);
          });

          // 遍历区域，创建多边形
          query.data.forEach((subJob) => {
            console.log(subJob);

            if (subJob.area.points) {
              const path = subJob.area.points.map(
                (point) => new AMap.LngLat(point.lng, point.lat)
              );
              console.log(path);

              const polygon = new AMap.Polygon();
              polygon.setPath(path);
              console.log(polygon);

              mapRef.current?.add(polygon);

              mapRef.current?.setFitView([polygon]);
            }
          });
        })
        .catch((e) => {
          console.log(e);
        });

      return () => {
        mapRef.current?.destroy();
      };
    }
  }, [query.isSuccess, query.data]);

  // SSE处理逻辑
  useEffect(() => {
    if (!query.data || !query.isSuccess) return;

    const eventSources: EventSource[] = [];

    query.data.forEach((subJob) => {
      const droneSN = subJob.drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse`; // 替换为你的SSE接口地址

      const source = new EventSource(sseUrl);
      eventSources.push(source);

      source.onmessage = (event) => {
        const newState: DroneState = JSON.parse(event.data);
        setDroneStates((prev) => ({
          ...prev,
          [droneSN]: newState,
        }));
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
  }, [query.data, query.isSuccess]);

  return (
    <div className="px-4">
      <div className="text-2xl font-semibold mb-4">Job Detail</div>
      {query.isLoading ? (
        <p>Loading...</p>
      ) : query.isError ? (
        <p>Error: {query.error.message}</p>
      ) : (
        <div className="flex space-x-4">
          <div
            id="map"
            className="min-h-[720px] w-full border rounded-md shadow-sm"
          />
          {query.data?.map((subJob, index) => (
            <Card key={index} className="w-[660px] h-min">
              <CardHeader className="p-4">
                <CardTitle>{subJob.drone.name}</CardTitle>
                <CardDescription>
                  {subJob.drone.sn} - {subJob.drone.model}
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
                          {droneStates[subJob.drone.sn]?.lng}°E
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-12 min-w-[3rem]">纬度:</span>
                        <span className="font-mono">
                          {droneStates[subJob.drone.sn]?.lat}°N
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
                          {droneStates[subJob.drone.sn]?.height}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-4 w-4" />
                        <span className="w-12 min-w-[3rem]">速度:</span>
                        <span className="font-mono">
                          {droneStates[subJob.drone.sn]?.speed}m/s
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-4 w-4" />
                        <span className="w-12 min-w-[3rem]">航向:</span>
                        <span className="font-mono">
                          {droneStates[subJob.drone.sn]?.heading}°
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
                        {droneStates[subJob.drone.sn]?.battery}%
                      </span>
                    </div>
                    <div className="h-6 w-full rounded bg-gradient-to-r from-green-400 to-green-600/80 p-0">
                      <div
                        className="h-full rounded-r bg-background/80"
                        style={{
                          width: `${
                            100 - droneStates[subJob.drone.sn]?.battery
                          }%`,
                          marginLeft: "auto",
                        }}
                      />
                    </div>
                    {/* <span className="text-xs text-muted-foreground">
                      续航 32min
                    </span> */}
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
      )}
    </div>
  );
}
