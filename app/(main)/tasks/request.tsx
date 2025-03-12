import { TaskItemResult, TaskStatus } from "./type";

export async function getTasks(): Promise<TaskItemResult[]> {
  return new Promise<TaskItemResult[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          job_id: 1,
          job_name: "任务1",
          job_description: "任务描述1",
          job_status: TaskStatus.NOT_STARTED,
          schedule_time: "2025年3月12日 10:00:00",
          created_by: "用户1",
        },
        {
          job_id: 2,
          job_name: "任务2",
          job_status: TaskStatus.IN_PROGRESS,
          schedule_time: "2025年3月12日 11:00:00",
          start_time: "2025年3月12日 10:05:00",
          created_by: "用户2",
        },
        {
          job_id: 3,
          job_name: "任务3",
          job_description: "任务描述3,任务描述3,任务描述3,任务描述3,任务描述3",
          job_status: TaskStatus.COMPLETED,
          schedule_time: "2025年3月12日 12:00:00",
          start_time: "2025年3月12日 10:10:00",
          end_time: "2025年3月12日 11:00:00",
          created_by: "用户1",
        },
        {
          job_id: 4,
          job_name: "任务4",
          job_description: "任务描述4",
          job_status: TaskStatus.FAILED,
          schedule_time: "2025年3月12日 13:00:00",
          start_time: "2025年3月12日 10:15:00",
          end_time: "2025年3月12日 11:30:00",
          created_by: "用户2",
        },
      ]);
    }, 500 + Math.random() * 1000);
  });
}
