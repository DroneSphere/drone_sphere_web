"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createUser } from "./requests";

// 定义表单模式
const formSchema = z.object({
  username: z.string().min(1, { message: "用户名不能为空" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  password: z.string().min(6, { message: "密码不能少于6个字符" }),
});

export default function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      console.log("添加新用户", data);
      // 调用实际的API创建用户
      return createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        // avatar字段是可选的，这里暂不提供
      });
    },
    onSuccess: (data) => {
      // 使之前的查询失效，刷新用户列表
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      // 提示成功，并显示用户名
      toast({
        title: "添加成功",
        description: `用户 ${data.username} 已成功添加`,
      });
      // 关闭对话框
      setOpen(false);
      // 重置表单
      form.reset();
    },
    onError: (error: Error) => {
      // 显示详细错误信息
      toast({
        title: "添加用户失败",
        description: error.message || "未知错误，请重试",
        variant: "destructive",
      });
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-sm bg-green-500 text-gray-100 hover:bg-green-600">
          <PlusCircle className="h-4 w-4 mr-1" />
          添加用户
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新用户</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 表单内容部分 */}
            <div className="space-y-4">
              {/* 用户名 */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      用户名
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 邮箱 */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      邮箱
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="请输入邮箱地址" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 密码 */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      密码
                    </FormLabel>
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
            </div>

            {/* 底部按钮 */}
            <DialogFooter>
              <Button
                disabled={mutation.isPending}
                variant="outline"
                className="px-6"
                onClick={() => setOpen(false)}
                type="button"
              >
                取消
              </Button>
              <Button
                disabled={mutation.isPending}
                type="submit"
                className="px-6 bg-primary hover:bg-primary/90"
              >
                {mutation.isPending ? "提交中..." : "提交"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
