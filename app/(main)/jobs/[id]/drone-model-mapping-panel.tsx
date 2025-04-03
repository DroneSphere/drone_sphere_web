"use client";

import { JobDetailResult, PhysicalDrone } from "@/app/(main)/jobs/[id]/type";
import { Button } from "@/components/ui/button";
import { FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getJobPhysicalDrones } from "./request";

interface DroneModelMappingProps {
  selectedDrones: JobDetailResult["drones"];
  isEditMode: boolean;
  droneMappings: DroneMapping[];
  setDroneMappings: React.Dispatch<React.SetStateAction<DroneMapping[]>>;
}

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
  selectedDroneIndex: number;
  selectedDroneKey: string;
  seletedDroneId: number;
  physicalDroneId: number;
  physicalDroneSN: string;
  color: string;
}

export default function DroneModelMappingPanel({
  selectedDrones,
  isEditMode,
  droneMappings,
  setDroneMappings,
}: DroneModelMappingProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const physicalQuery = useQuery({
    queryKey: ["physicalDrones"],
    queryFn: getJobPhysicalDrones,
  });

  // Toggle collapsed state
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  };

  // 处理无人机选择
  /**
   * 处理无人机选择，将UI中选择的无人机模型与物理无人机建立映射关系
   * @param droneModelKey - 在UI中选择的无人机模型的唯一键
   * @param physicalDroneId - 选择的物理无人机ID（字符串形式）
   */
  const handleDroneSelection = (
    droneModelKey: string,
    physicalDroneId: string
  ) => {
    // 根据无人机型号的key（格式为"index-drone_id-variation_index"）查找对应的无人机模型
    const droneModel = selectedDrones.find((d) => d.key === droneModelKey);
    // 根据ID查找对应的物理无人机
    const physicalDrone = physicalQuery.data?.find(
      (d) => d.id === Number(physicalDroneId)
    );
    console.log("handleDroneSelection", droneModel, physicalDrone);
    console.log("droneMappings", droneMappings);

    // 验证所选的无人机模型和物理无人机是否存在
    if (!droneModel || !physicalDrone) {
      // 如果找不到，显示错误提示
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return;
    }

    // 检查该物理无人机是否已被其他型号的无人机映射（避免一个物理无人机被多次分配）
    const existingIndex = droneMappings.findIndex(
      (m) => m.physicalDroneId === physicalDrone.id
    );

    if (existingIndex >= 0) {
      // 如果该物理无人机已经存在映射关系，则更新现有映射
      // 注意：这允许用户将一个物理无人机重新分配给不同的无人机模型
      console.log("existingIndex", existingIndex);
      toast({
        title: "禁止操作",
        description: `物理无人机${physicalDrone.sn}已被映射到其他机型`,
        variant: "destructive",
      });
    } else {
      // 如果该物理无人机没有现有映射，则创建新的映射关系
      console.log("new mapping");

      setDroneMappings((prev) => {
        // 检查是否已经存在这个selectedDroneKey的映射
        const existingDroneKeyIndex = prev.findIndex(
          (m) => m.selectedDroneKey === droneModel.key
        );

        // 如果存在，则更新该映射
        if (existingDroneKeyIndex >= 0) {
          const updatedMappings = [...prev];
          updatedMappings[existingDroneKeyIndex] = {
            selectedDroneIndex: parseInt(droneModel.key.split("-")[0]) || 0,
            selectedDroneKey: droneModel.key,
            seletedDroneId: droneModel.id,
            physicalDroneId: physicalDrone.id,
            physicalDroneSN: physicalDrone.sn,
            color: droneModel.color,
          };
          return updatedMappings;
        }
        // 如果不存在，添加新映射
        else {
          return [
            ...prev,
            {
              selectedDroneIndex: parseInt(droneModel.key.split("-")[0]) || 0,
              selectedDroneKey: droneModel.key,
              seletedDroneId: droneModel.id,
              physicalDroneId: physicalDrone.id,
              physicalDroneSN: physicalDrone.sn,
              color: droneModel.color,
            },
          ];
        }
      });
    }
  };

  /**
   * 根据无人机模型ID过滤出可用的物理无人机
   * @param droneModelId - 无人机模型ID
   * @returns 匹配指定模型ID的物理无人机数组
   */
  const availablePhysicalDronesByModelId = (
    droneModelId: number
  ): PhysicalDrone[] => {
    // 筛选出与指定模型ID匹配的所有物理无人机
    return physicalQuery.data?.filter((d) => d.model.id === droneModelId) || [];
  };

  return (
    <div className="space-y-2 p-3 border rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">无人机绑定</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleToggleCollapse}
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </Button>
      </div>

      {!collapsed && (
        <>
          {selectedDrones.length === 0 ? (
            <div className="text-sm text-gray-500">
              请先选择要执飞的无人机机型
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDrones.map((drone, index) => {
                const mapping = droneMappings.find(
                  (m) => m.selectedDroneKey === drone.key
                );
                return (
                  <div key={drone.key} className="py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: drone.color }}
                        ></div>
                        <span className="text-sm font-medium">
                          {drone.name}
                        </span>

                        {mapping && (
                          <div
                            className={`w-16 text-center text-xs px-2 py-1 rounded-lg ${
                              mapping.physicalDroneSN.length > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {mapping.physicalDroneSN.length > 0
                              ? "已绑定"
                              : "未绑定"}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <FormItem>
                        <Select
                          onValueChange={(value) =>
                            handleDroneSelection(drone.key, value)
                          }
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="选择物理无人机" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {availablePhysicalDronesByModelId(drone.id).map(
                                (physicalDrone) => (
                                  <SelectItem
                                    key={physicalDrone.id}
                                    value={String(physicalDrone.id)}
                                    disabled={
                                      droneMappings.some(
                                        (m) =>
                                          m.physicalDroneId === physicalDrone.id
                                      ) &&
                                      mapping?.physicalDroneId !==
                                        physicalDrone.id
                                    }
                                  >
                                    {physicalDrone.callsign} -{" "}
                                    {physicalDrone.sn}
                                  </SelectItem>
                                )
                              )}
                              {availablePhysicalDronesByModelId(drone.id)
                                .length === 0 && (
                                <SelectItem disabled value="0">
                                  无可用物理无人机
                                </SelectItem>
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}

                    {!isEditMode && mapping && (
                      <div className="text-sm text-gray-600">
                        绑定到物理机: {mapping.physicalDroneSN}
                      </div>
                    )}

                    {!isEditMode && !mapping && (
                      <div className="text-sm text-gray-500 italic">
                        未绑定物理无人机
                      </div>
                    )}

                    {index < selectedDrones.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
