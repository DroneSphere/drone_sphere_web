import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import {
    AreaQueryParam,
    AreaResult,
    CreateAreaRequest,
    UpdateRequest,
} from "./types";

const prefix = "/areas";

/**
 * 创建新区域
 * @param payload 创建区域请求数据
 * @returns 创建的区域
 */
export async function createArea(
  payload: CreateAreaRequest
): Promise<AreaResult> {
  const res = await httpClient.instance.post<Response<AreaResult>>(
    `${prefix}`,
    payload
  );
  return res.data.data;
}

/**
 * 更新区域
 * @param id 区域ID
 * @param payload 更新区域请求数据
 * @returns 更新后的区域
 */
export async function updateArea(payload: UpdateRequest): Promise<AreaResult> {
  const res = await httpClient.instance.put<Response<AreaResult>>(
    `${prefix}/${payload.id}`,
    payload
  );
  return res.data.data;
}

/**
 * 获取单个区域
 * @param query 区域查询参数
 * @returns 区域数据
 */
export async function fetchArea(query: AreaQueryParam): Promise<AreaResult> {
  const res = await httpClient.instance.get<Response<AreaResult>>(`${prefix}`, {
    params: query,
  });
  return res.data.data;
}

/**
 * 删除区域
 * @param id 区域ID
 * @returns 是否删除成功
 */
export async function deleteArea(id: string): Promise<boolean> {
    const res = await httpClient.instance.delete<Response<boolean>>(`${prefix}/${id}`);
    return res.data.data;
}
