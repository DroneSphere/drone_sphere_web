import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { DroneModelItemResult } from "./type";

export async function getAllModels(): Promise<DroneModelItemResult[]> {
  const res = await httpClient.instance.get<Response<DroneModelItemResult[]>>(
    "/models/drones"
  );

  return res.data.data;
}
