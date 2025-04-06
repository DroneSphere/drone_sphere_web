import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { ResultItem, ResultQuery, ResultDetail } from "./types";

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