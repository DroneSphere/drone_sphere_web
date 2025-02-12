import httpClient from "../http_client";
import { Response } from "../response";

/**
 * DroneItemResult
 */
export interface DroneItemResult {
  domain?: string;
  id: number;
  /**
   * IsRTKAvailable 是否支持RTK
   */
  is_rtk_available?: boolean;
  /**
   * IsThermalAvailable 是否支持热成像
   */
  is_thermal_available?: boolean;
  /**
   * LastLoginAt 最后登录时间
   */
  last_login_at?: string;
  /**
   * ProductType 无人机的型号名称
   */
  product_type?: string;
  /**
   * 以下字段来自实体信息
   */
  sn: string;
  /**
   * 以上字段来自实体信息
   */
  status?: string;
  sub_type?: number;
  type?: number;
}

export async function fetchAllDrones(): Promise<DroneItemResult[]> {
  const res = await httpClient.instance.get<Response<DroneItemResult[]>>(
    "/drone/list"
  );
  console.log(res);
  return res.data.data;
}
