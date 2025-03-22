import { JobDetailResult } from "@/app/(main)/jobs/[id]/type";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as turf from "@turf/turf";
import { Trash } from "lucide-react";
import { MutableRefObject, useState } from "react";

function dividePolygonAmongDrones(
  path: AMap.LngLat[],
  selectedDrones: JobDetailResult["drones"],
  AMapRef: MutableRefObject<typeof AMap | null>
) {
  const droneCount = selectedDrones.length;
  if (droneCount === 0) {
    return;
  }

  const coordinates = path.map((p) => [p.getLng(), p.getLat()]);
  // 确保多边形是闭合的
  if (coordinates.length > 0) {
    const firstCoordinate = coordinates[0];
    const lastCoordinate = coordinates[coordinates.length - 1];
    // 检查第一个和最后一个坐标是否相同
    if (
      firstCoordinate[0] !== lastCoordinate[0] ||
      firstCoordinate[1] !== lastCoordinate[1]
    ) {
      coordinates.push(firstCoordinate); // 将第一个坐标添加到末尾
    }
  }
  const turfPolygon = turf.polygon([coordinates]);
  const totalArea = turf.area(turfPolygon);
  const targetArea = totalArea / droneCount;

  const bounds = turf.bbox(turfPolygon);
  const minLng = bounds[0];
  const maxLng = bounds[2];
  const minLat = bounds[1];
  const maxLat = bounds[3];

  const droneSubRegions = [];
  let currentMinLng = minLng;

  for (let i = 0; i < droneCount - 1; i++) {
    let lowLng = currentMinLng;
    let highLng = maxLng;
    let bestCutLng = -1;
    let minAreaDiff = Infinity;

    for (let j = 0; j < 50; j++) {
      // Binary search for longitude
      const midLng = (lowLng + highLng) / 2;
      const rectangle = turf.polygon([
        [
          [currentMinLng, minLat],
          [midLng, minLat],
          [midLng, maxLat],
          [currentMinLng, maxLat],
          [currentMinLng, minLat],
        ],
      ]);
      const intersection = turf.intersect(
        turf.featureCollection([turfPolygon, rectangle])
      );
      if (intersection) {
        const area = turf.area(intersection);
        const diff = Math.abs(area - targetArea);
        if (diff < minAreaDiff) {
          minAreaDiff = diff;
          bestCutLng = midLng;
        }
        if (area < targetArea) {
          lowLng = midLng;
        } else {
          highLng = midLng;
        }
      } else {
        highLng = midLng;
      }
    }

    const cutLng =
      bestCutLng !== -1
        ? bestCutLng
        : currentMinLng + ((maxLng - minLng) / droneCount) * (i + 1);
    const cutRectangle = turf.polygon([
      [
        [currentMinLng, minLat],
        [cutLng, minLat],
        [cutLng, maxLat],
        [currentMinLng, maxLat],
        [currentMinLng, minLat],
      ],
    ]);
    const intersection = turf.intersect(
      turf.featureCollection([turfPolygon, cutRectangle])
    );
    if (intersection && intersection.geometry.coordinates.length > 0) {
      droneSubRegions.push(
        intersection.geometry.coordinates[0].map(
          (coord) =>
            new AMapRef.current!.LngLat(Number(coord[0]), Number(coord[1]))
        )
      );
    }
    currentMinLng = cutLng;
  }

  const lastRectangle = turf.polygon([
    [
      [currentMinLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [currentMinLng, maxLat],
      [currentMinLng, minLat],
    ],
  ]);
  const lastIntersection = turf.intersect(
    turf.featureCollection([turfPolygon, lastRectangle])
  );
  // const lastIntersection = intersect(turfPolygon, lastRectangle);
  // // const lastIntersection = turf.intersect(turfPolygon, lastRectangle);
  if (lastIntersection && lastIntersection.geometry.coordinates.length > 0) {
    droneSubRegions.push(
      lastIntersection.geometry.coordinates[0].map(
        (coord) =>
          new AMapRef.current!.LngLat(Number(coord[0]), Number(coord[1]))
      )
    );
  }

  return droneSubRegions;
}

interface WaylinePanelProps {
  selectedDrones: JobDetailResult["drones"];
  waylineAreas: {
    droneKey: string;
    color: string;
    path: AMap.LngLat[];
  }[];
  setWaylineAreas: React.Dispatch<
    React.SetStateAction<
      {
        droneKey: string;
        color: string;
        path: AMap.LngLat[];
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
  const [collapsed, setCollapsed] = useState<boolean>(false);
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
            setCollapsed(!collapsed);
          }}
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
                    droneKey: selectedDrones[i].key,
                    name: selectedDrones[i].name,
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
              <div key={e.droneKey}>
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <p>
                      {selectedDrones.find((dr) => dr.key === e.droneKey)?.name}
                    </p>
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
                          // prev.filter((dr) => dr.droneId !== e.droneId)
                          prev.filter((dr) => dr.droneKey !== e.droneKey)
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
