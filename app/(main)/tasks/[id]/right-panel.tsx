"use client";

import { DroneState } from "@/api/drone/types";
import { baseURL } from "@/api/http_client";
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
  ChevronDown,
  ChevronUp,
  Compass,
  Info,
  Navigation,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DroneData {
  sn?: string;
  callsign?: string;
  model?: string;
  color?: string;
  key?: string;
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
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});
  const [droneConnections, setDroneConnections] = useState<
    Record<string, boolean>
  >({});
  // 移除全局折叠状态，只保留卡片折叠状态
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(
    {}
  );

  // 初始化卡片折叠状态（默认全部折叠）
  useEffect(() => {
    if (!drones) return;
    const initialCardStates: Record<string, boolean> = {};
    drones.forEach((drone) => {
      if (drone.sn) {
        initialCardStates[drone.sn] = true; // 为true表示折叠状态
      }
    });
    setCollapsedCards(initialCardStates);
  }, [drones]);

  // 切换特定卡片的折叠状态
  const toggleCardCollapse = (sn: string, event: React.MouseEvent) => {
    // 阻止事件冒泡，以确保只处理点击事件一次
    event.stopPropagation();

    setCollapsedCards((prev) => ({
      ...prev,
      [sn]: !prev[sn],
    }));
  };

  // SSE处理逻辑
  useEffect(() => {
    if (!drones) return;
    console.log("drones", drones);

    const eventSources: EventSource[] = [];

    // 初始化连接状态为断开
    const initialConnections: Record<string, boolean> = {};
    drones.forEach((drone) => {
      if (drone.sn) {
        initialConnections[drone.sn] = false;
      }
    });
    setDroneConnections(initialConnections);

    drones.forEach((drone) => {
      if (!drone.sn) return; // 确保有sn

      const droneSN = drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`;

      const source = new EventSource(sseUrl);
      eventSources.push(source);

      // 连接成功时更新连接状态
      source.onopen = () => {
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: true,
        }));
      };

      source.onmessage = (event) => {
        const newState: DroneState = JSON.parse(event.data);

        setDroneStates((prev) => ({
          ...prev,
          [droneSN]: newState,
        }));

        // 更新连接状态为已连接
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: true,
        }));

        // 绘制飞机位置
        if (!AMapRef.current || !mapRef.current) return;
        const lng = newState.lng;
        const lat = newState.lat;

        // 使用自定义HTML内容创建带颜色标识的标记
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
            ">${drone.callsign || droneSN}</div>
          </div>
        `;

        const marker = new AMapRef.current.Marker({
          position: new AMapRef.current.LngLat(lng, lat),
          title: drone.callsign || droneSN,
          angle: newState.heading || 0, // 设置标记的旋转角度为航向
          content: markerContent,
          anchor: "center",
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
        // 更新连接状态为断开
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: false,
        }));
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
      className="w-80 min-w-[300px] max-w-[350px] h-[calc(100vh-160px)] overflow-y-auto flex flex-col gap-3 p-3 border rounded-md shadow-sm bg-background"
    >
      {!drones && (
        <div className="flex items-center justify-center w-auto h-full">
          <span className="text-gray-500 text-xs">没有数据</span>
        </div>
      )}

      {drones && <div className="text-sm font-medium">实时数据</div>}

      {drones &&
        drones.map((drone, index) => (
          <Card
            key={index}
            className={`w-full h-min ${
              !droneConnections[drone.sn || ""] ? "border-dashed" : ""
            } text-xs`}
          >
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 添加颜色标识 */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: drone.color || "#3366FF" }}
                  ></div>
                  <CardTitle className="text-sm">
                    {drone.callsign || "未命名无人机"}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  {/* 连接状态指示 */}
                  {drone.sn && droneConnections[drone.sn] ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-gray-400" />
                  )}

                  {/* 展开/折叠按钮 - 修改为专门的按钮元素并添加明确的点击处理 */}
                  {drone.sn && (
                    <button
                      onClick={(e) =>
                        drone.sn && toggleCardCollapse(drone.sn, e)
                      }
                      className="p-1 rounded hover:bg-gray-100 focus:outline-none"
                      aria-label={
                        collapsedCards[drone.sn] ? "展开详情" : "折叠详情"
                      }
                    >
                      {collapsedCards[drone.sn] ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">
                  <span>
                    {drone.sn || "无序列号"} - {drone.model || "未知型号"}
                  </span>
                </CardDescription>

                {/* 显示电量和高度的简要信息，仅在折叠状态下显示 */}
                {drone.sn &&
                  collapsedCards[drone.sn] &&
                  droneConnections[drone.sn] && (
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="flex items-center gap-1" title="电量">
                        <Battery className="h-2.5 w-2.5 text-green-500" />
                        <span>{droneStates[drone.sn]?.battery ?? "--"}%</span>
                      </div>
                      <div className="flex items-center gap-1" title="高度">
                        <ArrowUp className="h-2.5 w-2.5 text-sky-500" />
                        <span>{droneStates[drone.sn]?.height ?? "--"}m</span>
                      </div>
                    </div>
                  )}

                {/* 等待连接提示 */}
                {drone.sn && !droneConnections[drone.sn] && (
                  <span className="text-[10px] text-amber-500">
                    等待连接...
                  </span>
                )}
              </div>
            </CardHeader>

            {/* 扩展内容，只在非折叠状态下显示 */}
            {drone.sn && !collapsedCards[drone.sn] && (
              <CardContent className="p-3">
                {/* 基本信息卡片 - 始终显示的信息 */}
                <div className="mb-3 bg-muted/30 p-2 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="h-3 w-3 opacity-75" />
                    <span className="font-medium text-xs">基本信息</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <div className="flex items-center">
                      <span className="min-w-[3.5rem] text-muted-foreground">
                        序列号:
                      </span>
                      <span className="font-mono">{drone.sn || "未知"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="min-w-[3.5rem] text-muted-foreground">
                        呼号:
                      </span>
                      <span className="font-mono">
                        {drone.callsign || "未设置"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="min-w-[3.5rem] text-muted-foreground">
                        型号:
                      </span>
                      <span className="font-mono">{drone.model || "未知"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="min-w-[3.5rem] text-muted-foreground">
                        状态:
                      </span>
                      <span
                        className={`font-mono ${
                          drone.sn && droneConnections[drone.sn]
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {drone.sn && droneConnections[drone.sn]
                          ? "已连接"
                          : "未连接"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 实时遥测数据 */}
                <div
                  className={`grid grid-cols-12 gap-1 text-xs ${
                    !droneConnections[drone.sn] ? "opacity-50" : ""
                  }`}
                >
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3 opacity-75" />
                      <span className="font-medium">位置</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <span className="w-10 min-w-[2.5rem]">经度:</span>
                        <span className="font-mono">
                          {(drone.sn &&
                            droneStates[drone.sn]?.lng.toFixed(6)) ??
                            "--"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-10 min-w-[2.5rem]">纬度:</span>
                      <span className="font-mono">
                        {(drone.sn && droneStates[drone.sn]?.lat.toFixed(6)) ??
                          "--"}
                      </span>
                    </div>
                  </div>
                  <Separator className="col-span-1 h-full w-[1px] bg-muted" />
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 opacity-75" />
                      <span className="font-medium">飞行状态</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        <span className="w-10 min-w-[2.5rem]">高度:</span>
                        <span className="font-mono">
                          {(drone.sn && droneStates[drone.sn]?.height) ?? "--"}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        <span className="w-10 min-w-[2.5rem]">速度:</span>
                        <span className="font-mono">
                          {(drone.sn && droneStates[drone.sn]?.speed) ?? "--"}
                          m/s
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span className="w-10 min-w-[2.5rem]">航向:</span>
                        <span className="font-mono">
                          {(drone.sn && droneStates[drone.sn]?.heading) ?? "--"}
                          °
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator className="col-span-1 h-full w-[1px] bg-muted" />
                  <div className="col-span-3 flex flex-col items-end space-y-1">
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3 opacity-75" />
                      <span className="font-medium">电量</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BatteryCharging className="h-3 w-3 opacity-75" />
                      <span className="font-medium">
                        {(drone.sn && droneStates[drone.sn]?.battery) ?? "--"}%
                      </span>
                    </div>
                    <div className="h-4 w-full rounded bg-gradient-to-r from-green-400 to-green-600/80 p-0">
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

                {/* 连接状态提示 */}
                {drone.sn && !droneConnections[drone.sn] && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-md text-[10px] text-amber-600 flex items-center gap-1">
                    <WifiOff className="h-2 w-2" />
                    <span>
                      尚未收到该无人机的实时数据，请确认无人机已通电并连接网络
                    </span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
    </div>
  );
}
