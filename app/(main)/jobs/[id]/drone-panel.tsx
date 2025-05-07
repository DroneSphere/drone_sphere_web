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
import { MapPin, Plus, Trash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getJobPhysicalDrones } from "../report/[id]/request";
import {
  DroneMappingState,
  DroneStateV2,
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
  availableDrones: JobCreationResult["drones"]; // 可选的无人机列表
  state: JobState; // 统一的状态对象，包含所有相关状态
  dispatch: React.Dispatch<JobAction>;
  isMapPickingMode: boolean; // 地图选点模式状态
  setIsMapPickingMode: React.Dispatch<React.SetStateAction<boolean>>; // 设置地图选点模式
  onPositionPick: (position: { lat: number; lng: number }) => void; // 地图点击事件回调
}

/**
 * 合并的无人机面板组件
 * 整合了执飞机型选择和物理无人机绑定的功能
 */
export default function DronePanel({
  availableDrones,
  state,
  dispatch,
  isMapPickingMode,
  setIsMapPickingMode,
  onPositionPick,
}: DronePanelProps) {
  console.log("DronePanel", {
    selectedDrones: state.selectedDrones,
    droneMappings: state.droneMappings,
    availableDrones,
    waylineAreas: state.waylineAreas,
  });

  const { toast } = useToast();
  const [selectedDroneKey, setSelectedDroneKey] = useState<string | undefined>(
    undefined
  );
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(
    undefined
  );
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<
    number | undefined
  >(undefined);
  // 起飞点设置模式状态
  const [isSettingTakeoffPoint, setIsSettingTakeoffPoint] =
    useState<boolean>(false);
  // 当前选中的要设置起飞点的无人机key
  const [takeoffPointDroneKey, setTakeoffPointDroneKey] = useState<string>("");
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

  // 添加无人机
  const handleAddDrone = () => {
    if (!selectedDroneKey) {
      toast({
        title: "请选择无人机",
        description: "请先选择要添加的无人机机型",
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
    const index = state.drones.length
      ? Math.max(
          ...state.drones.map((d: DroneStateV2) => d.index || 0),
          state.drones.length
        ) + 1
      : 1;

    // 获取无人机型号的信息
    const droneModel = availableDrones.find((d) => d.id === selectedModelId);
    const droneVariation = droneModel?.variantions.find(
      (v) => v.id === selectedVariationIndex
    );
    console.log("添加无人机", {
      selectedDroneKey,
      selectedModelId,
      selectedVariationIndex,
      droneModel,
      droneVariation,
    });

    console.log("无人机信息", {
      model: droneModel,
      variation: droneVariation,
    });

    if (!droneModel || !droneVariation) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机型号或变体",
        variant: "destructive",
      });
      return;
    }

    // 使用dispatch更新selectedDrones
    const newDrone: DroneStateV2 = {
      key: `${index}-${selectedModelId}-${selectedVariationIndex}`,
      index: index,
      model_id: selectedModelId!,
      name: droneModel.name,
      description: droneModel.description,
      color: color,
      variation: droneVariation!,
    };
    dispatch({
      type: "ADD_DRONE_V2",
      payload: newDrone,
    });

    // 记录最近添加的无人机键，用于在对话框中识别
    setLastAddedDroneKey(newDrone.key);

    // 重置镜头参数选择为默认值
    setSelectedLensType("visible");

    // 开启物理无人机绑定对话框
    setBindDialogOpen(true);
  };

  // 清空所有已选择的无人机
  const handleClearDrones = () => {
    // 使用dispatch清空选中的无人机和映射关系
    dispatch({ type: "SET_DRONES", payload: [] });
  };

  // 删除无人机
  const handleRemoveDrone = (droneKey: string) => {
    // 使用dispatch移除选中的无人机
    dispatch({
      type: "REMOVE_DRONE_V2",
      payload: { key: droneKey },
    });
  };

  // 为无人机设定参数
  const setDroneParams = (
    droneModelKey: string,
    physicalDroneId?: number,
    lensType?: keyof typeof LENS_TYPES
  ) => {
    // 从state中查找无人机模型和物理无人机
    const droneModel = state.drones.find(
      (d: DroneStateV2) => d.key === droneModelKey
    );

    if (!droneModel) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return false;
    }

    // 使用dispatch更新映射关系
    const newState: DroneStateV2 = {
      ...droneModel,
      physical_drone_id: physicalDroneId || droneModel.physical_drone_id,
      lens_type: lensType || droneModel.lens_type,
    };

    // 使用dispatch更新状态
    dispatch({
      type: "UPDATE_DRONE_V2",
      payload: newState,
    });

    // 成功绑定后返回true
    return true;
  };

  // 启动起飞点设置模式
  const startTakeoffPointSetting = (droneKey: string) => {
    // 检查无人机是否存在
    const drone = state.drones.find((d) => d.key === droneKey);
    if (!drone) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return;
    }

    // 设置当前选中的无人机key
    setTakeoffPointDroneKey(droneKey);

    // 进入地图选点模式
    setIsMapPickingMode(true);
    setIsSettingTakeoffPoint(true);

    // 显示提示信息
    toast({
      title: "起飞点选择模式",
      description: `请在地图上点击为【${drone.name}】选择起飞点位置`,
    });
  };

  // 处理地图点击事件，设置起飞点
  const handleMapClick = useCallback(
    (position: { lat: number; lng: number }) => {
      // 检查是否正在设置起飞点且有选中的无人机
      if (!isSettingTakeoffPoint || !takeoffPointDroneKey) return;

      // 获取选中的无人机信息
      const drone = state.drones.find((d) => d.key === takeoffPointDroneKey);
      if (!drone) {
        toast({
          title: "错误",
          description: "无法设置起飞点：无人机信息丢失",
          variant: "destructive",
        });
        return;
      }

      // 设置起飞点（默认高度为30米）
      dispatch({
        type: "SET_DRONE_TAKEOFF_POINT",
        payload: {
          drone_key: takeoffPointDroneKey,
          takeoffPoint: {
            lat: position.lat,
            lng: position.lng,
            altitude: 30, // 默认起飞高度为30米
          },
        },
      });

      // 重置状态
      setTakeoffPointDroneKey("");
      setIsSettingTakeoffPoint(false);
      setIsMapPickingMode(false);

      // 显示成功提示
      toast({
        title: "设置成功",
        description: `已成功为【${drone.name}】设置起飞点`,
      });
    },
    [
      isSettingTakeoffPoint,
      takeoffPointDroneKey,
      state.drones,
      dispatch,
      setIsMapPickingMode,
      toast,
    ]
  );

  // 监听地图选点模式状态和点击事件
  useEffect(() => {
    if (isSettingTakeoffPoint && takeoffPointDroneKey) {
      // 设置一次性的事件处理器，当地图被点击时（由page.tsx中的函数触发）
      const handleOneTimeMapClick = (e: Event) => {
        // 获取地图点击位置的经纬度
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const position = (e as any).detail;
        if (
          position &&
          typeof position.lat === "number" &&
          typeof position.lng === "number"
        ) {
          handleMapClick(position);
        }
      };

      // 监听地图点击位置事件，这个事件由父组件中的代码触发
      window.addEventListener("map-position-picked", handleOneTimeMapClick);

      return () => {
        // 清理函数，移除事件监听器
        window.removeEventListener(
          "map-position-picked",
          handleOneTimeMapClick
        );
      };
    }
  }, [isSettingTakeoffPoint, takeoffPointDroneKey, handleMapClick]);

  // 根据无人机型号ID过滤可用的物理无人机
  const availablePhysicalDronesByModelId = (
    droneModelId: number
  ): PhysicalDrone[] => {
    return physicalQuery.data?.filter((d) => d.model.id === droneModelId) || [];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">无人机信息</div>
      </div>

      {/* 选择无人机工具栏 */}
      <div className="flex justify-between items-center mt-2">
        <FormItem className="flex-1 mr-4">
          <Select
            value={selectedDroneKey}
            onValueChange={(value) => {
              setSelectedDroneKey(value);
              const modelId = parseInt(value.split("-")[1]);
              const variationIndex = parseInt(value.split("-")[2]);
              setSelectedModelId(modelId);
              setSelectedVariationIndex(variationIndex);
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
          type="button"
          variant="destructive"
          size="icon"
          className="mr-2 h-8 w-8"
          onClick={handleClearDrones}
          title="清空所有已选无人机"
        >
          <Trash className="h-4 w-4" />
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

      {/* 已选择的无人机列表 */}
      {state.drones?.length === 0 && (
        <div className="text-sm text-gray-500 mt-2 text-center">
          {"请添加无人机机型"}
        </div>
      )}

      {state.drones?.map((drone: DroneStateV2, idx: number) => {
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

              <Button
                variant="destructive"
                title="删除无人机"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveDrone(drone.key)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              云台: {drone.variation.gimbal?.name ?? "机载云台"}
            </div>

            {/* 物理无人机绑定选择器 */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  绑定无人机
                </div>

                <FormItem className="flex-1 m-0">
                  <Select
                    value={
                      drone.physical_drone_id
                        ? String(drone.physical_drone_id)
                        : "0"
                    }
                    onValueChange={(value) =>
                      setDroneParams(drone.key, Number(value))
                    }
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="选择物理无人机">
                        {drone.physical_drone_id
                          ? (() => {
                              // 查找当前绑定的物理无人机
                              const physicalDrone = physicalQuery.data?.find(
                                (pd) => pd.id === drone.physical_drone_id
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
                        {availablePhysicalDronesByModelId(drone.model_id).map(
                          (physicalDrone) => (
                            <SelectItem
                              key={physicalDrone.id}
                              value={String(physicalDrone.id)}
                            >
                              {physicalDrone.callsign} - {physicalDrone.sn}
                            </SelectItem>
                          )
                        )}
                        {availablePhysicalDronesByModelId(drone.model_id)
                          .length === 0 && (
                          <SelectItem disabled value="0">
                            无可用物理无人机
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>
            </div>

            {/* 镜头参数选择器 */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  镜头参数
                </div>

                <FormItem className="flex-1 m-0">
                  <Select
                    value={drone?.lens_type || "visible"}
                    onValueChange={(value) =>
                      setDroneParams(
                        drone.key,
                        undefined,
                        value as keyof typeof LENS_TYPES
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="选择镜头参数">
                        {drone?.lens_type
                          ? LENS_TYPES[
                              drone.lens_type as keyof typeof LENS_TYPES
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
              </div>
            </div>
            {/* 无人机功能状态 */}
            <div className="text-xs text-gray-500 flex items-center">
              <div
                className={`rounded-full h-3 w-3 mr-1 ${
                  drone.variation.rtk_available ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="mr-2">
                {drone.variation.rtk_available ? "RTK可用" : "RTK不可用"}
              </div>

              <div
                className={`rounded-full h-3 w-3 mr-1 ${
                  drone.variation.thermal_available
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <div>
                {drone.variation.thermal_available
                  ? "热成像可用"
                  : "热成像不可用"}
              </div>
            </div>

            {/* 起飞点设置区域 */}
            <div className="mt-2 border-t pt-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">起飞点位置</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 flex items-center"
                  onClick={() => startTakeoffPointSetting(drone.key)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {drone.takeoffPoint ? "修改起飞点" : "设置起飞点"}
                </Button>
              </div>

              {/* 显示起飞点信息 */}
              {drone.takeoffPoint ? (
                <div className="mt-1">
                  <div className="grid grid-cols-3 gap-1 text-xs mb-1">
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-1">经度:</span>
                      <input
                        type="number"
                        className="w-full h-6 px-1 py-0 text-xs border border-gray-200 rounded"
                        value={drone.takeoffPoint.lng}
                        step="0.000001"
                        onChange={(e) => {
                          // 更新经度值
                          const value = Number(e.target.value);
                          if (!isNaN(value)) {
                            // 确保所有必需属性都被明确设置为非空值，避免类型错误
                            const updatedTakeoffPoint = {
                              lng: value,
                              lat: drone.takeoffPoint!.lat,
                              altitude: drone.takeoffPoint!.altitude
                            };
                            
                            dispatch({
                              type: "SET_DRONE_TAKEOFF_POINT",
                              payload: {
                                drone_key: drone.key,
                                takeoffPoint: updatedTakeoffPoint
                              }
                            });
                            
                            // 添加简洁的成功提示
                            toast({
                              title: "起飞点已更新",
                              description: `经度已修改为 ${value.toFixed(6)}`,
                              duration: 2000, // 显示2秒
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-1">纬度:</span>
                      <input
                        type="number"
                        className="w-full h-6 px-1 py-0 text-xs border border-gray-200 rounded"
                        value={drone.takeoffPoint.lat}
                        step="0.000001"
                        onChange={(e) => {
                          // 更新纬度值
                          const value = Number(e.target.value);
                          if (!isNaN(value) && drone.takeoffPoint) {
                            // 创建完整的takeoffPoint对象，明确指定所有必需属性
                            const updatedTakeoffPoint = {
                              lng: drone.takeoffPoint.lng,
                              lat: value,
                              altitude: drone.takeoffPoint.altitude
                            };
                            
                            dispatch({
                              type: "SET_DRONE_TAKEOFF_POINT",
                              payload: {
                                drone_key: drone.key,
                                takeoffPoint: updatedTakeoffPoint
                              }
                            });
                            
                            // 添加简洁的成功提示
                            toast({
                              title: "起飞点已更新",
                              description: `纬度已修改为 ${value.toFixed(6)}`,
                              duration: 2000, // 显示2秒
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-1">高度(米):</span>
                      <input
                        type="number"
                        className="w-full h-6 px-1 py-0 text-xs border border-gray-200 rounded"
                        value={drone.takeoffPoint.altitude}
                        min="0"
                        max="500"
                        step="1"
                        onChange={(e) => {
                          // 更新高度值
                          const value = Number(e.target.value);
                          if (!isNaN(value) && value >= 0 && drone.takeoffPoint) {
                            // 创建完整的takeoffPoint对象，明确指定所有必需属性
                            const updatedTakeoffPoint = {
                              lng: drone.takeoffPoint.lng,
                              lat: drone.takeoffPoint.lat,
                              altitude: value
                            };
                            
                            dispatch({
                              type: "SET_DRONE_TAKEOFF_POINT",
                              payload: {
                                drone_key: drone.key,
                                takeoffPoint: updatedTakeoffPoint
                              }
                            });
                            
                            // 添加简洁的成功提示
                            toast({
                              title: "起飞点已更新",
                              description: `起飞高度已修改为 ${value} 米`,
                              duration: 2000, // 显示2秒
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-400 italic">
                  未设置起飞点位置
                </div>
              )}
            </div>
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

                  success = setDroneParams(
                    lastAddedDroneKey,
                    Number(selectedPhysicalDroneId),
                    selectedLensType
                  );

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
