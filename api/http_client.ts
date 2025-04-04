import { getLocalStorage } from "@/lib/storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// 导出 baseURL
export const baseURL = "http://127.0.0.1:10086/api/v1";

class HttpClient {
  instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
    this.loadTokenFromLocalStorage();
  }

  private loadTokenFromLocalStorage() {
    const token = getLocalStorage("auth_token");
    if (token) {
      console.log(`Loading token from localStorage: ${token}`);
      
      this.instance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(this.onRequest, this.onError);
    this.instance.interceptors.request.use(this.onResponse, this.onError);
  }

  private onRequest(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
    return config;
  }

  private onResponse(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
    return config;
  }

  private onError(error: AxiosError) {
    // 统一的错误处理逻辑
    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在2xx范围内
      console.error("Server responded with status:", error.response.status);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error("No response received:", error.request);
    } else {
      // 在设置请求时发生了一些事情，触发了错误
      console.error("Error setting up the request:", error.message);
    }
    return Promise.reject(error);
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
