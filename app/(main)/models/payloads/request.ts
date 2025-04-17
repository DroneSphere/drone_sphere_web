import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { PayloadItemResult } from "./type";

// 获取负载型号列表
export async function getPayloads(): Promise<PayloadItemResult[]> {
  const res = await httpClient.instance.get<Response<PayloadItemResult[]>>(
    "/models/payloads"
  );
  console.log(res.data);
  return res.data.data;
}

// Mock: 根据ID获取负载型号详情
export async function getPayloadById(id: number): Promise<PayloadItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`获取负载型号详情: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回mock数据
  return {
    id: id,
    name: `负载型号-${id}`,
    category: `类别-${id % 3 + 1}`,
    description: `这是ID为${id}的负载型号描述，提供了相关的功能和特性。`
  };
}

// Mock: 更新负载型号信息
export async function updatePayload(id: number, data: Partial<PayloadItemResult>): Promise<PayloadItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`更新负载型号: ID=${id}`, data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回更新后的mock数据
  return {
    id: id,
    name: data.name || `负载型号-${id}`,
    category: data.category || `类别-${id % 3 + 1}`,
    description: data.description || `这是ID为${id}的负载型号描述，提供了相关的功能和特性。`
  };
}

// Mock: 删除负载型号
export async function deletePayload(id: number): Promise<boolean> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log(`删除负载型号: ID=${id}`);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟删除成功
  return true;
}

// Mock: 添加负载型号
export async function addPayload(data: {
  name: string;
  category: string;
  description?: string;
}): Promise<PayloadItemResult> {
  // 这里使用mock数据，实际项目中应该调用API
  console.log('添加负载型号:', data);
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成随机ID
  const id = Math.floor(Math.random() * 1000) + 100;
  
  // 返回mock数据
  return {
    id: id,
    name: data.name,
    category: data.category,
    description: data.description || `这是负载型号${data.name}的描述，提供了相关的功能和特性。`
  };
}
