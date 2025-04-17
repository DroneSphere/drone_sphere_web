import httpClient from "../../../api/http_client";
import { Response } from "../../../api/response";
import { DroneDetailResult, DroneItemResult, DroneState, DroneUpdateRequest } from "./types";

// 无人机型号接口返回的数据结构
export interface DroneModelItem {
  id: number;
  name: string;
}

export interface DroneSearchParams {
  sn?: string;
  callsign?: string;
  model?: string;
}

export async function fetchAllDrones(
  params: DroneSearchParams | null = null
): Promise<DroneItemResult[]> {
  console.log("param", params);

  const res = await httpClient.instance.get<Response<DroneItemResult[]>>(
    "/drone/list"
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

export async function fetchDroneState(sn: string): Promise<DroneState> {
  const res = await httpClient.instance.get<Response<DroneState>>(
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
