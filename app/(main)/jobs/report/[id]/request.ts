import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import {
  JobCreationRequest,
  JobCreationResult,
  JobDetailResult,
  PhysicalDrone,
  JobEditRequest,
  SearchResult,
} from "./types";

// API路径前缀
const prefix = "/job";

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
export async function createJob(data: JobCreationRequest): Promise<number> {
  const res = await httpClient.instance.post<Response<number>>(
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

/**
 * 更新任务
 * @param data 更新任务的请求数据
 * @returns 更新后的任务详情
 */
export async function updateJob(
  data: JobEditRequest
): Promise<JobDetailResult> {
  const res = await httpClient.instance.put<Response<JobDetailResult>>(
    `${prefix}`,
    data
  );
  return res.data.data;
}
/**
 * 获取搜索结果
 * @param jobId 任务ID
 * @returns 搜索结果
 */
export const getSearchResults = async (
  jobId: number
): Promise<SearchResult> => {
  const response = await httpClient.instance.get<Response<SearchResult>>(
    `results`,
    {
      params: {
        job_id: jobId,
      },
    }
  );
  // 检查响应状态
  if (response.status !== 200) {
    throw new Error("Failed to fetch search results");
  }
  // 按类别计数的 Map
  const categoryCount = new Map<string, number>();
  for (const item of response.data.data.items) {
    // 生成 code 属性，规则为按照分类使用A、B、C等字母
    // 同一个分类再按照ID自小到大使用1、2、3等数字，分类下的第一个使用 1
    // 例如：A1、A2、B1、B2等
    const category = item.target_label; // 获取目标类型的首字母作为分类
    // 更新计数器
    const index = categoryCount.get(category) || 1;
    categoryCount.set(category, index + 1);
    item.code = `${category}-${index}`;
  }
  // 按照ID排序
  response.data.data.items.sort((a, b) => a.id - b.id);
  // 返回搜索结果数据
  return response.data.data;
};
