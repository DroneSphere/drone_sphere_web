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
import { toast } from "@/hooks/use-toast";

// 不使用选项列表，改为直接输入

// 定义表单模式，参考DroneDetailResult中的字段
const formSchema = z.object({
  sn: z.string().min(1, { message: "序列号不能为空" }),
  callsign: z.string().optional(),
  description: z.string().optional(),
  product_model_id: z.string().optional(),
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
      return addDrone({
        sn: data.sn,
        callsign: data.callsign,
        description: data.description,
        drone_model_id: Number(data.product_model_id),
      });
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["drones"],
      });
      // 重置表单
      // form.reset();
      toast({
        title: "添加成功",
        description: "新无人机已成功添加",
      });
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
      product_model_id: undefined,
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
          添加无人机
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加新无人机</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input placeholder="请输入无人机序列号" {...field} />
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
                        <Input placeholder="请输入无人机呼号" {...field} />
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
                  name="product_model_id"
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
                              <SelectItem key={model.id} value={model.id.toString()}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading_or_error" disabled>
                              {modelsQuery.isPending
                                ? "加载中..."
                                : "获取型号列表失败"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
