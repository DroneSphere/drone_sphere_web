"use client";

import { addDrone, fetchDroneModels } from "@/app/(main)/drones/requests";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";

// 不使用选项列表，改为直接输入

// 定义表单模式，参考DroneDetailResult中的字段
const formSchema = z.object({
  sn: z.string().min(1, { message: "序列号不能为空" }),
  callsign: z.string().optional(),
  description: z.string().optional(),
  product_model: z.string().optional(),
  is_rtk_available: z.boolean().default(false),
  is_thermal_available: z.boolean().default(false),
  // 新增字段 - 使用字符串类型
  domain: z.string().optional(),
  type: z.string().optional(),
  sub_type: z.string().optional(),
});

export default function AddDroneDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 获取无人机型号列表
  const modelsQuery = useQuery({
    queryKey: ["droneModels"],
    queryFn: fetchDroneModels,
    enabled: open, // 只在对话框打开时获取数据
  });

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return addDrone(data);
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["drones"],
      });
      // 重置表单
      form.reset();
      // 关闭对话框
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sn: "",
      callsign: "",
      description: "",
      product_model: undefined,
      is_rtk_available: false,
      is_thermal_available: false,
      // 新增字段的默认值 - 改为空字符串
      domain: "",
      type: "",
      sub_type: "",
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
          size="sm"
          className="rounded-sm bg-blue-500 text-gray-100 hover:bg-blue-600"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          添加无人机
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加新无人机</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* 表单内容部分 */}
            <div className="my-4 divide-y divide-gray-200">
              {/* 无人机序列号 - 必填 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  序列号 (SN)
                </FormLabel>
                <FormField
                  control={form.control}
                  name="sn"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder="请输入无人机序列号"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 无人机呼号 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  呼号
                </FormLabel>
                <FormField
                  control={form.control}
                  name="callsign"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder="请输入无人机呼号"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 无人机型号 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  型号
                </FormLabel>
                <FormField
                  control={form.control}
                  name="product_model"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择无人机型号" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modelsQuery.isSuccess && modelsQuery.data ? (
                            modelsQuery.data.map((model) => (
                              <SelectItem key={model.id} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading_or_error" disabled>
                              {modelsQuery.isPending ? "加载中..." : "获取型号列表失败"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 是否支持RTK */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  是否支持RTK
                </FormLabel>
                <FormField
                  control={form.control}
                  name="is_rtk_available"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 flex flex-row items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-gray-500">
                        {field.value ? "支持" : "不支持"}
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 是否支持热成像 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  是否支持热成像
                </FormLabel>
                <FormField
                  control={form.control}
                  name="is_thermal_available"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 flex flex-row items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-gray-500">
                        {field.value ? "支持" : "不支持"}
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 领域输入 */}
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
                          placeholder="请输入无人机应用领域"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 类型输入 */}
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                <FormLabel className="text-sm font-medium text-gray-500">
                  类型
                </FormLabel>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder="请输入无人机类型"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 子类型输入 */}
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
                          placeholder="请输入无人机子类型"
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
                        <Input placeholder="请输入描述信息" {...field} />
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
