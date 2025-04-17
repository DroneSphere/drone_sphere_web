import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GatewayModelItemResult } from "./type";

// 获取所有网关型号列表
export async function getGatewayModels(): Promise<GatewayModelItemResult[]> {
  const res = await httpClient.instance.get<Response<GatewayModelItemResult[]>>(
    "/models/gateways"
  );
  console.log(res.data);
  return res.data.data;
}

// Mock: 根据ID获取网关型号详情
export async function getGatewayById(id: number): Promise<GatewayModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`获取网关型号详情: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回mock数据
  return {
    gateway_model_id: id,
    gateway_model_name: `网关型号-${id}`,
    gateway_model_description: `这是ID为${id}的网关型号描述`,
    gateway_model_domain: 1,
    gateway_model_type: 2,
    gateway_model_sub_type: 3,
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString(),
    state: 1
  };
}

// Mock: 更新网关型号信息
export async function updateGateway(id: number, data: Partial<GatewayModelItemResult>): Promise<GatewayModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`更新网关型号: ID=${id}`, data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回更新后的mock数据
  return {
    gateway_model_id: id,
    gateway_model_name: data.gateway_model_name || `网关型号-${id}`,
    gateway_model_description: data.gateway_model_description || `这是ID为${id}的网关型号描述`,
    gateway_model_domain: data.gateway_model_domain || 1,
    gateway_model_type: data.gateway_model_type || 2,
    gateway_model_sub_type: data.gateway_model_sub_type || 3,
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString(),
    state: 1
  };
}

// Mock: 删除网关型号
export async function deleteGateway(id: number): Promise<boolean> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`删除网关型号: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟删除成功
  return true;
}

// Mock: 添加网关型号
export async function addGatewayModel(data: {
  gateway_model_name: string;
  gateway_model_description?: string;
  gateway_model_domain?: number;
  gateway_model_type?: number;
  gateway_model_sub_type?: number;
}): Promise<GatewayModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log('添加网关型号:', data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成随机ID
  const id = Math.floor(Math.random() * 1000) + 100;
  
  // 返回mock数据
  return {
    gateway_model_id: id,
    gateway_model_name: data.gateway_model_name,
    gateway_model_description: data.gateway_model_description || `这是网关型号${data.gateway_model_name}的描述`,
    gateway_model_domain: data.gateway_model_domain || 1,
    gateway_model_type: data.gateway_model_type || 2,
    gateway_model_sub_type: data.gateway_model_sub_type || 3,
    created_time: new Date().toISOString(),
    updated_time: new Date().toISOString(),
    state: 1
  };
}
