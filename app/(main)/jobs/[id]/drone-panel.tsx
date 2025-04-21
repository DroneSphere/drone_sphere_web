"use client";

import {
  JobCreationResult,
  JobDetailResult,
  PhysicalDrone,
} from "@/app/(main)/jobs/[id]/types";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Layers,
  Plus,
  Settings,
  Trash,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { getJobPhysicalDrones } from "./request";

/**
 * 表示系统中的无人机与其物理实体之间的映射关系
 * @interface DroneMapping
 * @property {number} selectedDroneIndex - 在UI列表中选定无人机的索引
 * @property {string} selectedDroneKey - 选定无人机的唯一标识键
 * @property {number} seletedDroneId - 系统中选定无人机的ID
 * @property {number} physicalDroneId - 与物理无人机关联的ID
 * @property {string} physicalDroneSN - 物理无人机的序列号
 * @property {string} color - 在UI中表示此无人机的颜色
 */
export interface DroneMapping {
  selected_drone_key: string;
  physical_drone_id: number;
}

interface DronePanelProps {
  selectedDrones: JobDetailResult["drones"];
  setSelectedDrones: React.Dispatch<
    React.SetStateAction<JobDetailResult["drones"]>
  >;
  droneMappings: DroneMapping[];
  setDroneMappings: React.Dispatch<React.SetStateAction<DroneMapping[]>>;
  isEditMode: boolean; // 是否处于编辑模式
  availableDrones: JobCreationResult["drones"]; // 可选的无人机列表

  // 仅用于显示与无人机关联的航线信息
  waylineAreas: {
    droneKey: string;
    color: string;
    path: AMap.LngLat[];
    points?: AMap.LngLat[];
    visible?: boolean;
    gimbalPitch?: number;
    gimbalZoom?: number;
  }[];

  // 添加用于控制航线可见性
  setWaylineAreas?: React.Dispatch<
    React.SetStateAction<
      {
        droneKey: string;
        color: string;
        path: AMap.LngLat[];
        points?: AMap.LngLat[];
        visible?: boolean;
        gimbalPitch?: number;
        gimbalZoom?: number;
      }[]
    >
  >;
}

/**
 * 合并的无人机面板组件
 * 整合了执飞机型选择和物理无人机绑定的功能
 */
export default function DronePanel({
  selectedDrones,
  setSelectedDrones,
  droneMappings,
  setDroneMappings,
  isEditMode,
  availableDrones,
  waylineAreas,
  setWaylineAreas,
}: DronePanelProps) {
  const { toast } = useToast();
  const [selectedDroneKey, setSelectedDroneKey] = useState<string | undefined>(
    undefined
  );

  // 获取可用的物理无人机列表
  const physicalQuery = useQuery({
    queryKey: ["physicalDrones"],
    queryFn: getJobPhysicalDrones,
  });

  // 清空所有已选择的无人机
  const handleClearDrones = () => {
    setSelectedDrones([]);
    setDroneMappings([]);
  };

  // 添加无人机
  const handleAddDrone = () => {
    if (!selectedDroneKey) {
      toast({
        title: "请选择无人机",
        description: "请先选择要添加的无人机机型",
      });
      return;
    }

    const droneId = parseInt(selectedDroneKey.split("-")[1]);
    const variantionIndex = parseInt(selectedDroneKey.split("-")[2]);

    const drone = availableDrones?.find((d) => d.id === droneId);
    if (!drone) {
      toast({
        title: "无人机不存在",
        description: "请重新选择无人机",
      });
      return;
    }

    const variantion = drone.variantions.find((v) => v.id === variantionIndex);
    if (!variantion) {
      toast({
        title: "无人机变体不存在",
        description: "请重新选择无人机",
      });
      return;
    }

    // 生成随机颜色
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F033FF",
      "#33FFF6",
      "#FF33A6",
      "#FFD700",
      "#4169E1",
      "#32CD32",
      "#8A2BE2",
      "#FF6347",
      "#20B2AA",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // 计算新的索引
    const selectedDronesCount = selectedDrones.length;
    const index = selectedDronesCount
      ? Math.max(
          ...selectedDrones.map((d) => d.index || 0),
          selectedDronesCount
        ) + 1
      : 1;

    // 创建新的无人机记录，添加 physicalDrone 字段
    const newDroneKey = `${index}-${droneId}-${variantionIndex}`;
    setSelectedDrones((prev) => {
      return [
        ...prev,
        {
          ...drone,
          index: index,
          id: droneId,
          key: newDroneKey,
          variantion: variantion,
          color: color,
          physicalDrone: null, // 初始时没有绑定物理无人机
        },
      ];
    });

    // 创建一个对应的空映射记录
    setDroneMappings((prev) => {
      return [
        ...prev,
        {
          selected_drone_key: newDroneKey,
          physical_drone_id: -1, // 初始时没有绑定物理无人机
        },
      ];
    });
  };

  // 删除无人机
  const handleRemoveDrone = (droneKey: string) => {
    setSelectedDrones((prev) => prev.filter((d) => d.key !== droneKey));
    setDroneMappings((prev) =>
      prev.filter((m) => m.selected_drone_key !== droneKey)
    );
    setSelectedDroneKey(undefined);

    toast({
      title: "无人机已移除",
      description: "无人机已从任务中移除",
    });
  };

  // 为无人机绑定物理机
  const handleDroneSelection = (
    droneModelKey: string,
    physicalDroneId: string
  ) => {
    const droneModel = selectedDrones.find((d) => d.key === droneModelKey);
    const physicalDrone = physicalQuery.data?.find(
      (d) => d.id === Number(physicalDroneId)
    );
    if (!droneModel || !physicalDrone) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return;
    }
    console.log("handleDroneSelection", droneModel, physicalDrone);

    // if (!droneModel || !physicalDrone) {
    //   toast({
    //     title: "选择错误",
    //     description: "无法找到所选无人机",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // // 检查该物理无人机是否已被其他型号的无人机映射
    // const existingIndex = droneMappings.findIndex(
    //   (m) =>
    //     m.physical_drone_id === physicalDrone.id &&
    //     m.selected_drone_key !== droneModelKey
    // );

    // if (existingIndex >= 0) {
    //   toast({
    //     title: "禁止操作",
    //     description: `物理无人机${physicalDrone.sn}已被映射到其他机型`,
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // 更新映射关系
    setDroneMappings((prev) => {
      // 更新已有映射
      console.log("Updating existing mapping", droneModelKey);
      console.log("Current mapping", prev);

      // 重新创建所有映射
      const res = prev.map((mapping) => {
        if (mapping.selected_drone_key === droneModelKey) {
          return {
            ...mapping,
            physical_drone_id: physicalDrone.id,
          };
        }
        return mapping;
      });
      console.log("New mapping", res);
      return res;
    });

    // 注意：不要在这里打印droneMappings，因为状态更新是异步的，此时打印的仍然是旧值

    // 同时更新selectedDrones中相应无人机的physicalDrone信息
    setSelectedDrones((prev) => {
      return prev.map((drone) => {
        if (drone.key === droneModelKey) {
          console.log("Updating drone with key:", droneModelKey);
          return {
            ...drone,
            physicalDrone: physicalDrone,
          };
        }
        return drone;
      });
    });

    console.log("Updated selectedDrones", selectedDrones);
  };

  // 根据无人机型号ID过滤可用的物理无人机
  const availablePhysicalDronesByModelId = (
    droneModelId: number
  ): PhysicalDrone[] => {
    return physicalQuery.data?.filter((d) => d.model.id === droneModelId) || [];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">执飞机型与绑定</div>
      </div>

      {/* 选择无人机工具栏 */}
      {isEditMode && (
        <div className="flex justify-between items-center mt-2">
          <FormItem className="flex-1 mr-4">
            <Select
              value={selectedDroneKey}
              onValueChange={(value) => {
                setSelectedDroneKey(value);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择要添加的机型">
                    {selectedDroneKey
                      ? (() => {
                          const droneId = parseInt(
                            selectedDroneKey.split("-")[1]
                          );
                          const variantIndex = parseInt(
                            selectedDroneKey.split("-")[2]
                          );
                          const drone = availableDrones?.find(
                            (d) => d.id === droneId
                          );
                          const variant = drone?.variantions.find(
                            (v) => v.id === variantIndex
                          );
                          return drone && variant
                            ? `${drone.name}-${variant.name}`
                            : "请选择无人机";
                        })()
                      : "请选择无人机"}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {availableDrones?.map((e) => (
                  <SelectGroup key={e.id} className="w-full">
                    <SelectLabel className="w-full">{e.name}</SelectLabel>
                    {e.variantions.map((v) => (
                      <SelectItem
                        key={"0-" + e.id + "-" + v.id}
                        value={"0-" + e.id + "-" + v.id || ""}
                      >
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <Button
            variant="destructive"
            size="icon"
            className="mr-2 h-8 w-8"
            onClick={handleClearDrones}
            disabled={!selectedDrones?.length}
            title="清空所有已选无人机"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            disabled={!selectedDroneKey}
            size="icon"
            type="button"
            className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
            onClick={handleAddDrone}
            title="添加无人机"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 已选择的无人机列表 */}
      {selectedDrones?.length === 0 && (
        <div className="text-sm text-gray-500 mt-2 text-center">
          {isEditMode ? "请添加无人机机型" : "当前没有选择任何无人机机型"}
        </div>
      )}

      {selectedDrones?.map((drone, idx) => {
        const mapping = droneMappings.find(
          (m) => m.selected_drone_key === drone.key
        );

        return (
          <div className="mt-4 px-1 space-y-2" key={drone.key}>
            {idx > 0 && <Separator className="my-2" />}

            {/* 无人机基本信息 */}
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium overflow-auto flex items-center">
                <div
                  className="h-3 w-3 rounded-full mr-2"
                  style={{ backgroundColor: drone.color }}
                ></div>
                {drone.name}
              </div>

              {isEditMode && (
                <Button
                  variant="destructive"
                  title="删除无人机"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveDrone(drone.key)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 无人机变体信息 */}
            {/*            <div classNa            <div className="text-xs text-gray-500">
              型号: {drone.variation.name}
            </div>*/}
            <div className="text-xs text-gray-500">
              云台: {drone.variantion.gimbal?.name ?? "机载云台"}
            </div>
            {/* <div className="text-xs text-gray-500">
              载荷: {drone.variantion.payload?.name ?? "无载荷"}
            </div> */}

            {/* 物理无人机绑定选择器 */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  绑定无人机
                </div>
                {/* {mapping && mapping.physical_drone_id > 0 && (
                  <div className="text-center text-xs px-1.5 py-0.5 rounded-lg bg-green-100 text-green-800 whitespace-nowrap">
                    已绑定
                  </div>
                )} */}

                {isEditMode ? (
                  <FormItem className="flex-1 m-0">
                    <Select
                      value={
                        mapping?.physical_drone_id
                          ? String(mapping.physical_drone_id)
                          : undefined
                      }
                      onValueChange={(value) =>
                        handleDroneSelection(drone.key, value)
                      }
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="选择物理无人机" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {availablePhysicalDronesByModelId(drone.id).map(
                            (physicalDrone) => (
                              <SelectItem
                                key={physicalDrone.id}
                                value={String(physicalDrone.id)}
                                disabled={droneMappings.some(
                                  (m) =>
                                    m.physical_drone_id === physicalDrone.id &&
                                    m.selected_drone_key !== drone.key
                                )}
                              >
                                {physicalDrone.callsign} - {physicalDrone.sn}
                              </SelectItem>
                            )
                          )}
                          {availablePhysicalDronesByModelId(drone.id).length ===
                            0 && (
                            <SelectItem disabled value="0">
                              无可用物理无人机
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                ) : (
                  <div className="text-sm text-gray-600">
                    {mapping && mapping.physical_drone_id ? (
                      `绑定到物理机: ${mapping.physical_drone_id}`
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        未绑定物理无人机
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* 无人机功能状态 */}
            <div className="text-xs text-gray-500 flex items-center">
              <div
                className={`rounded-full h-3 w-3 mr-1 ${
                  drone.variantion.rtk_available ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="mr-2">
                {drone.variantion.rtk_available ? "RTK可用" : "RTK不可用"}
              </div>

              <div
                className={`rounded-full h-3 w-3 mr-1 ${
                  drone.variantion.thermal_available
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <div>
                {drone.variantion.thermal_available
                  ? "热成像可用"
                  : "热成像不可用"}
              </div>
            </div>

            {/* 航线信息区域 */}
            {waylineAreas.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-500">航线信息</div>
                  {/* 找到当前无人机的航线信息 */}
                  {waylineAreas.find((w) => w.droneKey === drone.key) &&
                    setWaylineAreas && (
                      <div className="flex items-center">
                        {/* 显示航线可见性状态 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            // 切换航线可见性
                            setWaylineAreas((prev) =>
                              prev.map((area) =>
                                area.droneKey === drone.key
                                  ? { ...area, visible: !area.visible }
                                  : area
                              )
                            );
                          }}
                        >
                          {waylineAreas.find((w) => w.droneKey === drone.key)
                            ?.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                </div>

                {/* 显示航线详细信息 */}
                {waylineAreas.find((w) => w.droneKey === drone.key) ? (
                  <div className="text-xs text-gray-600 flex flex-col space-y-1">
                    <div>
                      航点数:{" "}
                      {waylineAreas.find((w) => w.droneKey === drone.key)
                        ?.points?.length || 0}
                    </div>
                    <div>
                      云台参数:{" "}
                      {waylineAreas.find((w) => w.droneKey === drone.key)
                        ?.gimbalPitch || -90}
                      °,
                      {waylineAreas.find((w) => w.droneKey === drone.key)
                        ?.gimbalZoom || 1}
                      倍
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    尚未生成航线
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
