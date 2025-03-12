export enum TaskStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = 3,
}

// status 的映射
export const TaskStatusMap: Record<number, string> = {
  [TaskStatus.NOT_STARTED]: "未开始",
  [TaskStatus.IN_PROGRESS]: "进行中",
  [TaskStatus.COMPLETED]: "已完成",
  [TaskStatus.FAILED]: "失败",
};

export interface TaskItemResult {
  job_id: number;
  job_name: string;
  job_description?: string;
  job_status: number;
  schedule_time: string;
  start_time?: string;
  end_time?: string;
  created_by: string;
}
