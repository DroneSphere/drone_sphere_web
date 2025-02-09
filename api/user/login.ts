import httpClient from "../http_client";
import { Response } from "../response";

export interface LoginCommand {
  username: string;
  password: string;
  sn: string;
}

export interface LoginResult {
  token: string;
  platform: {
    desc: string;
    platform: string;
    workspace: string;
  };
  user: {
    id: number;
    username: string;
    role: string;
  };
  params: {
    mqtt_host: string;
    mqtt_username: string;
    mqtt_password: string;
  };
}

export async function login(payload: LoginCommand): Promise<LoginResult> {
  console.log("Login Payloiad:" + payload);
  const res = await httpClient.instance.post<Response<LoginResult>>(
    "/user/login",
    payload
  );
  console.log(res);
  return res.data.data;
}
