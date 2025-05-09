import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MutableRefObject, useState } from "react";
import { dividePolygonAmongDrones, generateWaypoints } from "./actions";
import { JobAction, JobState, WaylineAreaState } from "./job-state";

interface WaylinePanelProps {
  state: JobState;
  dispatch: React.Dispatch<JobAction>;
  AMapRef: MutableRefObject<typeof AMap | null>;
  mapRef: MutableRefObject<AMap.Map | null>;
}

export default function WaylinePanel({
  state,
  dispatch,
  AMapRef,
  mapRef,
}: WaylinePanelProps) {
  const { toast } = useToast();

  // 添加无人机飞行参数状态，增加云台相关参数和航线层高间隔
  const [waylineParams, setWaylineParams] = useState({
    flyingHeight: 30, // 默认飞行高度30米
    coverageWidth: 12, // 默认每次覆盖20米宽
    overlapRate: 0.2, // 默认20%的重叠率
    heightInterval: 0.5, // 默认航线层高间隔5米，用于避免不同航线的高度冲突
    gimbalPitch: -90, // 默认云台俯仰角-90度（垂直向下）
    gimbalZoom: 1, // 默认放大倍数1x
  });

  // 过滤掉被指定为指挥机的无人机，只使用普通无人机参与航线飞行
  const availableDrones = state.drones.filter(
    (drone) => !state.commandDrones.some((cmd) => cmd.droneKey === drone.key)
  );

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">航线信息</div>
      </div>

      {/* 移除折叠状态判断，内容始终显示 */}
      <div className="text-sm text-gray-500 flex items-center justify-between">
        <div>
          已选择{availableDrones.length}架可用无人机
          {availableDrones.length < state.drones.length &&
            `(${state.drones.length - availableDrones.length}架用作指挥机)`}
        </div>

        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => {
            if (state.path.length <= 0 || !AMapRef.current || !mapRef.current) {
              toast({
                title: "无法生成航线",
                description: "请确保已选择区域",
              });
              return;
            }

            if (availableDrones.length === 0) {
              toast({
                title: "无法生成航线",
                description:
                  "没有可用于航线的无人机，所有无人机都被设置为指挥机",
                variant: "destructive",
              });
              return;
            }

            // 首先清除已有的航线
            dispatch({
              type: "SET_WAYLINE_AREAS",
              payload: [],
            });

            const subPaths = dividePolygonAmongDrones(
              state.path,
              availableDrones, // 使用过滤后的可用无人机列表
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
            const newWaylineAreas: WaylineAreaState[] = availableDrones.map(
              (drone, index) => {
                // 获取对应的子区域路径，如果index超出了subPaths的长度，则使用最后一个
                const subPath =
                  index < subPaths.length
                    ? subPaths[index]
                    : subPaths[subPaths.length - 1];

                return {
                  droneKey: drone.key,
                  color: drone.color,
                  altitude: waylineParams.flyingHeight + index * waylineParams.heightInterval,
                  path: subPath,
                  waypoints: generateWaypoints(
                    subPath,
                    waylineParams,
                    AMapRef,
                    drone.takeoffPoint // 传入无人机的起飞点以优化航点顺序
                  ),
                  visible: true,
                  gimbalPitch: waylineParams.gimbalPitch,
                  gimbalZoom: waylineParams.gimbalZoom,
                };
              }
            );

            // 使用dispatch更新航线区域
            dispatch({
              type: "SET_WAYLINE_AREAS",
              payload: newWaylineAreas,
            });
          }}
        >
          生成航线
        </Button>
      </div>

      {/* 航线参数卡片 */}
      <div className="mt-2 border p-2 rounded-md">
        <p className="text-sm font-medium mb-1">航线参数</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">飞行高度(米)</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={waylineParams.flyingHeight}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
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
              value={waylineParams.coverageWidth}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
                  coverageWidth: Number(e.target.value),
                })
              }
              min="1"
              max="50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">旁向重叠率(%)</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={waylineParams.overlapRate * 100}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
                  overlapRate: Number(e.target.value) / 100,
                })
              }
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">航线层高间隔(米)</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={waylineParams.heightInterval}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
                  heightInterval: Number(e.target.value),
                })
              }
              min="0.1"
              max="10"
              step="0.1"
            />
            <div className="text-xs text-gray-400 p-1">(相邻航线高度差)</div>
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
              value={waylineParams.gimbalPitch}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
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
              value={waylineParams.gimbalZoom}
              onChange={(e) =>
                setWaylineParams({
                  ...waylineParams,
                  gimbalZoom: Math.max(1, Math.min(30, Number(e.target.value))),
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
    </div>
  );
}
