"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Battery, Bot, BotOff, Signal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAvailableDrones, fetchRequiredDrones } from "./request";
import { AvailableDrone, DroneStatus, RequiredItem } from "./type";

interface LeftPanelProps {
  id: number;
  mapRef: React.MutableRefObject<AMap.Map | null>;
  AMapRef: React.MutableRefObject<typeof AMap | null>;
  isMapReady: boolean;
}

export default function LeftPanel({
  id,
  mapRef,
  AMapRef,
  isMapReady,
}: LeftPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [droneMapping, setDroneMapping] = useState<Record<number, number>>({}); // 使用数字类型的ID
  const [selectedDrones, setSelectedDrones] = useState<Set<number>>(new Set());

  const requiredQuery = useQuery({
    queryKey: ["tasks", id, "required"],
    queryFn: fetchRequiredDrones,
  });

  const availableQuery = useQuery({
    queryKey: ["tasks", id, "available"],
    queryFn: fetchAvailableDrones,
  });

  const handleDroneSelection = (requiredId: number, availableId: number) => {
    // 如果之前已经选择了其他无人机，从selectedDrones中移除
    const previousSelection = droneMapping[requiredId];

    setDroneMapping((prev) => ({
      ...prev,
      [requiredId]: availableId,
    }));

    const newSelectedDrones = new Set(selectedDrones);
    if (previousSelection) {
      newSelectedDrones.delete(previousSelection);
    }
    newSelectedDrones.add(availableId);
    setSelectedDrones(newSelectedDrones);
  };

  const getFilteredAvailableDrones = (requiredDrone: RequiredItem) => {
    if (!availableQuery.data) return [];

    return availableQuery.data.filter(
      (drone: AvailableDrone) =>
        // 型号匹配
        drone.model.id === requiredDrone.model.id &&
        // 满足RTK需求
        (!requiredDrone.rtk_required || drone.rtk_available) &&
        // 满足热成像需求
        (!requiredDrone.thermal_required || drone.thermal_available) &&
        // 检查是否已被其他需求选择
        (!selectedDrones.has(drone.id) ||
          droneMapping[requiredDrone.id] === drone.id)
    );
  };

  const getDroneStatusBadge = (status: DroneStatus) => {
    switch (status) {
      case DroneStatus.IDLE:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            空闲
          </Badge>
        );
      case DroneStatus.BUSY:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            忙碌
          </Badge>
        );
      case DroneStatus.OFFLINE:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            离线
          </Badge>
        );
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  useEffect(() => {
    if (
      !mapRef.current ||
      !AMapRef.current ||
      !requiredQuery.data ||
      !isMapReady
    )
      return;

    // Clear previous areas if needed
    const map = mapRef.current;
    const AMap = AMapRef.current;

    requiredQuery.data.forEach((item: RequiredItem) => {
      if (!item.area || !item.area.points.length) return;

      // Create polygon for this area
      const path = item.area.points.map(
        (point) => new AMap.LngLat(point.lng, point.lat)
      );
      console.log("path", path);

      const color = item.area.color || "#FF0000"; // Default color if not provided
      //   对 color进行处理得到stroke和fill颜色
      const strokeColor = color;
      const fillColor = color.replace(/[^,]+(?=\))/, "0.3"); // Set fill opacity to 0.3
      const polygon = new AMap.Polygon();
      polygon.setPath(path);
      polygon.setOptions({
        strokeColor: strokeColor,
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: fillColor,
        fillOpacity: 0.3,
        extData: { requiredId: item.id },
      });

      map.add(polygon);

      // 添加infoWindow
      const infoWindow = new AMap.InfoWindow({
        content: `区域编号: ${item.id}`,
        offset: new AMap.Pixel(0, -30),
      });
      polygon.on("click", (e) => {
        infoWindow.open(map, e.lnglat);
      });
      polygon.on("mouseover", () => {
        polygon.setOptions({ fillOpacity: 0.5 });
      });
      polygon.on("mouseout", () => {
        polygon.setOptions({ fillOpacity: 0.3 });
      });
    });

    // 适应视图位置
    mapRef.current.setFitView();
  }, [requiredQuery.data, mapRef, AMapRef, isMapReady]);
  return (
    <div
      id="left-panel"
      className={`flex flex-col gap-4 transition-all duration-300 ${
        isCollapsed ? "w-10 overflow-hidden" : "w-auto min-w-72"
      }`}
    >
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="icon"
        className="absolute left-4 top-12 z-999 p-2 rounded-full shadow-md"
      >
        {isCollapsed ? (
          <BotOff className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </Button>
      {!isCollapsed && <div className="text-end text-xl pt-3">任务详情</div>}
      {!isCollapsed && (
        <div className="flex flex-col gap-4">
          {(requiredQuery.isLoading || availableQuery.isLoading) && (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {requiredQuery.isSuccess && availableQuery.isSuccess && (
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-medium">选择执行无人机</h3>

              {requiredQuery.data?.map((drone: RequiredItem) => {
                const availableDrones = getFilteredAvailableDrones(drone);
                const selectedDrone = droneMapping[drone.id]
                  ? availableQuery.data.find(
                      (d: AvailableDrone) => d.id === droneMapping[drone.id]
                    )
                  : undefined;

                return (
                  <Card
                    key={drone.id}
                    className={`overflow-hidden ${
                      availableDrones.length === 0 ? "border-red-300" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-2">
                        <div
                          className="w-full h-2 rounded-sm"
                          style={{
                            backgroundColor: drone.area?.color || "#ccc",
                            opacity: 0.5,
                          }}
                        />

                        <div className="flex justify-between text-sm">
                          <span className="font-medium">区域编号:</span>
                          <span>{drone.area?.index}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">区域面积:</span>
                          <span>{drone.area?.measure}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">执飞机型:</span>
                          <span>{drone.model.name}</span>
                        </div>
                        <div className="flex gap-1 text-xs items-center">
                          <span className="text-sm font-medium">能力需求:</span>
                          <span className="flex-1" />
                          {drone.rtk_required && (
                            <Badge variant="secondary" className="text-xs">
                              RTK定位
                            </Badge>
                          )}
                          {drone.thermal_required && (
                            <Badge variant="secondary" className="text-xs">
                              热成像
                            </Badge>
                          )}
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between items-center gap-2 text-sm">
                          <Select
                            value={droneMapping[drone.id]?.toString() || ""}
                            onValueChange={(value) =>
                              handleDroneSelection(drone.id, parseInt(value))
                            }
                            disabled={availableDrones.length === 0}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  availableDrones.length === 0
                                    ? "无匹配设备"
                                    : "选择无人机"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDrones.map(
                                (available: AvailableDrone) => (
                                  <SelectItem
                                    key={available.id}
                                    value={available.id.toString()}
                                    disabled={
                                      available.status !== DroneStatus.IDLE
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{available.callsign}</span>
                                      {getDroneStatusBadge(available.status)}
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <Button size="sm">下发航线</Button>
                        </div>

                        {selectedDrone && (
                          <div className="mt-2 p-2 bg-slate-50 rounded-md text-xs">
                            <div className="font-medium mb-1">
                              {selectedDrone.callsign} ({selectedDrone.sn})
                            </div>
                            <div className="text-slate-500">
                              {selectedDrone.description}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {selectedDrone.rtk_available && (
                                <div className="flex items-center gap-1">
                                  <Signal className="h-3 w-3" />
                                  <span>RTK</span>
                                </div>
                              )}
                              {selectedDrone.thermal_available && (
                                <div className="flex items-center gap-1">
                                  <Battery className="h-3 w-3" />
                                  <span>热成像</span>
                                </div>
                              )}
                              {selectedDrone.status === DroneStatus.IDLE ? (
                                <div className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3 text-green-500" />
                                  <span>在线</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <WifiOff className="h-3 w-3 text-gray-500" />
                                  <span>离线</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  // 执行任务的逻辑
                  console.log("执行任务", droneMapping);
                }}
              >
                执行任务
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
