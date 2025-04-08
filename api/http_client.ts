import {
  getLocalStorage,
  removeLocalStorage,
  AUTH_TOKEN_KEY,
} from "@/lib/storage";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

// 导出 baseURL，从环境变量中获取，如果没有设置则使用默认值
export const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:10086/api/v1";

class HttpClient {
  instance: AxiosInstance;

  constructor() {
    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 初始化拦截器
    this.setupInterceptors();

    // 从本地存储加载 token
    this.loadTokenFromLocalStorage();
  }

  private loadTokenFromLocalStorage() {
    const token = getLocalStorage(AUTH_TOKEN_KEY);
    if (token) {
      console.log("从 localStorage 加载 token");
      this.setAuthorizationToken(token);
    }
  }

  private setAuthorizationToken(token: string) {
    if (token) {
      this.instance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } else {
      delete this.instance.defaults.headers.common["Authorization"];
    }
  }

  private setupInterceptors() {
    // 请求拦截器
    // this.instance.interceptors.request.use(
    //   (config: InternalAxiosRequestConfig) => {
    //     // 添加请求时间戳
    //     config.params = {
    //       ...config.params,
    //       _t: Date.now()
    //     };
    //     return config;
    //   },
    //   (error: AxiosError) => {
    //     console.error('请求配置错误:', error.message);
    //     return Promise.reject(error);
    //   }
    // );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;

          // 处理 401/403 认证错误
          if (status === 401 || status === 403) {
            console.log("认证失败，清除认证信息");

            // 清除认证信息
            this.clearAuth();

            // 判断环境并重定向
            this.redirectToLogin();
          }

          console.error("请求失败:", {
            status: error.response.status,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response.data,
          });
        } else if (error.request) {
          console.error("未收到响应:", {
            url: error.config?.url,
            method: error.config?.method,
          });
        } else {
          console.error("请求配置错误:", error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private clearAuth() {
    // 清除本地存储的 token
    removeLocalStorage(AUTH_TOKEN_KEY);

    // 清除请求头中的 token
    this.setAuthorizationToken("");
  }

  private redirectToLogin() {
    if (typeof window !== "undefined") {
      // 判断是否在 DJI Webview 环境中
      const isDjiWebview =
        window.djiBridge &&
        typeof window.djiBridge.platformVerifyLicense === "function";

      // 根据环境选择重定向路径
      const loginUrl = isDjiWebview ? "/pilot/login" : "/login";

      // 使用 window.location 进行重定向
      window.location.href = loginUrl;
    }
  }

  public setHeader(key: string, value: string) {
    this.instance.defaults.headers.common[key] = value;
  }

  public removeHeader(key: string) {
    delete this.instance.defaults.headers.common[key];
  }
}

const httpClient = new HttpClient();
export default httpClient;
