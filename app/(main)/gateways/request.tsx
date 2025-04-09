import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GatewayItemResult } from "./type";

export async function getAllGateways(): Promise<GatewayItemResult[]> {
  const res = await httpClient.instance.get<Response<GatewayItemResult[]>>(
    "/gateway/list"
  );
  return res.data.data;
}

// 定义更新网关的请求接口
export interface UpdateGatewayRequest {
  callsign?: string;
  description?: string;
}

/**
 * 更新网关信息
 * @param sn 网关的序列号
 * @param data 要更新的网关数据
 * @returns 更新后的网关信息
 */
export async function updateGateway(sn: string, data: UpdateGatewayRequest): Promise<GatewayItemResult> {
  const res = await httpClient.instance.put<Response<GatewayItemResult>>(
    `/gateway/${sn}`,
    data
  );
  return res.data.data;
}
