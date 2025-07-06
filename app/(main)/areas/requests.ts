import httpClient from "../../../api/http_client";
import { Response } from "../../../api/response";
import { AreaItemResult, AreaSearchParams } from "./types";

// API路径前缀
const prefix = "/areas";

/**
 * 获取所有区域
 * @param params 搜索参数
 * @returns 区域列表
 */
export async function selectAllAreas(
  params: AreaSearchParams | null = null
): Promise<{items: AreaItemResult[],total:number}> {
  const res = await httpClient.instance.get<Response<{items: AreaItemResult[],total:number}>>(
    `${prefix}/list`,
    {
      params,
    }
  );
  return res.data.data;
}
