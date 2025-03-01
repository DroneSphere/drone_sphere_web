import httpClient from "../http_client";
import { Response } from "../response";

export interface AreaQueryParam {
  id?: number;
  name?: string;
}

export interface AreaListResult {
  id: number;
  name: string;
  description?: string;
  center_lat?: number;
  center_lng?: number;
}

export interface AreaResult {
  id?: number;
  name?: string;
  center_lat?: number;
  center_lng?: number;
  description?: string;
  points?: PointResult[];
}

export interface CreateAreaRequest {
  description?: string;
  name?: string;
  points?: PointResult[];
}

export interface PointResult {
  index?: number;
  lat?: number;
  lng?: number;
}

export interface AreaSearchParams {
  name?: string;
  createAtBegin?: string;
  createAtEnd?: string;
}

const prefix = "/areas";

export async function fetchAllAreas(
  params: AreaSearchParams | null = null
): Promise<AreaListResult[]> {
  console.log(params);

  const res = await httpClient.instance.get<Response<AreaListResult[]>>(
    `${prefix}/list`
  );
  return res.data.data;
}

export async function createArea(
  payload: CreateAreaRequest
): Promise<AreaResult> {
  const res = await httpClient.instance.post<Response<AreaResult>>(
    `${prefix}`,
    payload
  );
  return res.data.data;
}

export async function fetchArea(query: AreaQueryParam): Promise<AreaResult> {
  const res = await httpClient.instance.get<Response<AreaResult>>(`${prefix}`, {
    params: query,
  });
  return res.data.data;
}
