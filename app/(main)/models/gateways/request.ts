import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GatewayModelItemResult } from "./type";

export async function getGatewayModels(): Promise<GatewayModelItemResult[]> {
  const res = await httpClient.instance.get<Response<GatewayModelItemResult[]>>(
    "/models/gateways"
  );
  console.log(res.data);
  return res.data.data;
}
