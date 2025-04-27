import { JobDetailResult } from "@/app/(main)/jobs/report/[id]/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MutableRefObject, useState } from "react";
import { dividePolygonAmongDrones, generateWaypoints } from "./actions";

interface WaylinePanelProps {
  selectedDrones: JobDetailResult["drones"];
  waylineAreas: {
    droneKey: string;
    color: string;
    path: AMap.LngLat[];
    points?: AMap.LngLat[];
    visible?: boolean;
    gimbalPitch?: number;
    gimbalZoom?: number;
  }[];
  setWaylineAreas: React.Dispatch<
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
  path: AMap.LngLat[];
  AMapRef: MutableRefObject<typeof AMap | null>;
  mapRef: MutableRefObject<AMap.Map | null>;
  isEditMode: boolean;
}

export default function WaylinePanel({
  selectedDrones,
  waylineAreas,
  setWaylineAreas,
  path,
  AMapRef,
  mapRef,
  isEditMode,
}: WaylinePanelProps) {
  const { toast } = useToast();
  console.log("waylineAreas", waylineAreas);

  // 添加无人机飞行参数状态，增加云台相关参数
  const [droneParams, setDroneParams] = useState({
    flyingHeight: 30, // 默认飞行高度30米
    coverageWidth: 20, // 默认每次覆盖20米宽
    overlapRate: 0.2, // 默认20%的重叠率
    gimbalPitch: -90, // 默认云台俯仰角-90度（垂直向下）
    gimbalZoom: 1, // 默认放大倍数1x
  });

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">航线信息</div>
      </div>

      {/* 移除折叠状态判断，内容始终显示 */}
      <div className="text-sm text-gray-500 flex items-center justify-between">
        <div>已选择{selectedDrones.length}架无人机</div>
        {isEditMode && (
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              if (
                path.length <= 0 ||
                !AMapRef.current ||
                !mapRef.current ||
                selectedDrones.length === 0
              ) {
                toast({
                  title: "无法生成航线",
                  description: "请确保已选择区域和无人机",
                });
                return;
              }

              const subPaths = dividePolygonAmongDrones(
                path,
                selectedDrones,
                AMapRef
              );
              if (!subPaths) {
                toast({
                  title: "无法生成航线",
                  description: "请确保已选择区域和无人机",
                });
                return;
              }

              // 生成新的航线区域，包含云台参数
              const newWaylineAreas = selectedDrones.map((drone, index) => {
                // 获取对应的子区域路径，如果index超出了subPaths的长度，则使用最后一个
                const subPath =
                  index < subPaths.length
                    ? subPaths[index]
                    : subPaths[subPaths.length - 1];

                // 使用当前设置的参数生成航点
                const waypoints = generateWaypoints(
                  subPath,
                  droneParams,
                  AMapRef
                );

                return {
                  droneKey: drone.key,
                  color: drone.color,
                  path: subPath,
                  points: waypoints,
                  visible: true,
                  gimbalPitch: droneParams.gimbalPitch,
                  gimbalZoom: droneParams.gimbalZoom,
                };
              });

              // 更新航线区域
              setWaylineAreas(newWaylineAreas);
              toast({
                title: "航线生成成功",
                description: `已为${selectedDrones.length}架无人机分配区域并生成航点`,
              });
            }}
          >
            生成航线
          </Button>
        )}
      </div>

      {/* 添加无人机参数设置 */}
      {isEditMode && (
        <>
          {/* 航线参数卡片 */}
          <div className="mt-2 border p-2 rounded-md">
            <p className="text-sm font-medium mb-1">航线参数</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">飞行高度(米)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={droneParams.flyingHeight}
                  onChange={(e) =>
                    setDroneParams({
                      ...droneParams,
                      flyingHeight: Number(e.target.value),
                    })
                  }
                  min="10"
                  max="120"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">覆盖宽度(米)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={droneParams.coverageWidth}
                  onChange={(e) =>
                    setDroneParams({
                      ...droneParams,
                      coverageWidth: Number(e.target.value),
                    })
                  }
                  min="5"
                  max="50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">旁向重叠率(%)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={droneParams.overlapRate * 100}
                  onChange={(e) =>
                    setDroneParams({
                      ...droneParams,
                      overlapRate: Number(e.target.value) / 100,
                    })
                  }
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* 云台参数卡片 */}
          <div className="mt-2 border p-2 rounded-md">
            <p className="text-sm font-medium mb-1">云台参数</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">俯仰角(度)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={droneParams.gimbalPitch}
                  onChange={(e) =>
                    setDroneParams({
                      ...droneParams,
                      gimbalPitch: Math.max(
                        -90,
                        Math.min(0, Number(e.target.value))
                      ),
                    })
                  }
                  min="-90"
                  max="0"
                  step="5"
                />
                <div className="text-xs text-gray-400 p-1">
                  (-90°垂直向下，0°水平)
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">放大倍数</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={droneParams.gimbalZoom}
                  onChange={(e) =>
                    setDroneParams({
                      ...droneParams,
                      gimbalZoom: Math.max(
                        1,
                        Math.min(30, Number(e.target.value))
                      ),
                    })
                  }
                  min="1"
                  max="30"
                  step="0.5"
                />
                <div className="text-xs text-gray-400 p-1">(1-30倍)</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
