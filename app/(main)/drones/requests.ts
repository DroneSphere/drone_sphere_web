import httpClient from "../../../api/http_client";
import { Response } from "../../../api/response";
import { DroneDetailResult, DroneItemResult, DroneState, DroneUpdateRequest } from "./types";

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
