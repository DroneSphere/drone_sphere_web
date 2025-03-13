"use client";

import { DroneState } from "@/api/drone/types";
import { baseURL } from "@/api/http_client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    ArrowRight,
    ArrowUp,
    Battery,
    BatteryCharging,
    Compass,
    Monitor,
    MonitorOff,
    Navigation,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DroneData {
  sn?: string;
  callsign?: string;
  model?: string;
}

interface DroneMonitorPanelProps {
  drones?: DroneData[];
  mapRef: React.MutableRefObject<AMap.Map | null>;
  AMapRef: React.MutableRefObject<typeof AMap | null>;
}

export default function DroneMonitorPanel({
  drones,
  mapRef,
  AMapRef,
}: DroneMonitorPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});

  // SSE处理逻辑
  useEffect(() => {
    if (!drones) return;
    console.log("drones", drones);

    const eventSources: EventSource[] = [];

    drones.forEach((drone) => {
      if (!drone.sn) return; // 确保有sn

      const droneSN = drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`;

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
        const marker = new AMapRef.current.Marker({
          position: new AMapRef.current.LngLat(lng, lat),
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
  }, [drones, mapRef, AMapRef, droneMarkers]);

  return (
    <div
      id="right-panel"
      className={`flex flex-col gap-4 transition-all duration-300 ${
        isCollapsed ? "w-10 overflow-hidden" : "w-auto min-w-32"
      }`}
    >
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="icon"
        className="absolute right-4 top-12 z-999 p-2 rounded-full shadow-md"
      >
        {isCollapsed ? (
          <MonitorOff className="h-4 w-4" />
        ) : (
          <Monitor className="h-4 w-4" />
        )}
      </Button>
      {
        // 没有数据时显示提示
        !isCollapsed && !drones && (
          <div className="flex items-center justify-center w-auto h-full">
            <span className="text-gray-500">没有数据</span>
          </div>
        )
      }
      {!isCollapsed && drones && <div className="text-xl pt-3">实时数据</div>}
      {!isCollapsed &&
        drones &&
        drones.map((drone, index) => (
          <Card key={index} className="w-auto h-min">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">
                {drone.callsign || drone.sn}
              </CardTitle>
              <CardDescription>
                {drone.sn} - {drone.model}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-12 gap-2 text-sm">
                <div className="col-span-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 opacity-75" />
                    <span className="font-medium">位置状态</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <span className="w-12 min-w-[3rem]">经度:</span>
                      <span className="font-mono">
                        {(drone.sn && droneStates[drone.sn]?.lng.toFixed(6)) ??
                          "--"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-12 min-w-[3rem]">纬度:</span>
                    <span className="font-mono">
                      {(drone.sn && droneStates[drone.sn]?.lat.toFixed(6)) ??
                        "--"}
                    </span>
                  </div>
                </div>
                <Separator className="col-span-1 h-full w-[1px] bg-muted" />
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
                        {(drone.sn && droneStates[drone.sn]?.height) ?? "--"}m
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
                        {(drone.sn && droneStates[drone.sn]?.heading) ?? "--"}°
                      </span>
                    </div>
                  </div>
                </div>
                <Separator className="col-span-1 h-full w-[1px] bg-muted" />
                <div className="col-span-3 flex flex-col items-end space-y-2">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 opacity-75" />
                    <span className="font-medium">电量状态</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="h-4 w-4 opacity-75" />
                    <span className="font-medium">
                      {(drone.sn && droneStates[drone.sn]?.battery) ?? "--"}%
                    </span>
                  </div>
                  <div className="h-6 w-full rounded bg-gradient-to-r from-green-400 to-green-600/80 p-0">
                    <div
                      className="h-full rounded-r bg-background/80"
                      style={{
                        width: `${
                          100 -
                          (Number(drone.sn && droneStates[drone.sn]?.battery) ||
                            0)
                        }%`,
                        marginLeft: "auto",
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
