import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { JobItemResult } from "../jobs/[id]/type";
import { TaskItemResult } from "./type";

export async function getTasks(): Promise<TaskItemResult[]> {
  const res = await httpClient.instance.get<Response<JobItemResult[]>>(`/job`);
  const ans = res.data.data.map((item) => {
    return {
      job_id: item.id,
      job_name: item.name,
      job_description: item.description || "No description available",
      job_status: 0,
      schedule_time: "111",
      start_time: "2023-10-15T10:30:00Z",
      end_time: "2023-10-15T11:45:00Z",
      created_by: "admin",
    } as TaskItemResult;
  });
  return ans;
}
