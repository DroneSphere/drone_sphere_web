// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/models/gateways/request.ts
import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import {
  CreateGatewayModelParams,
  GatewayModelItemResult,
  UpdateGatewayModelParams,
} from "./type";

// 获取所有网关型号列表
export async function getGatewayModels(
  name?: string
): Promise<GatewayModelItemResult[]> {
  const res = await httpClient.instance.get<Response<GatewayModelItemResult[]>>(
    "/models/gateways",
    {
      params: {
        name: name || "",
      },
    }
  );
  return res.data.data || [];
}

// 根据ID获取网关型号详情
export async function getGatewayById(
  id: number
): Promise<GatewayModelItemResult> {
  const res = await httpClient.instance.get<Response<GatewayModelItemResult>>(
    `/models/gateway/${id}`
  );
  return res.data.data;
}

// 添加网关型号
export async function addGatewayModel(
  data: CreateGatewayModelParams
): Promise<GatewayModelItemResult> {
  const res = await httpClient.instance.post<Response<GatewayModelItemResult>>(
    "/models/gateway",
    data
  );

  if (res.data.code !== 0) {
    throw new Error(res.data.msg || "创建网关型号失败");
  }

  return res.data.data;
}

// 更新网关型号信息
export async function updateGateway(
  id: number,
  data: UpdateGatewayModelParams
): Promise<GatewayModelItemResult> {
  const res = await httpClient.instance.put<Response<GatewayModelItemResult>>(
    `/models/gateway/${id}`,
    data
  );

  if (res.data.code !== 0) {
    throw new Error(res.data.msg || "更新网关型号失败");
  }

  return res.data.data;
}

// 删除网关型号
export async function deleteGateway(id: number): Promise<boolean> {
  const res = await httpClient.instance.delete<Response<null>>(
    `/models/gateway/${id}`
  );

  if (res.data.code !== 0) {
    throw new Error(res.data.msg || "删除网关型号失败");
  }

  return true;
}
