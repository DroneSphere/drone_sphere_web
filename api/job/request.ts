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
  res.data.data.drones = [
    {
      id: 1,
      callsign: "无人机1",
      variantions: [
        {
          index: 1,
          name: "变体1",
          gimbal: {
            id: 1,
            name: "云台1",
            description: "云台1描述",
          },
          rtk_available: true,
          thermal_available: false,
        },
        {
          index: 2,
          name: "变体2",
          gimbal: {
            id: 2,
            name: "云台2",
            description: "云台2描述",
          },
          rtk_available: false,
          thermal_available: true,
        },
      ],
    },
    {
      id: 2,
      callsign: "无人机2",
      variantions: [
        {
          index: 1,
          name: "变体1",
          gimbal: {
            id: 1,
            name: "云台1",
            description: "云台1描述",
          },
          rtk_available: true,
          thermal_available: false,
        },
        {
          index: 2,
          name: "变体2",
          gimbal: {
            id: 2,
            name: "云台2",
            description: "云台2描述",
          },
          rtk_available: false,
          thermal_available: true,
        },
        {
          index: 3,
          name: "变体3",
          gimbal: {
            id: 3,
            name: "云台3",
            description: "云台3描述",
          },
          rtk_available: true,
          thermal_available: true,
        },
      ],
    },
  ];
  res.data.data.areas = [
    {
      id: 1,
      name: "区域1",
      points: [],
    },
    {
      id: 2,
      name: "区域2",
      points: [],
    },
    {
      id: 3,
      name: "区域3",
      points: [],
    },
  ];
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
