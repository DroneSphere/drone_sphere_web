import { PointResult } from "../types";

// 区域结果接口
export interface AreaResult {
  id?: number; // 区域ID
  name?: string; // 区域名称
  description?: string; // 区域描述
  center_lat?: number; // 中心点纬度
  center_lng?: number; // 中心点经度
  points?: PointResult[]; // 区域边界点
  created_at?: string; // 创建时间
  updated_at?: string; // 更新时间
}

// 创建区域请求接口
export interface CreateAreaRequest {
  name?: string; // 区域名称
  description?: string; // 区域描述
  points?: PointResult[]; // 区域边界点
}

// 更新区域请求接口
export interface UpdateRequest {
  id: number; // 区域ID
  name?: string; // 区域名称
  description?: string; // 区域描述
  points?: PointResult[]; // 区域边界点
}

// 区域查询参数接口
export interface AreaQueryParam {
  id?: number; // 区域ID
  name?: string; // 区域名称
}
