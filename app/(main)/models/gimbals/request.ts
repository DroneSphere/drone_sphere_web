import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GimbalItemResult } from "./type";

// 获取云台型号列表
export async function getGimbalList(): Promise<GimbalItemResult[]> {
  const res = await httpClient.instance.get<Response<GimbalItemResult[]>>(
    "/models/gimbals"
  );
  console.log(res.data);
  return res.data.data;
}

// Mock: 根据ID获取云台型号详情
export async function getGimbalById(id: number): Promise<GimbalItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`获取云台型号详情: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回mock数据
  return {
    gimbal_model_id: id,
    gimbal_model_name: `云台型号-${id}`,
    gimbal_model_description: `这是ID为${id}的云台型号描述`,
    gimbal_model_product: `产品型号-P${id}`,
    gimbal_model_domain: 1,
    gimbal_model_type: 2,
    gimbal_model_sub_type: 3,
    gimbalindex: 0,
    state: 1,
    is_thermal_available: Math.random() > 0.5, // 随机决定是否支持热成像
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString()
  };
}

// Mock: 更新云台型号信息
export async function updateGimbal(id: number, data: Partial<GimbalItemResult>): Promise<GimbalItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`更新云台型号: ID=${id}`, data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回更新后的mock数据
  return {
    gimbal_model_id: id,
    gimbal_model_name: data.gimbal_model_name || `云台型号-${id}`,
    gimbal_model_description: data.gimbal_model_description || `这是ID为${id}的云台型号描述`,
    gimbal_model_product: data.gimbal_model_product || `产品型号-P${id}`,
    gimbal_model_domain: data.gimbal_model_domain || 1,
    gimbal_model_type: data.gimbal_model_type || 2,
    gimbal_model_sub_type: data.gimbal_model_sub_type || 3,
    gimbalindex: 0,
    state: 1,
    is_thermal_available: true,
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString()
  };
}

// Mock: 删除云台型号
export async function deleteGimbal(id: number): Promise<boolean> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`删除云台型号: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟删除成功
  return true;
}

// Mock: 添加云台型号
export async function addGimbalModel(data: {
  gimbal_model_name: string;
  gimbal_model_description?: string;
  gimbal_model_product: string;
  gimbal_model_domain?: number;
  gimbal_model_type?: number;
  gimbal_model_sub_type?: number;
  is_thermal_available?: boolean;
}): Promise<GimbalItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log('添加云台型号:', data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成随机ID
  const id = Math.floor(Math.random() * 1000) + 100;
  
  // 返回mock数据
  return {
    gimbal_model_id: id,
    gimbal_model_name: data.gimbal_model_name,
    gimbal_model_description: data.gimbal_model_description || `这是云台型号${data.gimbal_model_name}的描述`,
    gimbal_model_product: data.gimbal_model_product,
    gimbal_model_domain: data.gimbal_model_domain || 1,
    gimbal_model_type: data.gimbal_model_type || 2,
    gimbal_model_sub_type: data.gimbal_model_sub_type || 3,
    gimbalindex: 0,
    state: 1,
    is_thermal_available: data.is_thermal_available || false,
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString()
  };
}
