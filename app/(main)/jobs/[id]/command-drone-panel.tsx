/**
 * 指挥机面板组件
 * 负责管理指挥机列表和操作
 */
import React, { useState, useEffect, useCallback } from "react";
import { CommandDroneState, JobAction, JobState } from "./job-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      !state.commandDrones.some((c) => c.drone_key === drone.key) &&
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
        drone_key: selectedDroneKey,
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
      (c) => c.drone_key === droneKey
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
    <div>
      <div className="py-3">
        <div className="text-md font-bold">指挥机设置</div>
      </div>
      {/* <CardContent className="py-2"> */}
      {/* 选择无人机作为指挥机 */}
      <div className="flex items-center gap-2 mb-4">
        <Select
          value={selectedDroneKey}
          onValueChange={(value) => setSelectedDroneKey(value)}
          disabled={isMapPickingMode}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择无人机" />
          </SelectTrigger>
          <SelectContent>
            {availableDrones.length === 0 ? (
              <SelectItem value="none" disabled>
                没有可用的无人机
              </SelectItem>
            ) : (
              availableDrones.map((drone) => (
                <SelectItem key={drone.key} value={drone.key}>
                  {drone.name || `无人机 ${drone.index || 0}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={!selectedDroneKey || isMapPickingMode}
          onClick={addCommandDrone}
          className="whitespace-nowrap"
        >
          {isMapPickingMode ? "点击地图选择位置" : "添加指挥机"}
        </Button>
      </div>

      {isMapPickingMode && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
          请在地图上点击选择指挥机位置，或者
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-amber-700 underline"
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
            key={commandDrone.drone_key}
            className="border rounded-md p-3 bg-slate-50"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: commandDrone.color }}
                ></div>
                {getDroneName(commandDrone.drone_key)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => removeCommandDrone(commandDrone.drone_key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* 位置信息 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor={`lat-${commandDrone.drone_key}`}
                  className="text-xs"
                >
                  纬度
                </Label>
                <Input
                  id={`lat-${commandDrone.drone_key}`}
                  type="number"
                  step="0.000001"
                  value={commandDrone.position.lat}
                  onChange={(e) =>
                    updatePosition(
                      commandDrone.drone_key,
                      "lat",
                      parseFloat(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`lng-${commandDrone.drone_key}`}
                  className="text-xs"
                >
                  经度
                </Label>
                <Input
                  id={`lng-${commandDrone.drone_key}`}
                  type="number"
                  step="0.000001"
                  value={commandDrone.position.lng}
                  onChange={(e) =>
                    updatePosition(
                      commandDrone.drone_key,
                      "lng",
                      parseFloat(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`alt-${commandDrone.drone_key}`}
                  className="text-xs"
                >
                  高度(米)
                </Label>
                <Input
                  id={`alt-${commandDrone.drone_key}`}
                  type="number"
                  min="0"
                  step="1"
                  value={commandDrone.position.altitude}
                  onChange={(e) =>
                    updatePosition(
                      commandDrone.drone_key,
                      "altitude",
                      parseInt(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>
        ))}

        {state.commandDrones.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            暂无指挥机，请添加指挥机
          </div>
        )}
      </div>
    </div>
  );
}
