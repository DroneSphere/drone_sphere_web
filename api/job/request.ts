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
  return Promise.resolve({
    id: 1,
    name: "任务名称",
    description: "任务描述",
    area: {
      id: 1,
      name: "区域名称",
      description: "区域描述",
      points: [
        { lng: 116.407128, lat: 39.918722 },
        { lng: 116.417128, lat: 39.918722 },
        { lng: 116.422128, lat: 39.923722 },
        { lng: 116.417128, lat: 39.928722 },
        { lng: 116.412128, lat: 39.926722 },
        { lng: 116.407128, lat: 39.928722 },
        { lng: 116.402128, lat: 39.923722 },
      ],
    },
    drones: [
      {
        id: 1,
        callsign: "无人机1",
        description: "无人机描述",
        model: "无人机型号",
        color: "#ffcc77",
        variantion: {
          index: 2,
          name: "变体名称",
          gimbal: {
            id: 1,
            name: "云台名称",
            description: "",
          },
          payload: {
            id: 1,
            name: "载荷名称",
            description: "",
          },
          rtk_available: true,
          thermal_available: false,
        },
      },
      {
        id: 2,
        callsign: "无人机2",
        description: "无人机描述",
        model: "无人机型号",
        color: "#ff77cc",
        variantion: {
          index: 1,
          name: "变体名称",
          gimbal: {
            id: 1,
            name: "云台名称",
            description: "",
          },
          rtk_available: true,
          thermal_available: true,
        },
      },
    ],
    waylines: [
      {
        // ${drone_id}-${variation_index}
        drone_key: "1-2",
        color: "#ffcc77",
        height: 50,
        points: [
          { lng: 116.412128, lat: 39.926722 },
          { lng: 116.407128, lat: 39.928722 },
          { lng: 116.402128, lat: 39.923722 },
        ],
      },
      {
        // ${drone_id}-${variation_index}
        drone_key: "2-1",
        color: "#ff77cc",
        height: 30,
        points: [
          { lng: 116.407128, lat: 39.918722 },
          { lng: 116.417128, lat: 39.918722 },
          { lng: 116.417128, lat: 39.928722 },
          { lng: 116.412128, lat: 39.926722 },
          { lng: 116.407128, lat: 39.928722 },
        ],
      },
    ],
  });
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
  const res: JobEditionResult = {
    drones: [
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
    ],
    areas: [
      {
        id: 1,
        name: "区域1",
        points: [
          { lng: 116.397128, lat: 39.908722 },
          { lng: 116.407128, lat: 39.908722 },
          { lng: 116.407128, lat: 39.918722 },
          { lng: 116.397128, lat: 39.918722 },
        ],
      },
      {
        id: 2,
        name: "区域2",
        points: [
          { lng: 116.387128, lat: 39.898722 },
          { lng: 116.397128, lat: 39.898722 },
          { lng: 116.397128, lat: 39.908722 },
          { lng: 116.387128, lat: 39.908722 },
        ],
      },
      {
        id: 3,
        name: "区域3",
        points: [
          { lng: 116.377128, lat: 39.888722 },
          { lng: 116.387128, lat: 39.888722 },
          { lng: 116.387128, lat: 39.898722 },
          { lng: 116.377128, lat: 39.898722 },
        ],
      },
      {
        id: 5,
        name: "区域4",
        points: [
          { lng: 116.407128, lat: 39.918722 },
          { lng: 116.417128, lat: 39.918722 },
          { lng: 116.422128, lat: 39.923722 },
          { lng: 116.417128, lat: 39.928722 },
          { lng: 116.412128, lat: 39.926722 },
          { lng: 116.407128, lat: 39.928722 },
          { lng: 116.402128, lat: 39.923722 },
        ],
      },
    ],
  };
  return res;
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
