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
import { useMutation } from "@tanstack/react-query";
import { Key } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword } from "./requests"; // 导入修改密码的API函数  // 定义表单模式
const formSchema = z
  .object({
    oldPassword: z.string().min(6, { message: "密码不能少于6个字符" }),
    password: z.string().min(6, { message: "密码不能少于6个字符" }),
    confirmPassword: z.string().min(6, { message: "密码不能少于6个字符" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export default function ChangePasswordDialog(
  props: Readonly<{
    id: number;
    username: string;
  }>
) {
  const [open, setOpen] = useState(false);

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      console.log(`修改用户 ${props.username}(ID: ${props.id}) 的密码`);
      // 调用实际的API修改密码
      return changePassword({
        userId: props.id,
        oldPassword: data.oldPassword,
        newPassword: data.password,
      });
    },
    onSuccess: () => {
      // 提示成功
      toast({
        title: "修改成功",
        description: `用户 ${props.username} 的密码已更新`,
      });
      // 关闭对话框
      setOpen(false);
      // 重置表单
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "修改失败",
        description: `发生错误: ${error}`,
        variant: "destructive",
      });
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-sm bg-blue-400 text-gray-100 hover:bg-blue-500"
        >
          <Key className="h-4 w-4 mr-1" />
          修改密码
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改密码 - {props.username}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 表单内容部分 */}
            <div className="space-y-4">
              {/* 旧密码 */}
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      旧密码
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入旧密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 新密码 */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      新密码
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入新密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 确认密码 */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-500">
                      确认密码
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请再次输入新密码"
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
