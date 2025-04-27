// 计算多边形面积的函数（单位：平方米）
export function calculatePolygonArea(points: { lng: number; lat: number }[]): number {
  if (!points || points.length < 3) return 0;

  // 使用Shoelace公式计算多边形面积
  const earthRadius = 6371000; // 地球半径，单位米
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;

    // 将经纬度转换为弧度
    const lat1 = (points[i].lat * Math.PI) / 180;
    const lat2 = (points[j].lat * Math.PI) / 180;
    const lng1 = (points[i].lng * Math.PI) / 180;
    const lng2 = (points[j].lng * Math.PI) / 180;

    // 计算面积
    area += (lng2 - lng1) * Math.sin((lat1 + lat2) / 2);
  }

  // 取绝对值并转换为平方米
  area = Math.abs((area * earthRadius * earthRadius) / 2);
  return area;
}

// 格式化日期时间的函数
export function formatDateTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// 计算两个WGS84坐标点之间的距离（单位：米）
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  // 使用Haversine公式计算球面距离
  const R = 6371000; // 地球半径，单位为米
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// 计算航线的总长度（单位：米）
export function calculateWaylineLength(points: {lat: number; lng: number}[]): number {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(
      points[i].lat, 
      points[i].lng, 
      points[i + 1].lat, 
      points[i + 1].lng
    );
  }
  
  return totalDistance;
}
