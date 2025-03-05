import httpClient from "../http_client";
import { Response } from "../response";
import {
  JobCreationOptionsResult,
  JobCreationRequest,
  JobDetailResult,
  JobEditionResult,
  JobItemResult,
  JobModifyRequest,
  JobSearchParams,
} from "./types";

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

export async function fetchJobDetail(id: number): Promise<JobDetailResult> {
  const res = await httpClient.instance.get<Response<JobDetailResult>>(
    `${prefix}/${id}`
  );
  return res.data.data;
}

export async function fetchJobCreateionOptions(): Promise<JobCreationOptionsResult> {
  const res = await httpClient.instance.get<Response<JobCreationOptionsResult>>(
    `${prefix}/creation/options`
  );
  return res.data.data;
}

export async function createJob(data: JobCreationRequest): Promise<number> {
  const res = await httpClient.instance.post<Response<JobItemResult>>(
    `${prefix}`,
    data
  );
  return res.data.data.id;
}

export async function fetchJobEditionData(
  id: number
): Promise<JobEditionResult> {
  console.log("fetchJobEditionData", id);
  const res = await httpClient.instance.get<Response<JobEditionResult>>(
    `${prefix}/edition/${id}/options`
  );
  return res.data.data;
}

export async function modifyJob(
  data: JobModifyRequest
): Promise<JobDetailResult> {
  const res = await httpClient.instance.put<Response<JobDetailResult>>(
    `${prefix}`,
    data
  );
  return res.data.data;
}
