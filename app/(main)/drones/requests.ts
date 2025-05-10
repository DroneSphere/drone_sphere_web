import httpClient from "../../../api/http_client";
import { Response } from "../../../api/response";
import {
  DroneDetailResult,
  DroneItemResult,
  DroneRTState,
  DroneUpdateRequest,
} from "./types";

// 无人机型号接口返回的数据结构
export interface DroneModelItem {
  id: number;
  name: string;
}

export interface DroneSearchParams {
  sn?: string;
  callsign?: string;
  model_id?: number;
}

export async function fetchAllDrones(
  params: DroneSearchParams | null = null
): Promise<DroneItemResult[]> {
  const res = await httpClient.instance.get<Response<DroneItemResult[]>>(
    "/drone/list",
    {
      params: {
        ...params,
      },
    }
  );
  console.log(res);
  return res.data.data;
}

export async function getBySN(sn: string): Promise<DroneDetailResult> {
  const res = await httpClient.instance.get<Response<DroneDetailResult>>(
    `/drone/sn/${sn}`
  );
  console.log(res);
  return res.data.data;
}

export async function updateDrone(
  sn: string,
  payload: DroneUpdateRequest
): Promise<null> {
  const res = await httpClient.instance.put<Response<null>>(
    `/drone/${sn}`,
    payload
  );
  console.log(res);
  return res.data.data;
}

export async function fetchDroneState(sn: string): Promise<DroneRTState> {
  const res = await httpClient.instance.get<Response<DroneRTState>>(
    `/drone/state/sse/${sn}`
  );
  return res.data.data;
}

/**
 * 获取无人机型号列表
 * @returns 无人机型号列表
 */
export async function fetchDroneModels(): Promise<DroneModelItem[]> {
  const res = await httpClient.instance.get<Response<DroneModelItem[]>>(
    "/drone/models"
  );
  console.log("获取无人机型号列表:", res);
  return res.data.data;
}

/**
 * 添加新无人机
 * @param payload 无人机信息
 * @returns 添加的无人机信息
 */
export async function addDrone(payload: {
  sn: string;
  callsign?: string;
  description?: string;
  drone_model_id?: number;
}): Promise<DroneDetailResult> {
  const res = await httpClient.instance.post<Response<DroneDetailResult>>(
    "/drone",
    payload
  );
  console.log("添加无人机结果:", res);
  return res.data.data;
}

/**
 * 根据SN删除无人机
 * @param sn 无人机序列号
 * @returns 如果成功返回null，否则抛出异常
 */
export async function deleteDroneBySN(sn: string): Promise<null> {
  const res = await httpClient.instance.delete<Response<null>>(`/drone/${sn}`);
  console.log("删除无人机结果:", res);
  return res.data.data;
}
