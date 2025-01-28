import httpClient from "../http_client";
import { Response } from "../response";

export interface LoginCommand {
  username: string;
  password: string;
  sn: string;
}

export interface LoginResult {
  token: string;
  info: {
    desc: string;
    platform: string;
    workspace: string;
  };
  user: {
    id: number;
    username: string;
  };
  params: {
    http: {
      Host: string;
      Token: string;
    };
    mqtt: {
      host: string;
      password: string;
      username: string;
    };
  };
}

export async function login(payload: LoginCommand): Promise<LoginResult> {
  console.log('Login Payloiad:' + payload);
  const res = await httpClient.instance.post<Response<LoginResult>>(
    "/user/login",
    payload
  );
  console.log(res);
  return res.data.data;
}
