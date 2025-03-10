import httpClient from "../http_client";
import { Response } from "../response";
import { DroneDetailResult, DroneItemResult, DroneState } from "./types";

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

export async function fetchDroneState(sn: string): Promise<DroneState> {
  const res = await httpClient.instance.get<Response<DroneState>>(
    `/drone/state/sse/${sn}`
  );
  return res.data.data;
}
