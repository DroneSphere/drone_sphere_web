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

export interface SubJobResult {
  area: JobAreaResult;
  drone: JobDrone;
  index: number;
}

export interface JobAreaResult {
  name: string;
  points: Point[];
}

export interface Point {
  lat: number;
  lng: number;
  marker: string;
}

export interface JobDrone {
  model: string;
  name: string;
  sn: string;
}

const prefix = "/job";

export async function fetchAllJobs(): Promise<JobItemResult[]> {
  const res = await httpClient.instance.get<Response<JobItemResult[]>>(
    `${prefix}`
  );
  return res.data.data;
}

export async function fetchJobDetail(id: number): Promise<SubJobResult[]> {
  const res = await httpClient.instance.get<Response<SubJobResult[]>>(
    `${prefix}/${id}`
  );
  return res.data.data;
}
