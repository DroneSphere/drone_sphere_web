"use client";

import { login } from "@/api/user/request";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useMutation
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setUsername("admin");
    setPassword("123456");
  }, []);

  const loginMut = useMutation({
    mutationFn: login,
    onSuccess: () => {
      console.log("登录成功");
      toast({
        title: "登录成功",
        description: "登录成功",
      });
      setTimeout(() => {
        console.log("Routing");

        router.replace("/");
      }, 200);
    },
  });

  useEffect(() => {
    console.log("LoginMut: " + loginMut.isSuccess);
  }, [loginMut.isSuccess]);

  return (
    <>
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">无人机搜索原型系统</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  id="username"
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => loginMut.mutate({ username, password })}
                disabled={loginMut.isPending}
              >
                登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
