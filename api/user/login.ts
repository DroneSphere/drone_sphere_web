import { AUTH_TOKEN_KEY, setLocalStorage } from "@/lib/storage";
import Cookies from "js-cookie";
import httpClient from "../http_client";
import { Response } from "../response";

export interface LoginRequest {
  username: string;
  password: string;
  sn?: string;
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

export async function login(payload: LoginRequest): Promise<LoginResult> {
  console.log("Login Payloiad:" + payload);

  const res = await httpClient.instance.post<Response<LoginResult>>(
    "/user/login",
    payload
  );
  if (res.data.data.token) {
    setLocalStorage(AUTH_TOKEN_KEY, res.data.data.token);
    Cookies.set(AUTH_TOKEN_KEY, res.data.data.token);
    console.log("Set token: " + res.data.data.token);
  }
  console.log(res);
  return res.data.data;
}
