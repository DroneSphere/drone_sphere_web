import * as turf from "@turf/turf";
import { MutableRefObject } from "react";
import { DroneStateV2 } from "./job-state";

export function dividePolygonAmongDrones(
  path: AMap.LngLat[],
  drones: DroneStateV2[],
  AMapRef: MutableRefObject<typeof AMap | null>
) {
  const droneCount = drones.length;
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
 * @param waylineParams 无人机参数
 * @param AMapRef AMap引用
 * @param takeoffPoint 无人机起飞点，用于优化航点顺序
 * @returns 航点数组
 */
export function generateWaypoints(
  path: AMap.LngLat[],
  waylineParams: {
    flyingHeight: number; // 飞行高度（米）
    coverageWidth: number; // 在指定高度下的地面覆盖宽度（米）
    overlapRate: number; // 旁向重叠率（0-1之间）
    gimbalPitch: number; // 云台俯仰角度（-90为垂直向下，0为水平）
    gimbalZoom: number; // 云台放大倍数
  },
  AMapRef: MutableRefObject<typeof AMap | null>,
  takeoffPoint?: { lat: number; lng: number; altitude?: number }
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
  // 计算地面覆盖宽度（基于飞行高度、俯仰角和放大倍数）
  // 假设标准视场角FOV为35度，受到俯仰角和变焦的影响
  const standardFOV = 35; // 标准视场角（度）
  const effectiveFOV = standardFOV / waylineParams.gimbalZoom; // 考虑变焦后的视场角

  // 计算俯仰角的影响（垂直向下时覆盖最窄，水平时无限宽）
  // 从-90度（垂直向下）到0度（水平）映射到1到无穷大的因子
  const pitchRadians = Math.abs(waylineParams.gimbalPitch) * (Math.PI / 180);
  const pitchFactor = 1 / Math.sin(pitchRadians);

  // 计算地面覆盖宽度
  const fovRadians = effectiveFOV * (Math.PI / 180);
  const coverageWidth =
    2 * waylineParams.flyingHeight * Math.tan(fovRadians / 2) * pitchFactor;

  // 使用计算得到的覆盖宽度或参数中提供的值（以较小者为准，确保安全覆盖）
  const actualCoverageWidth = Math.min(
    coverageWidth,
    waylineParams.coverageWidth
  );
  console.log("理论覆盖宽度", actualCoverageWidth);

  // 考虑重叠率计算有效宽度
  const effectiveWidth = actualCoverageWidth * (1 - waylineParams.overlapRate);

  // 使用经纬度转换为米的简单计算（这只是一个近似值）
  // 在不同纬度，经度1度代表的距离不同
  const midLat = (minLat + maxLat) / 2;
  const metersPerLngDegree = AMapRef.current.GeometryUtil.distance(
    new AMapRef.current.LngLat(0, midLat),
    new AMapRef.current.LngLat(1, midLat)
  );

  // 计算在当前纬度下需要间隔多少经度以达到所需的米数
  const lngSpacing = effectiveWidth / metersPerLngDegree;

  
  const waypoints: AMap.LngLat[] = [];
  let scanDirection = true; // true为从南到北，false为从北到南
  let currentWaypointLng = minLng + lngSpacing / 2;

  for (; currentWaypointLng <= maxLng; currentWaypointLng += lngSpacing) {
    const line = turf.lineString([
      [currentWaypointLng, minLat - 1],
      [currentWaypointLng, maxLat + 1],
    ]);

    const intersection = turf.lineIntersect(polygon, line);
    const points = intersection.features.map(
      (f) => f.geometry.coordinates as [number, number]
    );
    points.sort((a, b) => a[1] - b[1]); // 按纬度升序排序（从南到北）

    if (points.length < 2) continue; // 至少需要两个交点形成一条线段

    // 根据扫描方向确定当前扫描线的实际起点和终点
    // 注意：这里的 "points" 是按纬度升序排列的。
    // "lineWaypoints" 在原代码中是根据 scanDirection 排序的。
    // 我们现在直接取 points 的头和尾，然后根据 scanDirection 决定哪个是入口哪个是出口。
    let currentScanLineEntryCoord: [number, number];
    let currentScanLineExitCoord: [number, number];

    if (scanDirection) { // 从南到北扫描
      currentScanLineEntryCoord = points[0]; // 最南边的交点是入口
      currentScanLineExitCoord = points[points.length - 1]; // 最北边的交点是出口
    } else { // 从北到南扫描
      currentScanLineEntryCoord = points[points.length - 1]; // 最北边的交点是入口
      currentScanLineExitCoord = points[0]; // 最南边的交点是出口
    }

    const entryPoint = new AMapRef.current.LngLat(currentScanLineEntryCoord[0], currentScanLineEntryCoord[1]);
    const exitPoint = new AMapRef.current.LngLat(currentScanLineExitCoord[0], currentScanLineExitCoord[1]);

    if (waypoints.length === 0) {
      // 第一个扫描带，添加其入口点
      waypoints.push(entryPoint);
    } else {
      // 非第一个扫描带，获取上一个扫描带的出口点
      const previousExitPoint = waypoints[waypoints.length - 1];
      // 添加连接点：上一个出口点 (如果不同) 和 当前入口点
      // 通常，割草机模式下，上一个出口点和当前入口点是不同的，它们构成了拐弯
      if (!previousExitPoint.equals(entryPoint)) {
        // 如果上一个航点不是当前入口点，则将当前入口点加入，形成拐弯的第二个点
        // （上一个出口点已经是航点列表的最后一个元素了）
         waypoints.push(entryPoint);
      }
    }
    // 添加当前扫描带的出口点
    // 确保不与刚添加的入口点重复（如果扫描线只有一个有效点，或者入口出口很近）
    const lastAddedPoint = waypoints[waypoints.length - 1];
    if (!lastAddedPoint.equals(exitPoint)) {
        waypoints.push(exitPoint);
    }

    scanDirection = !scanDirection; // 切换扫描方向
  }

  if (takeoffPoint && waypoints.length > 1) {
    return optimizeWaypointsWithTakeoff(waypoints, takeoffPoint, AMapRef);
  }

  return waypoints;
}

/**
 * 原始航线 - 保持航点顺序不变
 */
function originalWaypoints(waypoints: AMap.LngLat[]): AMap.LngLat[] {
  return [...waypoints];
}

/**
 * 整体反转航线 - 将所有航点顺序颠倒
 */
function reverseWaypoints(waypoints: AMap.LngLat[]): AMap.LngLat[] {
  return [...waypoints].reverse();
}

/**
 * 交换相邻航点
 * 例如：A->B->C->D->E->F 变为 B->A->D->C->F->E
 */
function swapNeighborWaypoints(waypoints: AMap.LngLat[]): AMap.LngLat[] {
  if (waypoints.length < 2) return [...waypoints];
  
  const result: AMap.LngLat[] = [];
  
  // 两两一组反转航点
  for (let i = 0; i < waypoints.length; i += 2) {
    if (i + 1 < waypoints.length) {
      // 如果有配对的点，则交换顺序添加（先第二个点，再第一个点）
      result.push(waypoints[i + 1], waypoints[i]);
    } else {
      // 如果是单独的最后一个点（奇数长度的情况），直接添加
      result.push(waypoints[i]);
    }
  }
  return result;
}

/**
 * 整体反转后交换相邻两个
 * 例如：对于 A->B->C->D->E->F 变为 E->F->C->D->A->B
 */
function reverseSwapNeighborWaypoints(waypoints: AMap.LngLat[]): AMap.LngLat[] {
  if (waypoints.length < 2) return [...waypoints];
  
  const result: AMap.LngLat[] = [];
  
  // 整体反转
  const reversedWaypoints = [...waypoints].reverse();

  // 两两一组反转航点
  for (let i = 0; i < reversedWaypoints.length; i += 2) {
    if (i + 1 < reversedWaypoints.length) {
      // 如果有配对的点，则交换顺序添加（先第二个点，再第一个点）
      result.push(reversedWaypoints[i + 1], reversedWaypoints[i]);
    } else {
      // 如果是单独的最后一个点（奇数长度的情况），直接添加
      result.push(reversedWaypoints[i]);
    }
  }
  return result;
}

/**
 * 根据起飞点优化航线顺序
 * @param waypoints 原始航线航点
 * @param takeoffPoint 起飞点
 * @param AMapRef AMap引用
 * @returns 优化后的航线
 */
function optimizeWaypointsWithTakeoff(
  waypoints: AMap.LngLat[],
  takeoffPoint: { lat: number; lng: number; altitude?: number },
  AMapRef: MutableRefObject<typeof AMap | null>
): AMap.LngLat[] {
  if (!AMapRef.current || waypoints.length <= 1) return waypoints;

  // 创建起飞点对象
  const droneStartPoint = new AMapRef.current.LngLat(takeoffPoint.lng, takeoffPoint.lat);

  // 生成四种不同顺序的航线
  const waypointVariants = [
    { name: "原始航线", waypoints: originalWaypoints(waypoints) },
    { name: "整体反转航线", waypoints: reverseWaypoints(waypoints) },
    { name: "交换相邻航点", waypoints: swapNeighborWaypoints(waypoints) },
    { name: "整体反转后交换相邻航点", waypoints: reverseSwapNeighborWaypoints(waypoints) },
  ];

  // 计算每种方案的第一个航点到起飞点的距离
  let bestVariant = waypointVariants[0];
  let shortestDistance = AMapRef.current.GeometryUtil.distance(
    droneStartPoint, 
    bestVariant.waypoints[0]
  );

  for (let i = 1; i < waypointVariants.length; i++) {
    const variant = waypointVariants[i];
    const distance = AMapRef.current.GeometryUtil.distance(
      droneStartPoint,
      variant.waypoints[0]
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      bestVariant = variant;
    }
  }

  console.log(`选择航线类型: ${bestVariant.name}, 起飞点到第一个航点距离: ${shortestDistance}米`);
  return bestVariant.waypoints;
}
