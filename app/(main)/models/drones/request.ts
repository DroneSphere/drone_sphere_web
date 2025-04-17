import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { DroneModelCreateUpdateParams, DroneModelItemResult } from "./type";

/**
 * 获取所有无人机型号列表
 * @param name 可选的名称过滤参数
 * @returns 无人机型号列表
 */
export async function getAllModels(name?: string): Promise<DroneModelItemResult[]> {
  const params = name ? { name } : undefined;
  const res = await httpClient.instance.get<Response<DroneModelItemResult[]>>(
    "/models/drones",
    { params }
  );

  return res.data.data;
}

/**
 * 根据ID获取无人机型号详情
 * @param id 无人机型号ID
 * @returns 无人机型号详情
 */
export async function getModelById(id: number): Promise<DroneModelItemResult> {
  const res = await httpClient.instance.get<Response<DroneModelItemResult>>(
    `/models/drone/${id}`
  );
  
  return res.data.data;
}

/**
 * 更新无人机型号信息
 * @param id 无人机型号ID
 * @param data 更新的数据
 * @returns 操作结果
 */
export async function updateModel(id: number, data: DroneModelCreateUpdateParams): Promise<Response<object>> {
  const res = await httpClient.instance.put<Response<object>>(
    `/models/drone/${id}`,
    data
  );
  
  return res.data;
}

/**
 * 删除无人机型号
 * @param id 无人机型号ID
 * @returns 操作结果
 */
export async function deleteModel(id: number): Promise<Response<DroneModelItemResult[]>> {
  const res = await httpClient.instance.delete<Response<DroneModelItemResult[]>>(
    `/models/drone/${id}`
  );
  
  return res.data;
}

/**
 * 添加无人机型号
 * @param data 无人机型号数据
 * @returns 操作结果
 */
export async function addModel(data: DroneModelCreateUpdateParams): Promise<Response<object>> {
  const res = await httpClient.instance.post<Response<object>>(
    `/models/drone`,
    data
  );
  
  return res.data;
}
