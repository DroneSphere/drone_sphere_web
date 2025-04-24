import { getBySN, updateDrone } from "@/app/(main)/drones/requests";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { keyMappings } from "./misc";
import { Textarea } from "@/components/ui/textarea";

// 定义可编辑字段的表单模式
const formSchema = z.object({
  callsign: z.string().optional(),
  description: z.string().optional(),
});

export default function DetailDialog(
  props: Readonly<{
    sn: string;
    callsign?: string;
    description?: string;
  }>
) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 获取无人机详细信息的查询
  const query = useQuery({
    queryKey: ["drones", props.sn],
    queryFn: () => {
      return getBySN(props.sn);
    },
    enabled: open, // 只在对话框打开时获取数据
  });

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return updateDrone(props.sn, {
        callsign: data.callsign,
        description: data.description,
      });
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["drones"],
      });
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      callsign: props.callsign ?? undefined,
      description: props.description ?? undefined,
    },
  });

  // 当获取到详细数据后更新表单默认值
  if (query.isSuccess && query.data) {
    form.setValue("callsign", query.data.callsign || "");
    form.setValue("description", query.data.description || "");
  }

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("提交表单数据", data);
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-sm bg-blue-400 text-gray-100 hover:bg-blue-500"
        >
          <Edit className="h-4 w-4" />
          编辑
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {/* 加载状态 */}
        {query.isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* 错误状态 */}
        {query.isError && (
          <div className="text-center py-4 text-red-500">
            <p>发生错误: {query.error.message}</p>
            <p>请稍后再试</p>
            <p>如果问题持续存在，请联系管理员</p>
          </div>
        )}

        {/* 成功获取数据状态 */}
        {query.isSuccess && query.data && (
          <>
            <DialogHeader>
              <DialogTitle>无人机详细信息 - {query.data.sn}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* 表单内容部分 */}
                <div className="my-4 divide-y divide-gray-200">
                  {/* 1. 无人机ID（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["sn"] || "无人机ID"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="text-gray-500">
                        {query.data.sn || (
                          <span className="text-gray-400">无</span>
                        )}
                      </span>
                    </dd>
                  </div>

                  {/* 2. 呼号（可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["callsign"] || "呼号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="callsign"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
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
                    </dd>
                  </div>

                  {/* 3. 描述（可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["description"] || "描述"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Textarea placeholder="请输入描述" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </dd>
                  </div>

                  {/* 4. 产品型号（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["modelName"] || "产品型号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="text-gray-500">
                        {query.data.product_model === null ||
                        query.data.product_model === undefined ||
                        query.data.product_model === "" ? (
                          <span className="text-gray-400">无</span>
                        ) : (
                          query.data.product_model
                        )}
                      </span>
                    </dd>
                  </div>

                  {/* 5. 产品型号标识符（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["modelIdentifier"] || "产品型号标识符"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="text-gray-500">
                        {query.data.product_model_key === null ||
                        query.data.product_model_key === undefined ||
                        query.data.product_model_key === "" ? (
                          <span className="text-gray-400">无</span>
                        ) : (
                          query.data.product_model_key
                        )}
                      </span>
                    </dd>
                  </div>

                  {/* 6. 在线状态（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["isOnline"] || "在线状态"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            query.data.status === null ||
                            query.data.status === undefined
                              ? "bg-gray-300"
                              : query.data.status
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="ml-2 text-gray-500">
                          {query.data.status === null ||
                          query.data.status === undefined
                            ? "未知"
                            : query.data.status
                            ? "是"
                            : "否"}
                        </span>
                      </div>
                    </dd>
                  </div>

                  {/* 7. 是否支持RTK（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["hasRTK"] || "是否支持RTK"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            query.data.is_rtk_available === null ||
                            query.data.is_rtk_available === undefined
                              ? "bg-gray-300"
                              : query.data.is_rtk_available
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="ml-2 text-gray-500">
                          {query.data.is_rtk_available === null ||
                          query.data.is_rtk_available === undefined
                            ? "未知"
                            : query.data.is_rtk_available
                            ? "是"
                            : "否"}
                        </span>
                      </div>
                    </dd>
                  </div>

                  {/* 8. 是否支持热成像（不可编辑） */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["hasThermal"] || "是否支持热成像"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            query.data.is_thermal_available === null ||
                            query.data.is_thermal_available === undefined
                              ? "bg-gray-300"
                              : query.data.is_thermal_available
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="ml-2 text-gray-500">
                          {query.data.is_thermal_available === null ||
                          query.data.is_thermal_available === undefined
                            ? "未知"
                            : query.data.is_thermal_available
                            ? "是"
                            : "否"}
                        </span>
                      </div>
                    </dd>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
