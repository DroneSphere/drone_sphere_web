// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/settings/users/requests.ts
import httpClient from "@/api/http_client";
import { AxiosResponse } from "axios";
import {
  UserResult,
  UserListResult,
  LoginResult,
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  CreateUserRequest,
} from "./types";

// API 返回数据结构
interface ApiResponse<T> {
  code: number;
  data: T;
  msg?: string;
}

// 获取所有用户信息
export async function getAllUsers(): Promise<UserResult[]> {
  try {
    // 发送GET请求到用户列表接口
    const response: AxiosResponse<ApiResponse<UserListResult>> =
      await httpClient.instance.get("/user/list");

    // 验证响应
    if (response.data.code === 0 && response.data.data) {
      return response.data.data.users;
    }

    // 响应异常处理
    throw new Error(response.data.msg || "获取用户列表失败");
  } catch (error) {
    console.error("获取用户列表出错:", error);
    throw error;
  }
}

// 用户注册
export async function registerUser(
  data: RegisterRequest
): Promise<LoginResult> {
  try {
    // 发送POST请求到注册接口
    const response: AxiosResponse<ApiResponse<LoginResult>> =
      await httpClient.instance.post("/user/register", data);

    // 验证响应
    if (response.data.code === 0 && response.data.data) {
      return response.data.data;
    }

    // 响应异常处理
    throw new Error(response.data.msg || "用户注册失败");
  } catch (error) {
    console.error("用户注册出错:", error);
    throw error;
  }
}

// 用户登录
export async function loginUser(data: LoginRequest): Promise<LoginResult> {
  try {
    // 发送POST请求到登录接口
    const response: AxiosResponse<ApiResponse<LoginResult>> =
      await httpClient.instance.post("/user/login", data);

    // 验证响应
    if (response.data.code === 0 && response.data.data) {
      return response.data.data;
    }

    // 响应异常处理
    throw new Error(response.data.msg || "用户登录失败");
  } catch (error) {
    console.error("用户登录出错:", error);
    throw error;
  }
}

// 修改用户密码
export async function changePassword(
  data: ChangePasswordRequest
): Promise<void> {
  try {
    // 发送POST请求到修改密码接口
    const response: AxiosResponse<ApiResponse<null>> =
      await httpClient.instance.post("/user/change-password", data);

    // 验证响应
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || "修改密码失败");
    }
  } catch (error) {
    console.error("修改密码出错:", error);
    throw error;
  }
}

// 创建新用户
export async function createUser(data: CreateUserRequest): Promise<UserResult> {
  try {
    // 发送POST请求到创建用户接口
    const response: AxiosResponse<ApiResponse<UserResult>> =
      await httpClient.instance.post("/user/create", data);

    // 验证响应
    if (response.data.code === 0 && response.data.data) {
      return response.data.data;
    }

    // 响应异常处理
    throw new Error(response.data.msg || "创建用户失败");
  } catch (error) {
    console.error("创建用户出错:", error);
    throw error;
  }
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<LoginResult> {
  try {
    // 发送GET请求到获取用户信息接口
    const response: AxiosResponse<ApiResponse<LoginResult>> =
      await httpClient.instance.get("/user");

    // 验证响应
    if (response.data.code === 0 && response.data.data) {
      return response.data.data;
    }

    // 响应异常处理
    throw new Error(response.data.msg || "获取用户信息失败");
  } catch (error) {
    console.error("获取用户信息出错:", error);
    throw error;
  }
}
