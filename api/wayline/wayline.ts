import httpClient from "../http_client";
import { Response } from "../response";

export interface WaylineItemResult {
  id?: number;
  drone_model?: string;
  drone_sn?: string;
  upload_user?: string;
  s3_key?: string;
  created_at?: string;
}

const prefix = "/wayline";

export async function fetchAllWaylines(): Promise<WaylineItemResult[]> {
  const res = await httpClient.instance.get<Response<WaylineItemResult[]>>(
    `${prefix}`
  );
  return res.data.data;
}

export async function downloadWayline(key: string) {
  console.log(key);
const res = await httpClient.instance.get(`${prefix}/download`, {
    // params: { key },
    responseType: 'blob' // Set response type to blob for binary data
});
return res.data; // Returns the binary data directly
}
