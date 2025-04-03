import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { JobItemResult, JobSearchParams } from "./types";

// API路径前缀
const prefix = "/job";

/**
 * 获取所有任务列表
 * @param params 任务搜索参数，可为空
 * @returns 任务列表数据
 */
export async function fetchAllJobs(
  params: JobSearchParams | null = null
): Promise<JobItemResult[]> {
  console.log("fetchAllJobs", params);

  const res = await httpClient.instance.get<Response<JobItemResult[]>>(
    `${prefix}`, {
      params: params
    }
  );
  return res.data.data;
}
