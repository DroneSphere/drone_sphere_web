import { JobDetailResult } from "@/app/(main)/jobs/[id]/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as turf from "@turf/turf";
import { Eye, EyeOff } from "lucide-react";
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

/**
 * 为每个区域生成航点路径
 * 实现类似割草机模式的飞行路径
 * @param path 区域边界点
 * @param droneParams 无人机参数
 * @param AMapRef AMap引用
 * @returns 航点数组
 */
function generateWaypoints(
  path: AMap.LngLat[],
  droneParams: {
    flyingHeight: number; // 飞行高度（米）
    coverageWidth: number; // 在指定高度下的地面覆盖宽度（米）
    overlapRate: number; // 旁向重叠率（0-1之间）
    gimbalPitch: number; // 云台俯仰角度（-90为垂直向下，0为水平）
    gimbalZoom: number; // 云台放大倍数
  },
  AMapRef: MutableRefObject<typeof AMap | null>
): AMap.LngLat[] {
  if (path.length < 3 || !AMapRef.current) return [];

  // 转换为turf多边形
  const coordinates = path.map((p) => [p.getLng(), p.getLat()]);
  // 确保多边形是闭合的
  const firstCoord = coordinates[0];
  const lastCoord = coordinates[coordinates.length - 1];
  if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
    coordinates.push(firstCoord);
  }

  const polygon = turf.polygon([coordinates]);

  // 获取多边形的边界盒
  const bbox = turf.bbox(polygon);
  const minLng = bbox[0];
  const minLat = bbox[1];
  const maxLng = bbox[2];
  const maxLat = bbox[3];

  // 计算航线间距（考虑覆盖宽度和重叠率）
  const effectiveWidth =
    droneParams.coverageWidth * (1 - droneParams.overlapRate);

  // 使用经纬度转换为米的简单计算（这只是一个近似值）
  // 在不同纬度，经度1度代表的距离不同
  const midLat = (minLat + maxLat) / 2;
  const metersPerLngDegree = AMapRef.current.GeometryUtil.distance(
    new AMapRef.current.LngLat(0, midLat),
    new AMapRef.current.LngLat(1, midLat)
  );

  // 计算在当前纬度下需要间隔多少经度以达到所需的米数
  const lngSpacing = effectiveWidth / metersPerLngDegree;

  // 确定扫描方向（这里选择东西方向）
  const waypoints: AMap.LngLat[] = [];
  let scanDirection = true; // true为从南到北，false为从北到南

  // 从西向东，在整个区域创建平行线
  for (let lng = minLng; lng <= maxLng; lng += lngSpacing) {
    // 创建当前经线
    const line = turf.lineString([
      [lng, scanDirection ? minLat : maxLat],
      [lng, scanDirection ? maxLat : minLat],
    ]);

    // 计算当前线与多边形的交点
    const intersection = turf.lineIntersect(polygon, line);

    // 排序交点（从南到北或从北到南）
    const points = intersection.features.map((f) => f.geometry.coordinates);
    points.sort((a, b) => {
      return scanDirection
        ? a[1] - b[1] // 从南到北
        : b[1] - a[1]; // 从北到南
    });

    // 如果有交点，添加到航点
    if (points.length >= 2) {
      // 每对交点创建一条路径段
      for (let i = 0; i < points.length; i += 2) {
        if (i + 1 < points.length) {
          waypoints.push(
            new AMapRef.current.LngLat(points[i][0], points[i][1])
          );
          waypoints.push(
            new AMapRef.current.LngLat(points[i + 1][0], points[i + 1][1])
          );
        }
      }
    }

    // 切换扫描方向
    scanDirection = !scanDirection;
  }

  // 注意: 云台参数 (gimbalPitch 和 gimbalZoom) 应该被传递到实际的飞行控制系统
  // 在这里我们仅返回航点坐标，但在实际应用中这些参数会与航点一起使用
  return waypoints;
}

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
                <label className="text-xs text-gray-500">重叠率(%)</label>
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
