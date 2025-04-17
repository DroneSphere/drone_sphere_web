"use client";

import { addModel } from "@/app/(main)/models/drones/request";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// 定义表单模式
const formSchema = z.object({
  name: z.string().min(1, { message: "无人机型号名称不能为空" }),
  description: z.string().optional(),
  domain: z.coerce.number().int().optional(),
  type: z.coerce.number().int().optional(),
  sub_type: z.coerce.number().int().optional(),
  gateway_id: z.coerce.number().int().min(1, { message: "网关ID不能为空" }),
});

export default function AddDroneModelDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return addModel({
        name: data.name,
        description: data.description,
        domain: data.domain,
        type: data.type,
        sub_type: data.sub_type,
        gateway_id: data.gateway_id,
      });
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["models", "drones"],
      });
      // 重置表单
      form.reset();
      toast({
        title: "添加成功",
        description: "新无人机型号已成功添加",
      });
      // 关闭对话框
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      domain: 1,
      type: 1,
      sub_type: 1,
      gateway_id: undefined,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("提交表单数据", data);
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="default"
          className="rounded-sm bg-green-500 text-gray-100 hover:bg-green-600"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          添加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加新无人机型号</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 表单内容部分 */}
            <div className="my-4 divide-y divide-gray-200">
              {/* 无人机型号名称 - 必填 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  型号名称
                </FormLabel>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input placeholder="请输入无人机型号名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 网关ID - 必填 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  网关ID
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gateway_id"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="请输入网关ID" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 领域 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  领域
                </FormLabel>
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="请输入领域值" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 无人机主类型 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  主类型
                </FormLabel>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="请输入主类型值" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 无人机子类型 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  子类型
                </FormLabel>
                <FormField
                  control={form.control}
                  name="sub_type"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="请输入子类型值" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 描述字段 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  描述
                </FormLabel>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Textarea placeholder="请输入描述信息" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
