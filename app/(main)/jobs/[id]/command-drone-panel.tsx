/**
 * 指挥机面板组件
 * 负责管理指挥机列表和操作
 */
import React, { useState, useEffect, useCallback } from "react";
import { CommandDroneState, JobAction, JobState } from "./job-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 颜色选择器组件
interface CommandDroneColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

const COMMAND_DRONE_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#F033FF", "#33FFF6", "#FF33A6", 
  "#FFD700", "#4169E1", "#32CD32", "#8A2BE2", "#FF6347", "#20B2AA",
  "#FF4500", "#9370DB", "#3CB371", "#DC143C", "#00CED1", "#FF8C00",
  "#8B008B", "#2E8B57", "#DAA520", "#D2691E", "#6495ED", "#7B68EE"
];

function CommandDroneColorPicker({ color, onColorChange }: CommandDroneColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="h-4 w-4 rounded-full mr-2 border border-gray-100 cursor-pointer hover:scale-125 transition-transform"
          style={{ backgroundColor: color }}
          title="点击更改指挥机颜色"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="text-xs font-medium mb-1.5 text-gray-700">选择颜色</div>
        <div className="grid grid-cols-6 gap-1">
          {COMMAND_DRONE_COLORS.map((colorValue) => (
            <div
              key={colorValue}
              className={`h-6 w-6 rounded-full cursor-pointer border hover:scale-110 transition-transform ${
                color === colorValue ? "border-2 border-gray-800" : "border-gray-200"
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

interface CommandDronePanelProps {
  state: JobState;
  dispatch: React.Dispatch<JobAction>;
  AMapRef: React.MutableRefObject<typeof AMap | null>;
  mapRef: React.MutableRefObject<AMap.Map | null>;
  isMapPickingMode: boolean;
  setIsMapPickingMode: React.Dispatch<React.SetStateAction<boolean>>;
  onPositionPick: (position: { lat: number; lng: number }) => void;
}

export default function CommandDronePanel({
  state,
  dispatch,
  isMapPickingMode,
  setIsMapPickingMode,
  onPositionPick,
}: CommandDronePanelProps) {
  const [selectedDroneKey, setSelectedDroneKey] = useState<string>("");

  // 获取可用于指挥机的无人机列表（排除已经分配为指挥机的以及已有航线的无人机）
  const availableDrones = state.drones.filter(
    (drone) =>
      // 不能已经是指挥机
      !state.commandDrones.some((c) => c.droneKey === drone.key) &&
      // 不能已经有航线任务
      !state.waylineAreas.some((w) => w.droneKey === drone.key)
  );

  // 启动地图选点模式
  const startMapPicking = () => {
    if (!selectedDroneKey) return;

    setIsMapPickingMode(true);
    // 向用户显示提示
    toast({
      title: "指挥机位置选择模式",
      description: "请在地图上点击选择指挥机位置",
      variant: "default",
    });

    // 启动地图选点模式
    onPositionPick({ lat: 0, lng: 0 });
  };

  // 添加新的指挥机
  const addCommandDrone = () => {
    if (!selectedDroneKey) return;

    // 获取关联的无人机信息
    const drone = state.drones.find((d) => d.key === selectedDroneKey);
    if (!drone) {
      toast({
        title: "错误",
        description: "未找到关联的无人机信息",
        variant: "destructive",
      });
      return;
    }

    // 启动地图选点模式
    startMapPicking();
  };

  // 处理地图点击事件，创建指挥机
  const handleMapClick = useCallback(
    (position: { lat: number; lng: number }) => {
      // 检查是否处于地图选点模式并且选择了无人机
      if (!isMapPickingMode || !selectedDroneKey) return;

      // 获取选中的无人机信息
      const drone = state.drones.find((d) => d.key === selectedDroneKey);
      if (!drone) {
        toast({
          title: "错误",
          description: "无法创建指挥机：无人机信息丢失",
          variant: "destructive",
        });
        return;
      }

      // 创建指挥机对象
      const newCommandDrone: CommandDroneState = {
        droneKey: selectedDroneKey,
        position: {
          lat: position.lat,
          lng: position.lng,
          altitude: 100, // 默认高度100米
        },
        color: drone.color || "#3366FF", // 使用无人机的颜色
      };

      // 添加到状态
      dispatch({
        type: "ADD_COMMAND_DRONE",
        payload: newCommandDrone,
      });

      // 重置状态
      setSelectedDroneKey("");
      setIsMapPickingMode(false);

      toast({
        title: "添加成功",
        description: "指挥机位置已设置",
        variant: "default",
      });
    },
    [
      isMapPickingMode,
      selectedDroneKey,
      state.drones,
      dispatch,
      setIsMapPickingMode,
    ]
  );

  // 监听地图选点模式状态，确保正确处理点击事件
  useEffect(() => {
    if (isMapPickingMode && selectedDroneKey) {
      // 设置一个一次性的事件处理器，当地图被点击时（即onPositionPick被调用时）
      const handleOneTimeMapClick = (e: MouseEvent) => {
        // 获取地图点击位置的经纬度（由page.tsx中的setupCommandDronePickingMode函数提供）
        // 这里假设点击事件包含了position属性
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

      // 监听一个自定义事件，这个事件将由page.tsx中的代码触发
      window.addEventListener(
        "map-position-picked",
        handleOneTimeMapClick as EventListener
      );

      return () => {
        // 清理函数，确保移除事件监听器
        window.removeEventListener(
          "map-position-picked",
          handleOneTimeMapClick as EventListener
        );
      };
    }
  }, [isMapPickingMode, selectedDroneKey, handleMapClick]);

  // 删除指挥机
  const removeCommandDrone = (droneKey: string) => {
    dispatch({
      type: "REMOVE_COMMAND_DRONE",
      payload: { drone_key: droneKey },
    });
  };

  // 更新指挥机位置
  const updatePosition = (
    droneKey: string,
    field: "lat" | "lng" | "altitude",
    value: number
  ) => {
    const commandDrone = state.commandDrones.find(
      (c) => c.droneKey === droneKey
    );
    if (!commandDrone) return;

    const newPosition = { ...commandDrone.position, [field]: value };

    dispatch({
      type: "UPDATE_COMMAND_DRONE_POSITION",
      payload: {
        drone_key: droneKey,
        position: newPosition,
      },
    });
  };

  // 获取无人机显示名称
  const getDroneName = (droneKey: string) => {
    // 使用drones替代selectedDrones
    const drone = state.drones.find((d) => d.key === droneKey);
    return drone ? drone.name || `无人机 ${drone.index || 0}` : droneKey;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-md font-medium">指挥机信息</div>
      </div>
      
      {/* 选择无人机工具栏 */}
      <div className="flex justify-between items-center mt-2">
        <div className="w-3/4 mr-4">
          <Select
            value={selectedDroneKey}
            onValueChange={(value) => setSelectedDroneKey(value)}
            disabled={isMapPickingMode}
          >
            <SelectTrigger className="h-10 border-gray-300 focus:ring-blue-400 bg-white">
              <SelectValue placeholder="选择无人机作为指挥机" />
            </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {availableDrones.length === 0 ? (
              <SelectItem value="none" disabled className="text-sm">
                没有可用的无人机
              </SelectItem>
            ) : (
              availableDrones.map((drone) => (
                <SelectItem key={drone.key} value={drone.key} className="text-sm">
                  {drone.name || `无人机 ${drone.index || 0}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          disabled={!selectedDroneKey || isMapPickingMode}
          onClick={addCommandDrone}
          className="h-10 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          size="sm"
        >
          {isMapPickingMode ? "点击地图选择位置" : "添加指挥机"}
        </Button>
      </div>

      {isMapPickingMode && (
        <div className="mt-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            请在地图上点击选择指挥机位置
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            onClick={() => setIsMapPickingMode(false)}
          >
            取消选择
          </Button>
        </div>
      )}

      {/* 指挥机列表 */}
      <div className="space-y-3">
        {state.commandDrones.map((commandDrone) => (
          <div
            key={commandDrone.droneKey}
            className="mt-4 px-3 py-3 space-y-2 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold overflow-auto flex items-center">
                <CommandDroneColorPicker
                  color={commandDrone.color}
                  onColorChange={(newColor) => {
                    dispatch({
                      type: "UPDATE_COMMAND_DRONE_COLOR",
                      payload: { drone_key: commandDrone.droneKey, color: newColor }
                    });
                  }}
                />
                <span title="指挥机">{getDroneName(commandDrone.droneKey)}</span>
              </div>
              <Button
                variant="ghost"
                title="删除指挥机"
                size="icon"
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => removeCommandDrone(commandDrone.droneKey)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* 位置信息 */}
            <div className="mt-3 border border-gray-200 rounded-md bg-gray-50 p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-700">
                  指挥机位置
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-600 mb-1">纬度:</span>
                  <input
                    id={`lat-${commandDrone.droneKey}`}
                    type="number"
                    className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                    step="0.000001"
                    value={commandDrone.position.lat}
                    onChange={(e) =>
                      updatePosition(
                        commandDrone.droneKey,
                        "lat",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 mb-1">经度:</span>
                  <input
                    id={`lng-${commandDrone.droneKey}`}
                    type="number"
                    className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                    step="0.000001"
                    value={commandDrone.position.lng}
                    onChange={(e) =>
                      updatePosition(
                        commandDrone.droneKey,
                        "lng",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 mb-1">高度(米):</span>
                  <input
                    id={`alt-${commandDrone.droneKey}`}
                    type="number"
                    className="w-full h-7 px-2 py-0 text-xs border border-gray-300 rounded bg-white"
                    min="0"
                    step="1"
                    value={commandDrone.position.altitude}
                    onChange={(e) =>
                      updatePosition(
                        commandDrone.droneKey,
                        "altitude",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {state.commandDrones.length === 0 && (
          <div className="mt-4 p-6 border border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
            <div className="text-gray-500 mb-2">暂无指挥机</div>
            <div className="text-xs text-gray-400">请从下拉菜单选择无人机，然后在地图上点击设置指挥机位置</div>
          </div>
        )}
      </div>
      
      {isMapPickingMode && (
        <div className="fixed inset-0 bg-black bg-opacity-5 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium">
            请在地图上点击选择指挥机位置
          </div>
        </div>
      )}
    </div>
  );
}
