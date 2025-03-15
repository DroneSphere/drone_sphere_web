import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { GimbalItemResult } from "./type";

export async function getGimbalList(): Promise<GimbalItemResult[]> {
  const res = await httpClient.instance.get<Response<GimbalItemResult[]>>(
    "/models/gimbals"
  );
  console.log(res.data);
  return res.data.data;
}
