import httpClient from "@/api/http_client";
import { Response } from "@/api/response";
import { PayloadItemResult } from "./type";

export async function getPayloads(): Promise<PayloadItemResult[]> {
  const res = await httpClient.instance.get<Response<PayloadItemResult[]>>(
    "/models/payloads"
  );
  console.log(res.data);
  return res.data.data;
}
