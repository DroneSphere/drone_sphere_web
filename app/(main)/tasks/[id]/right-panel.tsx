"use client";

import { DroneState } from "@/api/drone/types";
import { baseURL } from "@/api/http_client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
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
import React, { useEffect, useState } from "react";

// 更新DroneData接口以匹配processedDrones返回的数据结构
interface DroneData {
  sn?: string;
  callsign?: string;
  model?: string;
  color?: string;
  key?: string;
  // 添加mappings中可能包含的额外字段
  selected_drone_key?: string;
  physical_drone_id?: number;
  physical_drone_sn?: string;
  // 添加其他可能的字段，使用可选属性
  name?: string;
  manufacturer?: string;
  firmware?: string;
  id?: number;
  variation?: any; // 或者定义更具体的类型
  // 通用索引签名，允许包含其他未明确列出的属性
  [key: string]: any;
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

  // 添加一个ref来保存EventSource实例，防止重复创建
  const eventSourcesRef = React.useRef<Record<string, EventSource>>({});

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

    // 初始化连接状态，但不要覆盖已有的连接
    setDroneConnections((prev) => {
      const updatedConnections = { ...prev };
      drones.forEach((drone) => {
        if (drone.sn && updatedConnections[drone.sn] === undefined) {
          updatedConnections[drone.sn] = false;
        }
      });
      return updatedConnections;
    });

    // 创建和保存所有要使用的EventSource
    drones.forEach((drone) => {
      if (!drone.sn) return; // 确保有sn
      
      // 如果已经有连接，不要重复创建
      if (eventSourcesRef.current[drone.sn]) {
        console.log(`EventSource for drone ${drone.sn} already exists`);
        return;
      }

      const droneSN = drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`;

      console.log(`Creating new EventSource for ${droneSN}`);
      const source = new EventSource(sseUrl);
      eventSourcesRef.current[droneSN] = source;

      // 连接成功时更新连接状态
      source.onopen = () => {
        console.log(`SSE connection opened for drone ${droneSN}`);
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: true,
        }));
      };

      source.onmessage = (event) => {
        try {
          const newState: DroneState = JSON.parse(event.data);
          console.log(`SSE message for drone ${droneSN}:`, newState);

          // 更新飞机状态
          setDroneStates((prev) => ({
            ...prev,
            [droneSN]: newState,
          }));

          // 确保标记为已连接
          setDroneConnections((prev) => ({
            ...prev,
            [droneSN]: true,
          }));

          // 绘制飞机位置
          // ...existing code...
        } catch (error) {
          console.error(`Error processing message for ${droneSN}:`, error);
        }
      };

      source.onerror = (error) => {
        console.error(`SSE error for drone ${droneSN}:`, error);
        // 只在真正错误时更新状态为断开
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: false,
        }));
        
        // 尝试重新连接而不是直接关闭
        console.log(`Attempting to reconnect for ${droneSN}...`);
        // 这里不关闭连接，让浏览器自动重连
      };
    });

    console.log("Current EventSources:", Object.keys(eventSourcesRef.current));
    
    // 清理函数 - 只在组件完全卸载时执行
    return () => {
      console.log("Component unmounting, closing all SSE connections");
      Object.keys(eventSourcesRef.current).forEach(key => {
        console.log(`Closing EventSource for ${key}`);
        eventSourcesRef.current[key]?.close();
        delete eventSourcesRef.current[key];
      });
    };
  }, [drones]); // 从依赖项中移除 mapRef, AMapRef, droneMarkers

  // 单独处理地图标记的更新，与SSE连接分开
  useEffect(() => {
    if (!AMapRef.current || !mapRef.current) return;
    
    // 处理地图标记的更新逻辑
    Object.entries(droneStates).forEach(([droneSN, state]) => {
      const drone = drones?.find(d => d.sn === droneSN);
      if (!drone) return;
      
      const lng = state.lng;
      const lat = state.lat;
      
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

      const marker = new AMapRef.current!.Marker({
        position: new AMapRef.current!.LngLat(lng, lat),
        title: drone.callsign || droneSN,
        angle: state.heading || 0,
        content: markerContent,
        anchor: "center",
      });

      // 更新marker
      setDroneMarkers((prev) => {
        // 如果存在旧的标记，先从地图中移除
        if (prev[droneSN]) {
          prev[droneSN]?.setMap(null);
        }
        
        // 将新标记添加到地图
        if (mapRef.current) {
          mapRef.current.add(marker);
        }
        
        // 返回更新后的marker对象
        return {
          ...prev,
          [droneSN]: marker
        };
      });
    });
  }, [droneStates, drones, AMapRef, mapRef]);

  // 添加调试用的状态日志
  useEffect(() => {
    console.log("Current drone connections:", droneConnections);
  }, [droneConnections]);

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
              <CardContent className="px-3 mb-3">
                {/* 基本信息卡片 - 始终显示的信息 */}
                <div className="mb-3 bg-muted/100 p-2 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="h-3 w-3 opacity-75" />
                    <span className="font-medium text-xs">基本信息</span>
                  </div>
                  
                  {/* 修改呼号和序列号的显示结构 */}
                  <div className="mb-2 flex flex-col gap-1 text-xs">
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
                        序列号:
                      </span>
                      <span className="font-mono">{drone.sn || "未知"}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
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
                  className={`flex flex-col gap-2 text-xs ${
                    !droneConnections[drone.sn] ? "opacity-50" : ""
                  }`}
                >
                  {/* 位置信息 - 修改为占据整行以显示长经纬度 */}
                  <div className="w-full space-y-1">
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3 opacity-75" />
                      <span className="font-medium">位置</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <span className="w-10 min-w-[2.5rem]">经度:</span>
                        <span className="font-mono overflow-x-auto whitespace-nowrap">
                          {(drone.sn &&
                            droneStates[drone.sn]?.lng.toFixed(12)) ??
                            "--"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-10 min-w-[2.5rem]">纬度:</span>
                        <span className="font-mono overflow-x-auto whitespace-nowrap">
                          {(drone.sn && droneStates[drone.sn]?.lat.toFixed(12)) ??
                            "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="w-full h-[1px] bg-muted" />

                  {/* 飞行状态和电量信息 - 并排显示 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* 飞行状态 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 opacity-75" />
                        <span className="font-medium">飞行状态</span>
                      </div>
                      <div className="flex flex-col gap-1">
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

                    {/* 电量信息 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3 opacity-75" />
                        <span className="font-medium">电量</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
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
                </div>
              </CardContent>
            )}
          </Card>
        ))}
    </div>
  );
}
