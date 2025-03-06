import httpClient from "../http_client";
import { Response } from "../response";
import { ConnectionParamsResult, PlatformResult } from "./types";

const prefix = "/platform";

export async function getPlatformInfo(): Promise<PlatformResult> {
  const res = await httpClient.instance.get<Response<PlatformResult>>(
    `${prefix}`
  );
  return res.data.data;
}

export async function getConnectionParams(): Promise<ConnectionParamsResult> {
  const res = await httpClient.instance.get<Response<ConnectionParamsResult>>(
    `${prefix}/params`
  );
  return res.data.data;
}
