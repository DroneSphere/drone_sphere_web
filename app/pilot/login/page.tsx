"use client";

import { login, LoginRequest } from "@/api/user/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { jsNativeAPI } from "@/lib/dji-bridge";
import "dotenv/config";
import { Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VConsole from "vconsole";

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoginEnabled, setLoginEnabled] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

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
      if (arg) {
        console.log("Connected successfully!");
        toast({
          title: "连接成功",
          description: "已成功连接到 Pilot",
        });
      }
    };
    window.connectCallback = connectCallback;
  }, [toast]);

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
              // 登录
              const cmd = {
                username,
                password,
                sn: jsNativeAPI.getRemoteControllerSN(),
              } as LoginRequest;
              const res = await login(cmd);
              console.log(res);
              router.push("/pilot");
              
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
