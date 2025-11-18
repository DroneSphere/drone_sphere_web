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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Download, MapPin, Trash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getJobPhysicalDrones } from "../report/[id]/request";
import { DroneStateV2, JobAction, JobState } from "./job-state";

// 颜色选择器组件
interface DroneColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

const DRONE_COLORS = [
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
  "#FF4500",
  "#9370DB",
  "#3CB371",
  "#DC143C",
  "#00CED1",
  "#FF8C00",
  "#8B008B",
  "#2E8B57",
  "#DAA520",
  "#D2691E",
  "#6495ED",
  "#7B68EE",
];

function DroneColorPicker({ color, onColorChange }: DroneColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="h-4 w-4 rounded-full mr-2 border border-gray-100 cursor-pointer hover:scale-125 transition-transform"
          style={{ backgroundColor: color }}
          title="点击更改无人机颜色"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="text-xs font-medium mb-1.5 text-gray-700">选择颜色</div>
        <div className="grid grid-cols-6 gap-1">
          {DRONE_COLORS.map((colorValue) => (
            <div
              key={colorValue}
              className={`h-6 w-6 rounded-full cursor-pointer border hover:scale-110 transition-transform ${
                color === colorValue
                  ? "border-2 border-gray-800"
                  : "border-gray-200"
              }`}
              style={{ backgroundColor: colorValue }}
              onClick={() => {
                onColorChange(colorValue);
                setOpen(false);
              }}
              title={colorValue}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
    state,
    availableDrones,
    isMapPickingMode,
    setIsMapPickingMode,
    onPositionPick,
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
      lens_type: selectedLensType,
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

  // 下载航线文件
  const handleDownloadWayline = (fileName: string, waylineUrl: string) => {
    console.log("fileName", fileName);
    try {
      // 创建一个隐藏的a标签用于下载
      const link = document.createElement("a");
      link.href = waylineUrl;
      link.download = fileName;

      link.click();

      // 显示成功提示
      toast({
        title: "下载成功",
        description: "航线文件下载已开始",
      });
    } catch (error) {
      console.error("下载航线文件失败:", error);
      toast({
        title: "下载失败",
        description: "无法下载航线文件，请稍后再试",
        variant: "destructive",
      });
    }
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
      <div className="flex items-center justify-between mb-1">
        <div className="text-md font-medium">无人机信息</div>
      </div>

      {/* 选择无人机工具栏 */}
      <div className="flex justify-between items-center mt-2">
        <FormItem className="w-full mr-2 mb-0">
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
              <SelectTrigger className="h-10 border-gray-300 focus:ring-blue-400 bg-white">
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
                      className="text-sm"
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={handleClearDrones}
            title="清空所有已选无人机"
          >
            <span className="hidden sm:inline">清空</span>
          </Button>
          <Button
            variant="default"
            disabled={!selectedDroneKey}
            size="sm"
            type="button"
            className="h-10 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={handleAddDrone}
            title="添加无人机"
          >
            <span className="hidden sm:inline">添加</span>
          </Button>
        </div>
      </div>

      {/* 已选择的无人机列表 */}
      {state.drones?.length === 0 && (
        <div className="text-sm text-gray-500 mt-2 text-center">
          {"请添加无人机机型"}
        </div>
      )}

      {state.drones?.map((drone: DroneStateV2) => {
        return (
          <div
            className="mt-4 px-3 py-3 space-y-2 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow bg-white"
            key={drone.key}
          >
            {/* 无人机基本信息 */}
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold overflow-auto flex items-center">
                <DroneColorPicker
                  color={drone.color}
                  onColorChange={(newColor) => {
                    dispatch({
                      type: "UPDATE_DRONE_COLOR",
                      payload: { drone_key: drone.key, color: newColor },
                    });
                  }}
                />
                <span title={drone.description || "无人机型号"}>
                  {drone.name}
                </span>
              </div>

              {drone.wayline_url && drone.wayline_name && (
                <Button
                  variant="ghost"
                  title="下载航线文件"
                  size="icon"
                  type="button"
                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() =>
                    handleDownloadWayline(
                      drone.wayline_name!,
                      drone.wayline_url!
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                title="删除无人机"
                size="icon"
                type="button"
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => handleRemoveDrone(drone.key)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs flex flex-wrap gap-2">
              <div
                className={`px-2 py-1 rounded-md flex items-center ${
                  drone.variation.rtk_available
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
                title={
                  drone.variation.rtk_available
                    ? "RTK功能可用"
                    : "RTK功能不可用"
                }
              >
                <div
                  className={`rounded-full h-2 w-2 mr-1 ${
                    drone.variation.rtk_available
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span>RTK</span>
              </div>

              <div
                className={`px-2 py-1 rounded-md flex items-center ${
                  drone.variation.thermal_available
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
                title={
                  drone.variation.thermal_available
                    ? "热成像功能可用"
                    : "热成像功能不可用"
                }
              >
                <div
                  className={`rounded-full h-2 w-2 mr-1 ${
                    drone.variation.thermal_available
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span>热成像</span>
              </div>

              <div
                className="px-2 py-1 rounded-md border border-gray-200 flex items-center"
                title="无人机云台类型"
              >
                <span>云台: {drone.variation.gimbal?.name ?? "机载云台"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {/* 物理无人机绑定选择器 */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">
                  绑定无人机
                </div>
                <FormItem className="m-0">
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
                      <SelectValue
                        placeholder="选择物理无人机"
                        className="overflow-hidden"
                      >
                        <div className="whitespace-nowrap overflow-x-hidden w-full">
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
                        </div>
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

              {/* 镜头参数选择器 */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">
                  镜头参数
                </div>
                <FormItem className="m-0">
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
            <div className="mt-3 border border-gray-200 rounded-md bg-gray-50 p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-700">
                  起飞点位置
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 flex items-center bg-white"
                  onClick={() => startTakeoffPointSetting(drone.key)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {drone.takeoffPoint ? "修改起飞点" : "设置起飞点"}
                </Button>
              </div>

              {drone.takeoffPoint ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* 只保留经纬度输入框，隐藏高度输入框 */}
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">经度:</span>
                    <input
                      id={`lng-${drone.key}`}
                      type="number"
                      className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                      value={drone.takeoffPoint.lng}
                      step="0.000001"
                      placeholder="输入经度"
                      title="无人机起飞点经度坐标"
                      onChange={(e) => {
                        // 更新经度值
                        const value = Number(e.target.value);
                        if (!isNaN(value)) {
                          // 确保所有必需属性都被明确设置为非空值，避免类型错误
                          const updatedTakeoffPoint = {
                            lng: value,
                            lat: drone.takeoffPoint!.lat,
                            altitude: drone.takeoffPoint!.altitude,
                          };

                          dispatch({
                            type: "SET_DRONE_TAKEOFF_POINT",
                            payload: {
                              drone_key: drone.key,
                              takeoffPoint: updatedTakeoffPoint,
                            },
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">纬度:</span>
                    <input
                      id={`lat-${drone.key}`}
                      type="number"
                      className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                      value={drone.takeoffPoint.lat}
                      step="0.000001"
                      placeholder="输入纬度"
                      title="无人机起飞点纬度坐标"
                      onChange={(e) => {
                        // 更新纬度值
                        const value = Number(e.target.value);
                        if (!isNaN(value)) {
                          // 确保所有必需属性都被明确设置为非空值，避免类型错误
                          const updatedTakeoffPoint = {
                            lng: drone.takeoffPoint!.lng,
                            lat: value,
                            altitude: drone.takeoffPoint!.altitude,
                          };

                          dispatch({
                            type: "SET_DRONE_TAKEOFF_POINT",
                            payload: {
                              drone_key: drone.key,
                              takeoffPoint: updatedTakeoffPoint,
                            },
                          });
                        }
                      }}
                    />
                  </div>
                  {/* 隐藏高度输入框，但保留数据更新逻辑 */}
                  {/* <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">高度:</span>
                    <input
                      id={`alt-${drone.key}`}
                      type="number"
                      className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                      value={drone.takeoffPoint.altitude}
                      step="0.1"
                      placeholder="输入高度"
                      title="无人机起飞点高度（米）"
                      onChange={(e) => {
                        // 更新高度值
                        const value = Number(e.target.value);
                        if (!isNaN(value)) {
                          // 确保所有必需属性都被明确设置为非空值，避免类型错误
                          const updatedTakeoffPoint = {
                            lng: drone.takeoffPoint!.lng,
                            lat: drone.takeoffPoint!.lat,
                            altitude: value,
                          };

                          dispatch({
                            type: "SET_DRONE_TAKEOFF_POINT",
                            payload: {
                              drone_key: drone.key,
                              takeoffPoint: updatedTakeoffPoint,
                            },
                          });
                        }
                      }}
                    />
                  </div> */}
                </div>
              ) : (
                <div className="text-xs text-gray-500 bg-white p-2 rounded border border-dashed border-gray-200 text-center">
                  点击上方按钮，在地图上设置起飞点位置
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

      {isSettingTakeoffPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-5 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium">
            请在地图上点击选择起飞点位置
          </div>
        </div>
      )}
    </div>
  );
}
