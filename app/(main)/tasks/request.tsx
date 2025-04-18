import { fetchAllJobs } from "../jobs/requests";
import { JobSearchParams } from "../jobs/types";
import { TaskItemResult, TaskStatus } from "./type";

/**
 * 获取所有任务列表
 * 复用jobs接口,并进行数据适配转换
 * @param params 查询参数
 * @returns 任务列表数据
 */
export async function getTasks(
  params?: JobSearchParams | null
): Promise<TaskItemResult[]> {
  try {
    // 获取原始任务数据，传入查询参数
    const jobItems = await fetchAllJobs(params);

    // 转换为TaskItemResult格式
    return jobItems.map((job) => ({
      job_id: job.id,
      job_name: job.name,
      job_description: job.description,
      job_status: TaskStatus.NOT_STARTED, // 任务状态默认为未开始
      schedule_time: job.schedule_time,
      created_by: "system", // 暂时使用默认值
    }));
  } catch (error) {
    console.error("获取任务列表失败:", error);
    throw error;
  }
}
