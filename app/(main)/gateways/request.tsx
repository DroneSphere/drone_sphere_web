import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GatewayItemResult } from "./type";

export async function getAllGateways(): Promise<GatewayItemResult[]> {
  const res = await httpClient.instance.get<Response<GatewayItemResult[]>>(
    "/gateway"
  );
  return res.data.data;
}
