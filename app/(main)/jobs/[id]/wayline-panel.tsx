import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MutableRefObject } from "react";
import { dividePolygonAmongDrones, generateWaypoints } from "./actions";
import { JobAction, JobState, WaylineAreaState } from "./job-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // 处理航线参数变化的函数
  const handleWaylineParamChange = (paramName: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      dispatch({
        type: "SET_WAYLINE_PARAMS",
        payload: { [paramName]: numericValue },
      });
    } else if (value === "") {
      dispatch({
        type: "SET_WAYLINE_PARAMS",
        payload: { [paramName]: undefined },
      });
    }
  };

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
            const newWaylineAreas: WaylineAreaState[] = availableDrones
              .map((drone, index) => {
                // 获取对应的子区域路径，如果index超出了subPaths的长度，则使用最后一个
                const subPath =
                  index < subPaths.length
                    ? subPaths[index]
                    : subPaths[subPaths.length - 1];

                // 使用 state.waylineParams 中的参数
                const altitude =
                  state.waylineParams.flyingHeight +
                  index * state.waylineParams.heightInterval;
                const waypoints = generateWaypoints(
                  subPath,
                  // 直接传递 state.waylineParams 对象，它包含了所有需要的参数
                  state.waylineParams,
                  AMapRef,
                  // 传递无人机的起飞点信息（如果存在）
                  drone.takeoffPoint
                );

                if (!waypoints || waypoints.length === 0) {
                  // 如果没有生成航点，可以返回一个空的或者标记无效的航线区域
                  // 或者直接在此处过滤掉，不创建此无人机的航线
                  // 为简化，这里假设总能生成航点，实际应用中应有更完善的错误处理
                  return null;
                }

                return {
                  droneKey: drone.key,
                  path: waypoints.map(
                    (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
                  ),
                  waypoints: waypoints.map(
                    (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
                  ),
                  altitude: altitude,
                  color: drone.color,
                  gimbalPitch: state.waylineParams.gimbalPitch, // 使用 state 中的值
                  gimbalZoom: state.waylineParams.gimbalZoom, // 使用 state 中的值
                  visible: true,
                };
              })
              .filter((area) => area !== null) as WaylineAreaState[];

            if (newWaylineAreas.length === 0 && availableDrones.length > 0) {
              toast({
                title: "无法生成航线点",
                description:
                  "请检查区域形状和航线参数设置，确保可以生成有效的航点。",
              });
            }

            dispatch({
              type: "SET_WAYLINE_AREAS",
              payload: newWaylineAreas,
            });
          }}
        >
          生成航线
        </Button>
      </div>

      {/* 航线参数设置UI - 简化为仅保留飞行高度字段 */}
      <div className="mt-4 p-4 border rounded-md">
        <div className="max-w-xs">
          <Label htmlFor="flyingHeight">飞行高度 (米)</Label>
          <Input
            id="flyingHeight"
            type="number"
            value={state.waylineParams.flyingHeight}
            onChange={(e) =>
              handleWaylineParamChange("flyingHeight", e.target.value)
            }
            className="mt-1"
            placeholder="输入飞行高度"
          />
          <p className="text-xs text-gray-500 mt-2">
            设置无人机的飞行高度，其他参数将使用优化默认值
          </p>
        </div>

        {/* 以下字段已从UI移除，但保留在后台计算中使用：
            - 覆盖宽度 (coverageWidth): 默认12米
            - 重叠率 (overlapRate): 默认0.1
            - 层高间隔 (heightInterval): 默认0.5米
            - 云台俯仰角 (gimbalPitch): 默认-90度
            - 云台变焦 (gimbalZoom): 默认1倍
        */}
      </div>
    </div>
  );
}
