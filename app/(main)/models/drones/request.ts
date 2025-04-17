import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { DroneModelItemResult } from "./type";

// 获取所有无人机型号列表
export async function getAllModels(): Promise<DroneModelItemResult[]> {
  const res = await httpClient.instance.get<Response<DroneModelItemResult[]>>(
    "/models/drones"
  );

  return res.data.data;
}

// Mock: 根据ID获取无人机型号详情
export async function getModelById(id: number): Promise<DroneModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`获取无人机型号详情: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回mock数据
  return {
    id: id,
    name: `无人机型号-${id}`,
    description: `这是ID为${id}的无人机型号描述`,
    domain: 1,
    type: 2,
    sub_type: 3,
    gateway_name: "示例网关",
    gateway_id: 100,
    gateway_description: "示例网关描述",
    gimbals: [
      { id: 1, name: "云台A", description: "高精度云台" },
      { id: 2, name: "云台B", description: "高稳定性云台" }
    ]
  };
}

// Mock: 更新无人机型号信息
export async function updateModel(id: number, data: Partial<DroneModelItemResult>): Promise<DroneModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`更新无人机型号: ID=${id}`, data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回更新后的mock数据
  return {
    id: id,
    name: data.name || `无人机型号-${id}`,
    description: data.description || `这是ID为${id}的无人机型号描述`,
    domain: data.domain || 1,
    type: data.type || 2,
    sub_type: data.sub_type || 3,
    gateway_name: data.gateway_name || "示例网关",
    gateway_id: 100,
    gateway_description: "示例网关描述",
    gimbals: [
      { id: 1, name: "云台A", description: "高精度云台" },
      { id: 2, name: "云台B", description: "高稳定性云台" }
    ]
  };
}

// Mock: 删除无人机型号
export async function deleteModel(id: number): Promise<boolean> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`删除无人机型号: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟删除成功
  return true;
}

// Mock: 添加无人机型号
export async function addModel(data: {
  name: string;
  description?: string;
  domain?: number;
  type?: number;
  sub_type?: number;
  gateway_id: number;
}): Promise<DroneModelItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log('添加无人机型号:', data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成随机ID
  const id = Math.floor(Math.random() * 1000) + 100;
  
  // 返回mock数据
  return {
    id: id,
    name: data.name,
    description: data.description || `这是无人机型号${data.name}的描述`,
    domain: data.domain || 1,
    type: data.type || 2,
    sub_type: data.sub_type || 3,
    gateway_name: "默认网关", // 这里应该通过gateway_id获取真实的网关名称
    gateway_id: data.gateway_id,
    gateway_description: "默认网关描述",
    gimbals: [] // 默认为空，实际应用中可能需要单独的API来关联云台
  };
}
