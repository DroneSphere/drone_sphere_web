import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";
import { MutableRefObject } from "react";

interface WaylinePanelProps {
  isWaylinesCollapsed: boolean;
  setIsWaylinesCollapsed: (collapsed: boolean) => void;
  selectedDrones: {
    id: number;
    callsign: string;
    color: string;
    description?: string;
    model?: string;
    variantion: {
      index: number;
      name: string;
      gimbal?: {
        id: number;
        name: string;
        description?: string;
      };
      payload?: {
        id: number;
        name: string;
        description?: string;
      };
      rtk_available: boolean;
      thermal_available: boolean;
    };
  }[];
  waylineAreas: {
    droneId: number;
    callsign: string;
    color: string;
    path: AMap.LngLat[];
  }[];
  setWaylineAreas: React.Dispatch<
    React.SetStateAction<
      {
        droneId: number;
        callsign: string;
        color: string;
        path: AMap.LngLat[];
      }[]
    >
  >;
  path: AMap.LngLat[];
  AMapRef: MutableRefObject<typeof AMap | null>;
  mapRef: MutableRefObject<AMap.Map | null>;
  dividePolygonAmongDrones: (
    path: AMap.LngLat[],
    selectedDrones: any[],
    AMapRef: any
  ) => AMap.LngLat[][] | undefined;
  isEditMode: boolean;
}

export default function WaylinePanel({
  isWaylinesCollapsed,
  setIsWaylinesCollapsed,
  selectedDrones,
  waylineAreas,
  setWaylineAreas,
  path,
  AMapRef,
  mapRef,
  dividePolygonAmongDrones,
  isEditMode,
}: WaylinePanelProps) {
  const { toast } = useToast();

  return (
    <div className="mt-4 space-y-2 p-3 border rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">航线信息</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.preventDefault();
            setIsWaylinesCollapsed(!isWaylinesCollapsed);
          }}
        >
          {isWaylinesCollapsed ? (
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
      {!isWaylinesCollapsed && (
        <>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <div>已选择{selectedDrones.length}架无人机</div>
            {isEditMode && (
              <Button
                size="sm"
                variant="outline"
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

                  // 清空已有航线区域
                  setWaylineAreas([]);

                  // 创建新的航线区域
                  const newWaylineAreas = subPaths.map((subPath, i) => ({
                    droneId: selectedDrones[i].id,
                    callsign: selectedDrones[i].callsign,
                    color: selectedDrones[i].color,
                    path: subPath,
                  }));

                  setWaylineAreas(newWaylineAreas);

                  toast({
                    title: "航线已生成",
                    description: `已为${selectedDrones.length}架无人机分配区域`,
                  });
                }}
              >
                生成航线
              </Button>
            )}
          </div>
          {
            // 渲染已选择的航线
            waylineAreas.map((e, index) => (
              <div key={`${e.droneId}-${index}`}>
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <p>{e.callsign}</p>
                  </div>
                  <div className="flex-1" />
                  {/* 一个颜色指示器，方便快速识别 */}
                  <div
                    className={`rounded-full h-4 w-4 m-2`}
                    style={{ backgroundColor: e.color }}
                  />

                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setWaylineAreas((prev) =>
                          prev.filter((dr) => dr.droneId !== e.droneId)
                        );
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {index < waylineAreas.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}
