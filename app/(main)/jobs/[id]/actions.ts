import * as turf from "@turf/turf";
import { MutableRefObject } from "react";
import { JobDetailResult } from "../report/[id]/types";


export function dividePolygonAmongDrones(
  path: AMap.LngLat[],
  selectedDrones: JobDetailResult["drones"],
  AMapRef: MutableRefObject<typeof AMap | null>) {
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
    if (firstCoordinate[0] !== lastCoordinate[0] ||
      firstCoordinate[1] !== lastCoordinate[1]) {
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

    const cutLng = bestCutLng !== -1
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
          (coord) => new AMapRef.current!.LngLat(Number(coord[0]), Number(coord[1]))
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
        (coord) => new AMapRef.current!.LngLat(Number(coord[0]), Number(coord[1]))
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
export function generateWaypoints(
  path: AMap.LngLat[],
  droneParams: {
    flyingHeight: number; // 飞行高度（米）
    coverageWidth: number; // 在指定高度下的地面覆盖宽度（米）
    overlapRate: number; // 旁向重叠率（0-1之间）
    gimbalPitch: number; // 云台俯仰角度（-90为垂直向下，0为水平）
    gimbalZoom: number; // 云台放大倍数
  },
  AMapRef: MutableRefObject<typeof AMap | null>): AMap.LngLat[] {
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
  const effectiveFOV = standardFOV / droneParams.gimbalZoom; // 考虑变焦后的视场角
  
  // 计算俯仰角的影响（垂直向下时覆盖最窄，水平时无限宽）
  // 从-90度（垂直向下）到0度（水平）映射到1到无穷大的因子
  const pitchRadians = Math.abs(droneParams.gimbalPitch) * (Math.PI / 180);
  const pitchFactor = 1 / Math.sin(pitchRadians);
  
  // 计算地面覆盖宽度
  const fovRadians = effectiveFOV * (Math.PI / 180);
  const coverageWidth = 2 * droneParams.flyingHeight * Math.tan(fovRadians / 2) * pitchFactor;
  
  // 使用计算得到的覆盖宽度或参数中提供的值（以较小者为准，确保安全覆盖）
  const actualCoverageWidth = Math.min(coverageWidth, droneParams.coverageWidth);
  console.log("理论覆盖宽度", actualCoverageWidth);
  
  // 考虑重叠率计算有效宽度
  const effectiveWidth = actualCoverageWidth * (1 - droneParams.overlapRate);

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
