import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { ResultItem, ResultQuery, ResultDetail, ObjectTypeOption } from "./types";

interface ResultResponse {
  items: ResultItem[];
  total: number;
}

/**
 * 获取检测结果列表
 * @param params 查询参数
 */
export async function fetchResults(params?: ResultQuery): Promise<ResultResponse> {
  const res = await httpClient.instance.get<Response<ResultResponse>>('results', {
    params,
  });
  console.log("获取检测结果列表", res.data);
  
  return res.data.data;
}

/**
 * 获取单个检测结果详情
 * @param id 检测结果ID
 */
export async function fetchResultById(id: number): Promise<ResultDetail> {
  const res = await httpClient.instance.get<Response<ResultDetail>>(`results/${id}`);
  return res.data.data;
}

/**
 * 获取目标类型选项列表
 */
export async function fetchObjectTypeOptions(): Promise<ObjectTypeOption[]> {
  const res = await httpClient.instance.get<Response<ObjectTypeOption[]>>('results/object_options');
  return res.data.data;
}

/**
 * 删除检测结果
 * @param id 检测结果ID
 * @returns 成功删除返回true
 */
export async function deleteResult(id: number): Promise<boolean> {
  // 模拟API调用
  const res = await httpClient.instance.delete<Response<boolean>>(`results/${id}`);
  console.log("删除检测结果", res.data);
  return res.data.data;
}

/**
 * 创建检测结果
 * @param data 检测结果数据
 * @returns 创建成功返回结果ID
 */
export async function createResult(data: {
  job_id: number;
  wayline_id: number;
  drone_id: number;
  object_type_id: number;
  object_confidence: number;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  coordinate: {
    lng: number;
    lat: number;
  };
}): Promise<number> {
  const res = await httpClient.instance.post<Response<number>>('results', data);
  console.log("创建检测结果", res.data);
  return res.data.data;
}