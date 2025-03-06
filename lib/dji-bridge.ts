/* eslint-disable */
interface JsResponse {
  code: number;
  message: string;
  data: any;
}

interface DJILicense {
  appId: string;
  appKey: string;
  license: string;
}

export interface ThingParams {
  host: string;
  connectCallback: string;
  username: string;
  password: string;
}

export interface APIParams {
  host: string;
  token: string;
}

export interface WSParams {
  host: string;
  token: string;
  connectCallback: string;
}

export interface EmptyParams {}

export enum DJIModule {
  THING = "thing",
  API = "api",
  WS = "ws",
  MISSION = "mission",
  TSA = "tsa",
}

class JsNativeAPI {
  // 私有属性
  private license: DJILicense | null = null;
  private thingParams: ThingParams | null = null;
  private apiParams: APIParams | null = null;
  private wsParams: WSParams | null = null;

  /**
   * 解析响应并返回字符串数据
   * @param response - JSON 格式的字符串响应
   * @returns 解析后的字符串数据，如果响应有错误则返回空字符串
   */
  returnString(response: string): string {
    const res: JsResponse = JSON.parse(response);
    return this.errorHint(res) ? res.data : "";
  }

  /**
   * 解析响应并返回布尔值数据
   * @param response - JSON 格式的字符串响应
   * @returns 解析后的布尔值数据，如果响应有错误则返回 false
   */
  returnBool(response: string): boolean {
    const res: JsResponse = JSON.parse(response);
    const isError = this.errorHint(res);
    if (JSON.stringify(res.data) !== "{}") {
      return isError && res.data;
    }
    return isError;
  }

  /**
   * 解析响应并返回数据
   *
   * @param {string} response - JSON 格式的字符串响应
   * @returns {any} 解析后的数据
   */
  private returnData(response: string): any {
    const res = JSON.parse(response);
    if (res.code !== 0) {
      console.error(res.message);
      return null;
    }
    return res.data;
  }

  /**
   * 检查响应是否有错误，如果有错误则打印错误信息
   * @param response - JsResponse 对象
   * @returns 如果响应没有错误返回 true，否则返回 false
   */
  errorHint(response: JsResponse): boolean {
    if (response.code !== 0) {
      console.error(response.message);
      return false;
    }
    return true;
  }

  getLogPath(): string {
    return this.returnString(window.djiBridge.platformGetLogPath());
  }

  setLogEncryptKey(key: string): boolean {
    const response = window.djiBridge.platformSetLogEncryptKey(key);
    return this.returnBool(response);
  }

  /**
   * 初始化模块
   *
   * @param mod - 模块名称
   * @returns 是否初始化成功
   * @memberof JsNativeAPI
   */
  initComponent(mod: string): boolean {
    switch (mod) {
      case DJIModule.THING:
        if (!this.thingParams) {
          console.error("请先设置 Thing 参数");
          return false;
        }
        const res = window.djiBridge.platformLoadComponent(
          DJIModule.THING,
          JSON.stringify(this.thingParams)
        );
        console.log("thingRes: ", res);
        return true;
      case DJIModule.API:
        const apiRes = window.djiBridge.platformLoadComponent(
          DJIModule.API,
          JSON.stringify(this.apiParams)
        );
        console.log("apiRes: ", apiRes);
        return this.returnBool(apiRes);
      case DJIModule.WS:
        const wsRes = window.djiBridge.platformLoadComponent(
          DJIModule.WS,
          JSON.stringify(this.wsParams)
        );
        console.log("wsRes: ", wsRes);
        return this.returnBool(wsRes);
      case DJIModule.MISSION:
        const missionRes = window.djiBridge.platformLoadComponent(
          DJIModule.MISSION,
          JSON.stringify(this.apiParams)
        );
        console.log("missionRes: ", missionRes);
        return this.returnBool(missionRes);
      case DJIModule.TSA:
        const tsaRes = window.djiBridge.platformLoadComponent(
          DJIModule.TSA,
          JSON.stringify(this.apiParams)
        );
        console.log("tsaRes: ", tsaRes);
        return this.returnBool(tsaRes);
      default:
        console.error("未知模块");
        return false;
    }
  }

  /**
   * 设置许可证信息
   * @param license - DJI 许可证信息
   * @returns 设置是否成功
   */
  setLicense(license: DJILicense): boolean {
    this.license = license;
    return true;
  }

  /**
   * 平台验证许可证
   *
   * @returns 验证结果和消息的闭包，如果验证失败则返回 false 以及错误消息; 否则返回 true，null
   */
  platformVerifyLicense(): { success: boolean; message: string | null } {
    if (!this.license) {
      console.error("请先设置许可证信息");
      return { success: false, message: "请先设置许可证信息" };
    }
    const response = window.djiBridge.platformVerifyLicense(
      this.license?.appId,
      this.license?.appKey,
      this.license?.license
    );
    return {
      success: this.returnBool(response),
      message: null,
    };
  }

  isComponentLoaded(name: string): boolean {
    const response = window.djiBridge.platformIsComponentLoaded(name);
    console.log("isComponentLoaded response: ", response);

    return this.returnBool(response);
  }

  /**
   * 设置工作区 ID
   *
   * @param platformName - 平台名称
   * @param workspaceName - 工作区名称
   * @param desc - 工作区描述
   * @returns 是否设置成功
   */
  setInformation(
    platformName: string,
    workspaceName: string,
    desc: string
  ): boolean {
    const response = window.djiBridge.platformSetInformation(
      platformName,
      workspaceName,
      desc
    );
    return this.returnBool(response);
  }

  /**
   * 设置工作区 ID
   *
   * @param uuid - 工作区 ID
   * @returns 是否设置成功
   */
  setWorkspaceId(uuid: string): boolean {
    const response = window.djiBridge.platformSetWorkspaceId(uuid);
    return this.returnBool(response);
  }

  /**
   * 获取遥控器序列号SN
   *
   * @returns {string} The serial number of the remote controller.
   */
  getRemoteControllerSN(): string {
    return this.returnString(window.djiBridge.platformGetRemoteControllerSN());
  }

  /**
   * 设置 API token
   *
   * @param token - The API token to be set.
   * @returns A boolean indicating whether the token was successfully set.
   */
  apiSetToken(token: string): boolean {
    const response = window.djiBridge.apiSetToken(token);
    return this.returnBool(response);
  }

  /**** Thing 模块 ****/
  /**
   * 设置 Thing 参数
   *
   * @param params - Thing 参数
   * @returns 设置是否成功
   * @memberof JsNativeAPI
   */
  setThingParams(params: ThingParams): boolean {
    this.thingParams = params;
    return true;
  }

  /**
   * 获取连接状态
   *
   * @returns {boolean} 连接状态
   */
  getConnectState(): boolean {
    const response = window.djiBridge.thingGetConnectState();
    console.log("connect state response: ", response);
    return this.returnBool(response);
  }

  /**
   * 启动连接
   *
   * @returns {boolean} 是否成功启动连接
   */
  connect(): boolean {
    if (!this.thingParams) {
      console.error("请先设置 Thing 参数");
      return false;
    }
    const response = window.djiBridge.thingConnect(
      this.thingParams?.username,
      this.thingParams?.password,
      this.thingParams?.connectCallback
    );
    console.log("connect response: ", response);

    return this.returnBool(response);
  }

  /**
   * 关闭连接
   *
   * @returns {boolean} 是否成功关闭连接
   */
  disconnect(): boolean {
    const response = window.djiBridge.thingDisconnect();
    return this.returnBool(response);
  }

  /**
   * 设置连接状态回调函数
   *
   * @param {Function} callback - 连接状态回调函数
   */
  setConnectCallback(callback: string): void {
    window.thing.setConnectCallback(callback);
  }

  /**
   * 获取设置的参数
   *
   * @returns {any} 返回设置的参数
   */
  getConfigs(): any {
    const response = window.djiBridge.thingGetConfigs();
    return this.returnData(response);
  }

  /**** API 模块 ****/
  /**
   * 设置 API 参数
   *
   * @param params - API 参数
   * @returns 设置是否成功
   * @memberof JsNativeAPI
   */
  setApiParams(params: APIParams): boolean {
    this.apiParams = params;
    return true;
  }

  /**** WS 模块 ****/
  /**
   * 设置 WS 参数
   *
   * @param params - WS 参数
   * @returns 设置是否成功
   * @memberof JsNativeAPI
   */
  setWSParams(params: WSParams): boolean {
    this.wsParams = params;
    return true;
  }
}

// 导出类的实例
export const jsNativeAPI = new JsNativeAPI();
