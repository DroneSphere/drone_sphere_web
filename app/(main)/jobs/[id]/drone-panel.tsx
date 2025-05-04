"use client";

import {
  JobCreationResult,
  PhysicalDrone,
} from "@/app/(main)/jobs/report/[id]/types";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash, Trash2 } from "lucide-react";
import { useState } from "react";
import { getJobPhysicalDrones } from "../report/[id]/request";
import {
  DroneMappingState,
  DroneState,
  JobAction,
  JobState,
} from "./job-state";

// 镜头参数类型的枚举常量及对应的显示标签
const LENS_TYPES = {
  visible: "可见光",
  thermal: "热成像",
  fusion: "双光融合",
} as const;

interface DronePanelProps {
  isEditMode: boolean; // 是否处于编辑模式
  availableDrones: JobCreationResult["drones"]; // 可选的无人机列表
  // 添加整个状态对象，用于访问所有状态
  state: JobState; // 统一的状态对象，包含所有相关状态
  // 添加dispatch函数，用于更新状态
  dispatch: React.Dispatch<JobAction>; // 理想情况下应该使用更具体的Action类型
}

/**
 * 合并的无人机面板组件
 * 整合了执飞机型选择和物理无人机绑定的功能
 */
export default function DronePanel({
  isEditMode,
  availableDrones,
  state,
  dispatch,
}: DronePanelProps) {
  console.log("DronePanel", {
    selectedDrones: state.selectedDrones,
    droneMappings: state.droneMappings,
    isEditMode,
    availableDrones,
    waylineAreas: state.waylineAreas,
  });

  const { toast } = useToast();
  const [selectedDroneKey, setSelectedDroneKey] = useState<string | undefined>(
    undefined
  );
  // 添加一个状态控制绑定对话框的显示
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  // 最近添加的无人机键，用于绑定对话框中识别当前操作的无人机
  const [lastAddedDroneKey, setLastAddedDroneKey] = useState<string>("");
  // 在对话框中选择的物理无人机ID
  const [selectedPhysicalDroneId, setSelectedPhysicalDroneId] =
    useState<string>("");
  // 在对话框中选择的镜头参数
  const [selectedLensType, setSelectedLensType] =
    useState<keyof typeof LENS_TYPES>("visible");

  // 获取可用的物理无人机列表
  const physicalQuery = useQuery({
    queryKey: ["physicalDrones"],
    queryFn: getJobPhysicalDrones,
  });

  // 清空所有已选择的无人机
  const handleClearDrones = () => {
    // 使用dispatch清空选中的无人机和映射关系
    dispatch({ type: "SET_SELECTED_DRONES", payload: [] });
    dispatch({ type: "SET_DRONE_MAPPINGS", payload: [] });
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
    const selectedDronesCount = state.selectedDrones.length;
    const index = selectedDronesCount
      ? Math.max(
          ...state.selectedDrones.map((d: DroneState) => d.index || 0),
          selectedDronesCount
        ) + 1
      : 1;

    // 创建新的无人机记录
    const newDroneKey = `${index}-${droneId}-${variantionIndex}`;

    // 使用dispatch更新selectedDrones
    const newDrone = {
      ...drone,
      index: index,
      id: droneId,
      key: newDroneKey,
      variantion: variantion,
      color: color,
      physicalDrone: null, // 初始时没有绑定物理无人机
    };
    dispatch({
      type: "SET_SELECTED_DRONES",
      payload: [...state.selectedDrones, newDrone],
    });

    // 创建一个对应的空映射记录
    const newMapping: DroneMappingState = {
      selected_drone_key: newDroneKey,
      physical_drone_id: -1, // 初始时没有绑定物理无人机
      lens_type: "visible", // 默认设置为可见光
    };
    dispatch({
      type: "SET_DRONE_MAPPINGS",
      payload: [...state.droneMappings, newMapping],
    });

    // 记录最近添加的无人机键，用于在对话框中识别
    setLastAddedDroneKey(newDroneKey);

    // 重置镜头参数选择为默认值
    setSelectedLensType("visible");

    // 开启物理无人机绑定对话框
    setBindDialogOpen(true);
  };

  // 删除无人机
  const handleRemoveDrone = (droneKey: string) => {
    // 使用dispatch移除选中的无人机
    dispatch({
      type: "SET_SELECTED_DRONES",
      payload: state.selectedDrones.filter(
        (d: DroneState) => d.key !== droneKey
      ),
    });

    // 使用dispatch移除对应的映射关系
    dispatch({
      type: "SET_DRONE_MAPPINGS",
      payload: state.droneMappings.filter(
        (m: DroneMappingState) => m.selected_drone_key !== droneKey
      ),
    });

    // 重置选中的无人机键
    setSelectedDroneKey(undefined);

    // toast({
    //   title: "无人机已移除",
    //   description: "无人机已从任务中移除",
    // });
  };

  // 为无人机绑定物理机的公共函数
  const bindPhysicalDrone = (
    droneModelKey: string,
    physicalDroneId: number | string
  ) => {
    const numericPhysicalDroneId =
      typeof physicalDroneId === "string"
        ? Number(physicalDroneId)
        : physicalDroneId;

    // 从state中查找无人机模型和物理无人机
    const droneModel = state.selectedDrones.find(
      (d: DroneState) => d.key === droneModelKey
    );
    const physicalDrone = physicalQuery.data?.find(
      (d: PhysicalDrone) => d.id === numericPhysicalDroneId
    );

    if (!droneModel || !physicalDrone) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return false;
    }
    console.log("绑定物理无人机", droneModel, physicalDrone);

    // 使用dispatch更新映射关系
    const updatedMappings = state.droneMappings.map(
      (mapping: DroneMappingState) => {
        if (mapping.selected_drone_key === droneModelKey) {
          return {
            ...mapping,
            physical_drone_id: physicalDrone.id,
          };
        }
        return mapping;
      }
    );

    // 使用dispatch更新状态
    dispatch({
      type: "SET_DRONE_MAPPINGS",
      payload: updatedMappings,
    });

    // 同时更新selectedDrones中相应无人机的physicalDrone信息
    const updatedDrones = state.selectedDrones.map((drone: DroneState) => {
      if (drone.key === droneModelKey) {
        return {
          ...drone,
          physicalDrone: physicalDrone,
        };
      }
      return drone;
    });

    // 使用dispatch更新无人机状态
    dispatch({
      type: "SET_SELECTED_DRONES",
      payload: updatedDrones,
    });

    // 成功绑定后返回true
    return true;
  };

  // 为无人机绑定物理机 - 用于普通选择器
  const handleDroneSelection = (
    droneModelKey: string,
    physicalDroneId: string
  ) => {
    bindPhysicalDrone(droneModelKey, physicalDroneId);
  };

  // 为无人机设置镜头参数
  const setDroneLensType = (
    droneModelKey: string,
    lensType: keyof typeof LENS_TYPES
  ) => {
    // 更新映射关系
    const updatedMappings = state.droneMappings.map(
      (mapping: DroneMappingState) => {
        if (mapping.selected_drone_key === droneModelKey) {
          return {
            ...mapping,
            lens_type: lensType,
          };
        }
        return mapping;
      }
    );

    // 使用dispatch更新映射关系
    dispatch({
      type: "SET_DRONE_MAPPINGS",
      payload: updatedMappings,
    } as JobAction);

    // 同时更新selectedDrones中相应无人机的lensType信息
    const updatedDrones = state.selectedDrones.map((drone: DroneState) => {
      if (drone.key === droneModelKey) {
        return {
          ...drone,
          lensType: lensType,
        };
      }
      return drone;
    });

    // 使用dispatch更新无人机状态
    dispatch({
      type: "SET_SELECTED_DRONES",
      payload: updatedDrones,
    });

    toast({
      title: "镜头参数已更新",
      description: `已将无人机镜头参数设置为${LENS_TYPES[lensType]}`,
    });

    return true;
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
            disabled={!state.selectedDrones?.length}
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
      {state.selectedDrones?.length === 0 && (
        <div className="text-sm text-gray-500 mt-2 text-center">
          {isEditMode ? "请添加无人机机型" : "当前没有选择任何无人机机型"}
        </div>
      )}

      {state.selectedDrones?.map((drone: DroneState, idx: number) => {
        const mapping = state.droneMappings.find(
          (m: DroneMappingState) => m.selected_drone_key === drone.key
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
                        <SelectValue placeholder="选择物理无人机">
                          {mapping && mapping?.physical_drone_id > 0
                            ? (() => {
                                // 查找当前绑定的物理无人机
                                const physicalDrone = physicalQuery.data?.find(
                                  (pd) => pd.id === mapping.physical_drone_id
                                );
                                // 显示物理无人机的呼号和序列号
                                return physicalDrone
                                  ? `${physicalDrone.callsign} - ${physicalDrone.sn}`
                                  : "选择物理无人机";
                              })()
                            : "选择物理无人机"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {availablePhysicalDronesByModelId(drone.id).map(
                            (physicalDrone) => (
                              <SelectItem
                                key={physicalDrone.id}
                                value={String(physicalDrone.id)}
                                disabled={state.droneMappings.some(
                                  (m: DroneMappingState) =>
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

            {/* 镜头参数选择器 */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  镜头参数
                </div>

                {isEditMode ? (
                  <FormItem className="flex-1 m-0">
                    <Select
                      value={mapping?.lens_type || "visible"}
                      onValueChange={(value) =>
                        setDroneLensType(
                          drone.key,
                          value as keyof typeof LENS_TYPES
                        )
                      }
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="选择镜头参数">
                          {mapping?.lens_type
                            ? LENS_TYPES[
                                mapping.lens_type as keyof typeof LENS_TYPES
                              ] || LENS_TYPES.visible
                            : LENS_TYPES.visible}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="visible">
                            {LENS_TYPES.visible}
                          </SelectItem>
                          <SelectItem value="thermal">
                            {LENS_TYPES.thermal}
                          </SelectItem>
                          <SelectItem value="fusion">
                            {LENS_TYPES.fusion}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                ) : (
                  <div className="text-sm text-gray-600">
                    {mapping?.lens_type
                      ? LENS_TYPES[mapping.lens_type as keyof typeof LENS_TYPES]
                      : LENS_TYPES.visible}
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
            {
              // waylineAreas.length > 0 && (
              //   <div className="mt-2">
              //     <div className="flex items-center justify-between mb-1">
              //       <div className="text-xs text-gray-500">航线信息</div>
              //       {/* 找到当前无人机的航线信息 */}
              //       {waylineAreas.find((w) => w.droneKey === drone.key) &&
              //         setWaylineAreas && (
              //           <div className="flex items-center">
              //             {/* 显示航线可见性状态 */}
              //             <Button
              //               variant="ghost"
              //               size="icon"
              //               className="h-6 w-6"
              //               onClick={() => {
              //                 // 切换航线可见性
              //                 setWaylineAreas((prev) =>
              //                   prev.map((area) =>
              //                     area.droneKey === drone.key
              //                       ? { ...area, visible: !area.visible }
              //                       : area
              //                   )
              //                 );
              //               }}
              //             >
              //               {waylineAreas.find((w) => w.droneKey === drone.key)
              //                 ?.visible ? (
              //                 <Eye className="h-3 w-3" />
              //               ) : (
              //                 <EyeOff className="h-3 w-3" />
              //               )}
              //             </Button>
              //           </div>
              //         )}
              //     </div>
              //     {/* 显示航线详细信息 */}
              //     {waylineAreas.find((w) => w.droneKey === drone.key) ? (
              //       <div className="text-xs text-gray-600 flex flex-col space-y-1">
              //         <div>
              //           航点数:{" "}
              //           {waylineAreas.find((w) => w.droneKey === drone.key)
              //             ?.points?.length || 0}
              //         </div>
              //         <div>
              //           云台参数:{" "}
              //           {waylineAreas.find((w) => w.droneKey === drone.key)
              //             ?.gimbalPitch || -90}
              //           °,
              //           {waylineAreas.find((w) => w.droneKey === drone.key)
              //             ?.gimbalZoom || 1}
              //           倍
              //         </div>
              //       </div>
              //     ) : (
              //       <div className="text-xs text-gray-500 italic">
              //         尚未生成航线
              //       </div>
              //     )}
              //   </div>
              // )
            }
          </div>
        );
      })}

      {/* 物理无人机绑定对话框 */}
      <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完善信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              为了确保系统正常运行，请为刚添加的无人机绑定物理设备和设置镜头参数
            </div>
            {lastAddedDroneKey && (
              <div className="space-y-4">
                {/* 物理无人机绑定选择器 */}
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    绑定无人机
                  </div>
                  <FormItem className="flex-1 m-0">
                    <Select
                      value={selectedPhysicalDroneId}
                      onValueChange={(value) => {
                        setSelectedPhysicalDroneId(value);
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="选择物理无人机" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(() => {
                            // 根据最近添加的无人机键获取无人机对象
                            const droneKey = lastAddedDroneKey.split("-");
                            if (droneKey.length >= 2) {
                              const droneId = parseInt(droneKey[1]);
                              return availablePhysicalDronesByModelId(
                                droneId
                              ).map((physicalDrone) => (
                                <SelectItem
                                  key={physicalDrone.id}
                                  value={String(physicalDrone.id)}
                                  disabled={state.droneMappings.some(
                                    (m: DroneMappingState) =>
                                      m.physical_drone_id ===
                                        physicalDrone.id &&
                                      m.selected_drone_key !== lastAddedDroneKey
                                  )}
                                >
                                  {physicalDrone.callsign} - {physicalDrone.sn}
                                </SelectItem>
                              ));
                            }
                            return (
                              <SelectItem disabled value="0">
                                无可用物理无人机
                              </SelectItem>
                            );
                          })()}
                          {(() => {
                            // 根据最近添加的无人机键获取无人机对象
                            const droneKey = lastAddedDroneKey.split("-");
                            if (droneKey.length >= 2) {
                              const droneId = parseInt(droneKey[1]);
                              return availablePhysicalDronesByModelId(droneId)
                                .length === 0 ? (
                                <SelectItem disabled value="0">
                                  无可用物理无人机
                                </SelectItem>
                              ) : null;
                            }
                            return null;
                          })()}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>

                {/* 镜头参数选择器 */}
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    镜头参数
                  </div>
                  <FormItem className="flex-1 m-0">
                    <Select
                      value={selectedLensType}
                      onValueChange={(value) => {
                        setSelectedLensType(value as keyof typeof LENS_TYPES);
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="选择镜头参数">
                          {LENS_TYPES[selectedLensType]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="visible">
                            {LENS_TYPES.visible}
                          </SelectItem>
                          <SelectItem value="thermal">
                            {LENS_TYPES.thermal}
                          </SelectItem>
                          <SelectItem value="fusion">
                            {LENS_TYPES.fusion}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // 关闭对话框但不绑定物理无人机
                setBindDialogOpen(false);
                setSelectedPhysicalDroneId("");
              }}
            >
              稍后绑定
            </Button>
            <Button
              type="button"
              disabled={!selectedPhysicalDroneId}
              onClick={() => {
                if (lastAddedDroneKey) {
                  let success = true;

                  // 绑定物理无人机（如果已选择）
                  if (selectedPhysicalDroneId) {
                    success = bindPhysicalDrone(
                      lastAddedDroneKey,
                      selectedPhysicalDroneId
                    );
                  }

                  // 设置镜头参数
                  if (success && selectedLensType) {
                    setDroneLensType(lastAddedDroneKey, selectedLensType);
                  }

                  if (success) {
                    // 操作成功后关闭对话框
                    setBindDialogOpen(false);
                    setSelectedPhysicalDroneId("");
                    setSelectedLensType("visible"); // 重置为默认值
                    toast({
                      title: "设置成功",
                      description: "无人机配置已成功设置",
                    });
                  }
                } else {
                  toast({
                    title: "操作失败",
                    description: "无法识别当前操作的无人机",
                    variant: "destructive",
                  });
                }
              }}
            >
              确认设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
