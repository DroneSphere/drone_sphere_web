import httpClient from "../http_client";
import { Response } from "../response";

export interface JobItemResult {
  id: number;
  name: string;
  area_name: string;
  description: string;
  drones: string[];
  target_classes: string[];
}

const prefix = "/job";

export async function fetchAllJobs(): Promise<JobItemResult[]> {
  const res = await httpClient.instance.get<Response<JobItemResult[]>>(
    `${prefix}`
  );
  return res.data.data;
}
