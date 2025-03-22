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

const prefix = "/job";

export async function fetchAllJobs(
  params: JobSearchParams | null = null
): Promise<JobItemResult[]> {
  console.log("fetchAllJobs", params);

  const res = await httpClient.instance.get<Response<JobItemResult[]>>(
    `${prefix}`
  );
  return res.data.data;
}

export async function getJobDetailById(id: number): Promise<JobDetailResult> {
  const res = await httpClient.instance.get<Response<JobDetailResult>>(
    `${prefix}/${id}`
  );
  console.log("getJobDetailById", res.data.data);
  
  return res.data.data;
}

export async function getJobPhysicalDrones(): Promise<PhysicalDrone[]> {
  const res = await httpClient.instance.get<Response<PhysicalDrone[]>>(
    `${prefix}/creation/drones`
  );
  console.log("getJobPhysicalDrones", res.data.data);
  
  return res.data.data;
}

export async function createJob(
  data: JobCreationRequest
): Promise<JobDetailResult> {
  console.log("createJob", data);

  const res = await httpClient.instance.post<Response<JobDetailResult>>(
    `${prefix}`,
    data
  );
  return res.data.data;
  // return Promise.resolve({} as JobDetailResult);
}

export async function getJobCreateOpytions(
  id: number
): Promise<JobCreationResult> {
  console.log(id);

  const res = await httpClient.instance.get<Response<JobCreationResult>>(
    `${prefix}/creation/options`
  );
  return res.data.data;
}
