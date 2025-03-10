"use client";

import { login } from "@/api/user/request";
import { LoginRequest } from "@/api/user/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { jsNativeAPI } from "@/lib/dji-bridge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import "dotenv/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import VConsole from "vconsole";
import { z } from "zod";

// 登录表单验证模式
const formSchema = z.object({
  email: z.string().min(1, "邮箱不能为空"),
  password: z.string().min(6, "密码至少需要6个字符"),
});

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();

  // 登录表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@mail.com",
      password: "123456",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const res = await login(payload);
      return res;
    },
    onSuccess: (data) => {
      console.log(data);

      router.push("/zh/pilot");
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="m-auto w-96 bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-4">
        <div className="my-4 text-center text-xl">Pilot 登录</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>电子邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入电子邮箱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="请输入密码"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              type="submit"
              disabled={mutation.isPending}
            >
              登录
            </Button>
          </form>
        </Form>
        {/* <div className="flex items-center">
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
            onClick={() => {
              if (username && password) {
                mutation.mutate({
                  username,
                  password,
                });
              }
            }}
            className="w-full my-4"
          >
            登录
          </Button>
        </div> */}
      </div>
    </div>
  );
}
