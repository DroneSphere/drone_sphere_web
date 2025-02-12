"use client";

import { login, LoginCommand } from "@/api/user/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DJIModule, jsNativeAPI, ThingParams } from "@/lib/dji-bridge";
import "dotenv/config";
import { Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import VConsole from "vconsole";

export default function Home() {
  const { toast } = useToast();

  const [isLoginEnabled, setLoginEnabled] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  // 用来处理回调函数在第一次触发时不应该执行的问题
  const [firstAttempt, setFirstAttempt] = useState(true);

  useEffect(() => {
    setLoginEnabled(username !== null && password !== null);
  }, [username, password]);

  useEffect(() => {
    const vConsole = new VConsole();
    vConsole.showSwitch();

    const licenseInfo = {
      appId: process.env.NEXT_PUBLIC_DJI_APP_ID,
      appKey: process.env.NEXT_PUBLIC_DJI_APP_KEY,
      license: process.env.NEXT_PUBLIC_DJI_LICENSE,
    };
    jsNativeAPI.setLicense(licenseInfo);

    const connectCallback = async (arg: boolean) => {
      console.log(arg);
      // 第一次触发时不执行
      if (firstAttempt) {
        setFirstAttempt(false);
        console.log("First attempt, skip");
        toast({
          title: "开始连接",
          description: "正在连接到 DroneSphere",
        });
      }
      if (arg) {
        console.log("Connected successfully!");
        toast({
          title: "连接成功",
          description: "已成功连接到 Pilot",
        });
      } else {
        console.log("Disconnected!");
        toast({
          title: "连接失败",
          description: "无法连接到 Pilot",
        });
      }
    };
    window.connectCallback = connectCallback;
  }, [toast, firstAttempt]);

  // TODO: Remove this block
  useEffect(() => {
    setUsername("admin");
    setPassword("123456");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="m-auto w-96 bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-4">
        <div className="my-4 text-center text-xl">Pilot 登录</div>
        <div className="flex items-center">
          <User className="w-8 h-8 mr-4" />
          <Input value={username || ""} />
        </div>
        <div className="flex items-center">
          <Lock className="w-8 h-8 mr-4" />
          <Input value={password || ""} />
        </div>
        <div className="flex justify-center">
          <Button
            disabled={!isLoginEnabled}
            onClick={async () => {
              // 验证 Developer 许可
              const { success: isVerified, message } =
                jsNativeAPI.platformVerifyLicense();
              console.log(isVerified, message);
              if (!isVerified) {
                toast({
                  title: "许可证验证失败",
                  description: message,
                });
                return;
              }

              // 登录
              const cmd = {
                username,
                password,
                sn: jsNativeAPI.getRemoteControllerSN(),
              } as LoginCommand;
              const res = await login(cmd);
              console.log(res);

              jsNativeAPI.setInformation(
                res.platform.platform,
                res.platform.workspace,
                res.platform.desc
              );

              const thingParams: ThingParams = {
                host: res.params.mqtt_host,
                connectCallback: "connectCallback",
                username: res.params.mqtt_username,
                password: res.params.mqtt_password,
              };
              jsNativeAPI.setThingParams(thingParams);
              jsNativeAPI.initComponent(DJIModule.THING);
            }}
            className="w-full my-4"
          >
            登录
          </Button>
        </div>
      </div>
    </div>
  );
}
