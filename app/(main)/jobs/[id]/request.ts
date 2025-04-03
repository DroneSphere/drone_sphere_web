import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import {
  JobCreationRequest,
  JobCreationResult,
  JobDetailResult,
  JobItemResult,
  JobSearchParams,
  PhysicalDrone,
} from "./type";

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
    `${prefix}`
  );
  return res.data.data;
}

/**
 * 通过ID获取任务详情
 * @param id 任务ID
 * @returns 任务详情数据
 */
export async function getJobDetailById(id: number): Promise<JobDetailResult> {
  const res = await httpClient.instance.get<Response<JobDetailResult>>(
    `${prefix}/${id}`
  );  
  return res.data.data;
}

/**
 * 获取任务可用的物理无人机列表
 * @returns 物理无人机列表
 */
export async function getJobPhysicalDrones(): Promise<PhysicalDrone[]> {
  const res = await httpClient.instance.get<Response<PhysicalDrone[]>>(
    `${prefix}/creation/drones`
  );  
  return res.data.data;
}

/**
 * 创建新任务
 * @param data 创建任务的请求数据
 * @returns 创建的任务详情
 */
export async function createJob(
  data: JobCreationRequest
): Promise<JobDetailResult> {
  const res = await httpClient.instance.post<Response<JobDetailResult>>(
    `${prefix}`,
    data
  );
  return res.data.data;
}

/**
 * 获取创建任务的选项数据
 * @param id 相关ID
 * @returns 任务创建选项数据
 */
export async function getJobCreateOpytions(): Promise<JobCreationResult> {
  const res = await httpClient.instance.get<Response<JobCreationResult>>(
    `${prefix}/creation/options`
  );
  return res.data.data;
}

/**
 * 删除任务
 * @param id 任务ID
 * @returns void
 */
export async function deleteJob(id: number): Promise<void> {
  await httpClient.instance.delete(`${prefix}/${id}`);
}
