/**
 * 任务搜索参数
 * Parameters for job search
 */
export interface JobSearchParams {
  /** 任务名称 */
  job_name?: string;
  /** 区域 */
  area_name?: string;
  /** 创建开始时间 */
  createAtBegin?: string;
  /** 创建结束时间 */
  createAtEnd?: string;
}

/**
 * 任务列表返回的元素项结构
 * Structure of job items returned from job list
 */
export interface JobItemResult {
  /** 任务的唯一标识ID */
  id: number;
  /** 任务名称 */
  name: string;
  /** 区域名称 */
  area_name: string;
  /** 计划时间 */
  schedule_time: string;
  /** 任务描述 */
  description: string;
  /** 使用的无人机列表 */
  drones: string[];
}
