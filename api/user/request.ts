import { AUTH_TOKEN_KEY, setLocalStorage } from "@/lib/storage";
import Cookies from "js-cookie";
import httpClient from "../http_client";
import { Response } from "../response";
import { LoginRequest, LoginResult } from "./types";

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

export async function register(payload: LoginRequest): Promise<LoginResult> {
  const res = await httpClient.instance.post<Response<LoginResult>>(
    "/user/register",
    payload
  );
  console.log(res);
  return res.data.data;
}

export async function getInfo(): Promise<LoginResult> {
  const res = await httpClient.instance.get<Response<LoginResult>>("/user");

  console.log(res);
  return res.data.data;
}
