// 区域项目结果接口
export interface AreaItemResult {
  id: number; // 区域ID
  name: string; // 区域名称
  description?: string; // 区域描述
  center_lat: number; // 中心点纬度
  center_lng: number; // 中心点经度
  points: PointResult[]; // 区域边界点
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 坐标点结果接口
export interface PointResult {
  lat: number; // 纬度
  lng: number; // 经度
}

// 区域搜索参数接口
export interface AreaSearchParams {
  name?: string; // 区域名称
  createAtBegin?: string; // 创建时间开始
  createAtEnd?: string; // 创建时间结束
}
