"use client";

import { getConnectionParams, getPlatformInfo } from "@/api/platform/request";
import { toast } from "@/hooks/use-toast";
import {
  APIParams,
  DJIModule,
  jsNativeAPI,
  LiveParams,
  ThingParams,
  WSParams,
} from "@/lib/dji-bridge";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import VConsole from "vconsole";

enum ModuleStatus {
  UNKNOWN = "unknown",
  CONNECTED = "已连接",
  DISCONNECTED = "未连接",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
}

interface Module {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
}

export default function Page() {
  const [modules, setModules] = useState<Module[]>([
    {
      id: "dji",
      name: "开发者证书授权",
      description: "连接DJI平台认证开发者证书信息",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "thing",
      name: "设备上云模块",
      description: "连接云平台设备上云系统",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "api",
      name: "API模块",
      description: "连接云平台API模块",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "liveshare",
      name: "直播模块",
      description: "连接云平台直播模块",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "ws",
      name: "WebSocket模块",
      description: "连接云平台WebSocket模块",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "mission",
      name: "航线模块",
      description: "连接云平台航线模块",
      status: ModuleStatus.DISCONNECTED,
    },
    {
      id: "tsa",
      name: "TSA模块",
      description: "连接云平台TSA模块",
      status: ModuleStatus.DISCONNECTED,
    },
  ]);

  const platformQuery = useQuery({
    queryKey: ["platform"],
    queryFn: getPlatformInfo,
  });

  const connectionParamsQuery = useQuery({
    queryKey: ["connectionParams"],
    queryFn: getConnectionParams,
    enabled: platformQuery.isSuccess,
  });

  const thingConnectCallback = async (arg: boolean) => {
    console.log(arg);

    if (arg) {
      console.log("Connected successfully!");
      toast({
        title: "连接成功",
        description: "已成功连接到 Pilot",
      });
    }
  };

  const wsConenctCallback = async (arg: boolean) => {
    console.log(arg);
    if (arg) {
      console.log("Connected successfully!");
      toast({
        title: "连接成功",
        description: "已成功连接到 Pilot",
      });
    }
  };

  const liveStatusCallback = async (arg: boolean) => {
    console.log(arg);
    // 直播状态回调
  };

  //  调试时挂载 vConsole
  useEffect(() => {
    const vConsole = new VConsole();
    vConsole.showSwitch();
    console.log("VConsole is ready");
  }, []);

  useEffect(() => {
    if (connectionParamsQuery.isSuccess && platformQuery.data) {
      const { api, thing, ws } = connectionParamsQuery.data;
      console.log("API Params:", api);
      console.log("Thing Params:", thing);
      console.log("WebSocket Params:", ws);

      // 认证证书信息
      const licenseInfo = {
        appId: process.env.NEXT_PUBLIC_DJI_APP_ID,
        appKey: process.env.NEXT_PUBLIC_DJI_APP_KEY,
        license: process.env.NEXT_PUBLIC_DJI_LICENSE,
      };
      jsNativeAPI.setLicense(licenseInfo);
      console.log("License Info:", licenseInfo);
      if (!jsNativeAPI.platformVerifyLicense()) {
        console.error("许可证验证失败");
        return;
      } else {
        console.log("许可证验证成功");
        setModules((prevModules) =>
          prevModules.map((module) => {
            if (module.id === "dji") {
              return { ...module, status: ModuleStatus.CONNECTED };
            }
            return module;
          })
        );
      }

      // 设置平台信息
      jsNativeAPI.setInformation(
        platformQuery.data.platform,
        platformQuery.data.workspace,
        platformQuery.data.desc
      );
      jsNativeAPI.setWorkspaceId(platformQuery.data.workspace_id);

      // 设备上云模块连接
      const thingParams: ThingParams = {
        host: thing.host,
        username: thing.username,
        password: thing.password,
        connectCallback: "thingConnectCallback",
      };
      window.thingConnectCallback = thingConnectCallback;
      jsNativeAPI.setThingParams(thingParams);
      jsNativeAPI.initComponent(DJIModule.THING);
      const checkConnection = setInterval(() => {
        const res = jsNativeAPI.isComponentLoaded(DJIModule.THING);
        if (res) {
          console.log("物模块连接成功");
          // 清除定时器
          clearInterval(checkConnection);
          // 更新模块状态
          setModules((prevModules) =>
            prevModules.map((module) => {
              if (module.id === "thing") {
                return {
                  ...module,
                  status: ModuleStatus.CONNECTED,
                };
              }
              return module;
            })
          );
        } else {
          console.log("物模块连接失败");
        }
      }, 300);

      // API 模块连接
      const apiParams: APIParams = {
        host: api.host,
        token: api.token,
      };
      console.log("API Params:", apiParams);
      jsNativeAPI.setApiParams(apiParams);
      jsNativeAPI.initComponent(DJIModule.API);
      const checkApiConnection = setInterval(() => {
        const res = jsNativeAPI.isComponentLoaded(DJIModule.API);
        if (res) {
          console.log("API模块连接成功");
          // 清除定时器
          clearInterval(checkApiConnection);
          // 更新模块状态
          setModules((prevModules) =>
            prevModules.map((module) => {
              if (module.id === "api") {
                return {
                  ...module,
                  status: ModuleStatus.CONNECTED,
                };
              }
              return module;
            })
          );
        } else {
          console.log("API模块连接失败");
        }
      }, 200);
      jsNativeAPI.apiSetToken(api.token);

      const liveParams: LiveParams = {
        videoPublishType: "video-demand-aux-manual",
        statusCallback: "liveStatusCallback",
      };
      window.liveStatusCallback = liveStatusCallback;
      jsNativeAPI.setLiveParams(liveParams);
      console.log("Live Params:", liveParams);
      jsNativeAPI.initComponent(DJIModule.LIVE);
      const checkLiveConnection = setInterval(() => {
        const res = jsNativeAPI.isComponentLoaded(DJIModule.LIVE);
        if (res) {
          console.log("直播模块连接成功");
          // 清除定时器
          clearInterval(checkLiveConnection);
          // 更新模块状态
          setModules((prevModules) =>
            prevModules.map((module) => {
              if (module.id === "liveshare") {
                return {
                  ...module,
                  status: ModuleStatus.CONNECTED,
                };
              }
              return module;
            })
          );
        } else {
          console.log("直播模块连接失败");
        }
      }, 300);

      // WS 模块连接
      const wsParams: WSParams = {
        host: api.host,
        token: api.token,
        connectCallback: "wsConenctCallback",
      };
      window.wsConenctCallback = wsConenctCallback;
      jsNativeAPI.setWSParams(wsParams);
      jsNativeAPI.initComponent(DJIModule.WS);
      // const checkWSConnection = setInterval(() => {
      //   const res = jsNativeAPI.isComponentLoaded(DJIModule.API);
      //   if (res) {
      //     console.log("WS模块连接成功");
      //     // 清除定时器
      //     clearInterval(checkWSConnection);
      //     // 更新模块状态
      //     setModules((prevModules) =>
      //       prevModules.map((module) => {
      //         if (module.id === "ws") {
      //           return {
      //             ...module,
      //             status: ModuleStatus.CONNECTED,
      //           };
      //         }
      //         return module;
      //       })
      //     );
      //   } else {
      //     console.log("WS模块连接失败");
      //   }
      // }, 300);

      // 连接航线模块
      jsNativeAPI.initComponent(DJIModule.MISSION);
      const checkMissionConnection = setInterval(() => {
        const res = jsNativeAPI.isComponentLoaded(DJIModule.MISSION);
        if (res) {
          console.log("航线模块连接成功");
          // 清除定时器
          clearInterval(checkMissionConnection);
          // 更新模块状态
          setModules((prevModules) =>
            prevModules.map((module) => {
              if (module.id === "mission") {
                return {
                  ...module,
                  status: ModuleStatus.CONNECTED,
                };
              }
              return module;
            })
          );
        } else {
          console.log("航线模块连接失败");
        }
      }, 300);

      // 连接 TSA 模块
      jsNativeAPI.initComponent(DJIModule.TSA);
      const checkTsaConnection = setInterval(() => {
        const res = jsNativeAPI.isComponentLoaded(DJIModule.TSA);
        if (res) {
          console.log("TSA 模块连接成功");
          // 清除定时器
          clearInterval(checkTsaConnection);
          // 更新模块状态
          setModules((prevModules) =>
            prevModules.map((module) => {
              if (module.id === "tsa") {
                return {
                  ...module,
                  status: ModuleStatus.CONNECTED,
                };
              }
              return module;
            })
          );
        } else {
          console.log("TSA 模块连接失败");
        }
      }, 300);
    }
  }, [
    connectionParamsQuery.isSuccess,
    connectionParamsQuery.data,
    platformQuery.data,
  ]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 左侧栏 */}
      <div className="w-1/3 flex flex-col p-2 border-r border-gray-200 bg-white">
        {/* 左侧上方：平台名称、工作空间和用户信息 */}
        {platformQuery.isSuccess && (
          <div className="mb-8">
            <div className="p-2 bg-gray-100 rounded-sm">
              <h2 className="text-lg font-medium">
                {platformQuery.data.workspace}
              </h2>
              <p className="text-gray-600 text-sm mt-1">默认工作空间</p>
              {/* <div className="mt-3 flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  U
                </div>
                <div className="ml-2">
                  <p className="font-medium">用户名</p>
                  <p className="text-xs text-gray-500">用户ID: 123456</p>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* 左侧下方：调试区域 */}
        <div className="flex-grow mt-4">
          <h2 className="text-lg font-medium border-b pb-2 mb-2">事件日志</h2>
          {/* <div className="bg-gray-800 text-green-400 font-mono p-4 rounded-lg h-96 overflow-auto text-sm">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`p-2 rounded-lg mb-2 ${
                  module.status === ModuleStatus.CONNECTED
                    ? "bg-green-100"
                    : module.status === ModuleStatus.DISCONNECTED
                    ? "bg-red-100"
                    : "bg-gray-100"
                }`}
              >
                <strong>{module.name}</strong>: {module.description}
                <span className="ml-2 text-xs text-gray-500">
                  {module.status}
                </span>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* 右侧栏 */}
      <div className="w-2/3 p-2 overflow-auto">
        <h2 className="text-lg font-bold mb-2">模块列表</h2>
        <div className="grid grid-cols-1 gap-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className="px-3 py-2 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold">{module.name}</h3>
                  <p className="text-gray-600 text-sm">{module.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                      module.status === ModuleStatus.CONNECTED
                        ? "bg-green-100 text-green-800"
                        : module.status === ModuleStatus.DISCONNECTED
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {module.status}
                  </div>
                  {/* <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => {
                      // Handle module action (e.g., connect/disconnect)
                      console.log(`Clicked on ${module.name}`);
                    }}
                  >
                    {module.status === ModuleStatus.CONNECTED
                      ? "断开连接"
                      : "连接"}
                  </Button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
