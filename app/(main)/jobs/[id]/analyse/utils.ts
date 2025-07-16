import { GroundTruthItem, SearchResultItem, MatchResult, ErrorStatistics } from './types';

/**
 * 计算两个坐标点之间的距离（使用Haversine公式）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 距离（米）
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // 验证输入参数
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    console.error('距离计算参数类型错误:', { lat1, lng1, lat2, lng2 });
    return Infinity;
  }
  
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    console.error('距离计算参数包含NaN:', { lat1, lng1, lat2, lng2 });
    return Infinity;
  }
  
  // 如果坐标完全相同，直接返回0
  if (lat1 === lat2 && lng1 === lng2) {
    return 0;
  }
  
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * 匹配真值和检测结果
 * @param groundTruths 真值列表
 * @param detections 检测结果列表
 * @param maxDistance 最大匹配距离（米）
 * @returns 匹配结果列表
 */
export function matchGroundTruthsWithDetections(
  groundTruths: GroundTruthItem[],
  detections: SearchResultItem[],
  maxDistance: number = 50 // 默认最大距离50米
): MatchResult[] {
  console.log('=== 开始匹配算法 ===');
  console.log('真值数量:', groundTruths.length);
  console.log('检测结果数量:', detections.length);
  console.log('最大匹配距离:', maxDistance);
  
  const matchResults: MatchResult[] = [];
  const usedDetections = new Set<number>();
  const usedGroundTruths = new Set<string>();

  // 存储所有可能的匹配对及其距离
  const allMatches: {
    groundTruth: GroundTruthItem;
    detection: SearchResultItem;
    distance: number;
  }[] = [];

  // 计算所有真值与检测结果的距离
  for (const groundTruth of groundTruths) {
    console.log(`\n处理真值: ${groundTruth.target_label} (${groundTruth.lng}, ${groundTruth.lat})`);
    
    // 首先按目标类型过滤
    const sameTypeDetections = detections.filter(
      detection => detection.target_label === groundTruth.target_label
    );
    
    console.log(`同类型检测结果数量: ${sameTypeDetections.length}`);

    // 计算与每个同类型检测结果的距离
    for (const detection of sameTypeDetections) {
      const detectionLng = parseFloat(detection.lng);
      const detectionLat = parseFloat(detection.lat);
      
      // 检查坐标是否有效
      if (isNaN(detectionLng) || isNaN(detectionLat)) {
        console.warn(`检测结果 ${detection.id} 的坐标无效: lng=${detection.lng}, lat=${detection.lat}`);
        continue;
      }
      
      const distance = calculateDistance(
        groundTruth.lat,
        groundTruth.lng,
        detectionLat,
        detectionLng
      );
      
      console.log(`  -> 检测结果 ${detection.id}: ${detection.target_label} (${detection.lng}, ${detection.lat}), 距离: ${distance.toFixed(2)}m`);

      if (distance <= maxDistance) {
        allMatches.push({
          groundTruth,
          detection,
          distance
        });
        console.log(`    ✓ 在距离范围内，加入候选匹配`);
      } else {
        console.log(`    ✗ 超出距离范围 (>${maxDistance}m)`);
      }
    }
  }

  console.log(`\n总共找到 ${allMatches.length} 个候选匹配`);

  // 按距离排序，优先匹配距离最近的
  allMatches.sort((a, b) => a.distance - b.distance);
  
  console.log('\n按距离排序的候选匹配:');
  allMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. 真值ID: ${match.groundTruth.id} -> 检测ID: ${match.detection.id}, 距离: ${match.distance.toFixed(2)}m`);
  });

  // 按距离优先级进行匹配
  const finalMatches = new Map<string, { detection: SearchResultItem; distance: number }>();
  
  for (const match of allMatches) {
    if (!usedGroundTruths.has(match.groundTruth.id) && 
        !usedDetections.has(match.detection.id)) {
      // 标记为已使用
      usedGroundTruths.add(match.groundTruth.id);
      usedDetections.add(match.detection.id);
      
      // 记录最终匹配
      finalMatches.set(match.groundTruth.id, {
        detection: match.detection,
        distance: match.distance
      });
      
      console.log(`  ✓ 匹配成功: 真值ID ${match.groundTruth.id} -> 检测ID ${match.detection.id}, 距离: ${match.distance.toFixed(2)}m`);
    } else {
      console.log(`  ✗ 跳过: 真值ID ${match.groundTruth.id} -> 检测ID ${match.detection.id} (已被使用)`);
    }
  }

  console.log(`\n最终匹配结果: ${finalMatches.size} 个成功匹配`);

  // 为每个真值生成最终的匹配结果
  for (const groundTruth of groundTruths) {
    const matchedPair = finalMatches.get(groundTruth.id);
    
    if (matchedPair) {
      matchResults.push({
        groundTruth,
        detection: matchedPair.detection,
        distance: matchedPair.distance,
        isMatched: true
      });
      console.log(`真值 ${groundTruth.id} 匹配到检测结果 ${matchedPair.detection.id}`);
    } else {
      matchResults.push({
        groundTruth,
        detection: null,
        distance: -1,
        isMatched: false
      });
      console.log(`真值 ${groundTruth.id} 未匹配到任何检测结果`);
    }
  }

  console.log('=== 匹配算法完成 ===\n');
  return matchResults;
}

/**
 * 计算误差统计
 * @param matchResults 匹配结果列表
 * @param totalDetections 总检测结果数量
 * @returns 误差统计
 */
export function calculateErrorStatistics(
  matchResults: MatchResult[],
  totalDetections: number
): ErrorStatistics {
  const matchedResults = matchResults.filter(result => result.isMatched);
  const errors = matchedResults.map(result => result.distance);
  
  const totalGroundTruths = matchResults.length;
  const matchedCount = matchedResults.length;
  const accuracy = totalGroundTruths > 0 ? matchedCount / totalGroundTruths : 0;
  
  let maxError = 0;
  let minError = 0;
  let avgError = 0;
  let stdError = 0;
  let rmsError = 0;
  
  if (errors.length > 0) {
    maxError = Math.max(...errors);
    minError = Math.min(...errors);
    avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    
    // 计算标准差
    const variance = errors.reduce((sum, error) => sum + Math.pow(error - avgError, 2), 0) / errors.length;
    stdError = Math.sqrt(variance);
    
    // 计算均方根误差
    const sumSquares = errors.reduce((sum, error) => sum + Math.pow(error, 2), 0);
    rmsError = Math.sqrt(sumSquares / errors.length);
  }
  
  return {
    accuracy,
    totalGroundTruths,
    totalDetections,
    matchedCount,
    errors,
    maxError,
    minError,
    avgError,
    stdError,
    rmsError
  };
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateUniqueId(): string {
  return `gt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化距离显示
 * @param distance 距离（米）
 * @returns 格式化的距离字符串
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance.toFixed(1)}m`;
  } else {
    return `${(distance / 1000).toFixed(2)}km`;
  }
}

/**
 * 格式化百分比显示
 * @param value 0-1之间的数值
 * @returns 格式化的百分比字符串
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
