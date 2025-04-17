"use client";

import { addGimbalModel } from "@/app/(main)/models/gimbals/request";
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
import { Switch } from "@/components/ui/switch";

// 定义表单模式
const formSchema = z.object({
  gimbal_model_name: z.string().min(1, { message: "云台型号名称不能为空" }),
  gimbal_model_description: z.string().optional(),
  gimbal_model_product: z.string().min(1, { message: "产品型号不能为空" }),
  gimbal_model_domain: z.coerce.number().int().optional(),
  gimbal_model_type: z.coerce.number().int().optional(),
  gimbal_model_sub_type: z.coerce.number().int().optional(),
  is_thermal_available: z.boolean().default(false),
});

export default function AddGimbalDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return addGimbalModel({
        gimbal_model_name: data.gimbal_model_name,
        gimbal_model_description: data.gimbal_model_description,
        gimbal_model_product: data.gimbal_model_product,
        gimbal_model_domain: data.gimbal_model_domain,
        gimbal_model_type: data.gimbal_model_type,
        gimbal_model_sub_type: data.gimbal_model_sub_type,
        is_thermal_available: data.is_thermal_available,
      });
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["gimbalModels"],
      });
      // 重置表单
      form.reset();
      toast({
        title: "添加成功",
        description: "新云台型号已成功添加",
      });
      // 关闭对话框
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gimbal_model_name: "",
      gimbal_model_description: "",
      gimbal_model_product: "",
      gimbal_model_domain: 1,
      gimbal_model_type: 1,
      gimbal_model_sub_type: 1,
      is_thermal_available: false,
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
          <DialogTitle>添加新云台型号</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 表单内容部分 */}
            <div className="my-4 divide-y divide-gray-200">
              {/* 云台型号名称 - 必填 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  型号名称
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gimbal_model_name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input placeholder="请输入云台型号名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 产品型号 - 必填 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  产品型号
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gimbal_model_product"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input placeholder="请输入产品型号" {...field} />
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
                  name="gimbal_model_domain"
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

              {/* 主类型 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  主类型
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gimbal_model_type"
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

              {/* 子类型 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  子类型
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gimbal_model_sub_type"
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

              {/* 是否支持热成像 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  支持热成像
                </FormLabel>
                <FormField
                  control={form.control}
                  name="is_thermal_available"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 flex flex-row items-center justify-start space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="text-sm text-gray-500">
                        {field.value ? "支持" : "不支持"}
                      </div>
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
                  name="gimbal_model_description"
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
