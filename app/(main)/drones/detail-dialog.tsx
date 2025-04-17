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
                  {/* 可编辑字段 - 呼号 */}
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

                  {/* 可编辑字段 - 描述 */}
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

                  {/* 非可编辑字段 */}
                  {Object.entries(query.data).map(([key, value]) => {
                    // 跳过可编辑字段，因为已经在上面单独处理了
                    if (
                      key === "callsign" ||
                      key === "description" ||
                      key === "sn"
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={key}
                        className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"
                      >
                        <dt className="text-sm font-medium text-gray-500">
                          {keyMappings[key] || key}
                        </dt>

                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {!key.includes("is") && !key.includes("has") ? (
                            // 当值为空时显示灰色的"无"
                            <span className="text-gray-500">
                              {value === null ||
                              value === undefined ||
                              value === "" ? (
                                <span className="text-gray-400">无</span>
                              ) : (
                                value
                              )}
                            </span>
                          ) : (
                            <div className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  value === null || value === undefined
                                    ? "bg-gray-300"
                                    : value
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <span className="ml-2 text-gray-500">
                                {value === null || value === undefined
                                  ? "未知"
                                  : value
                                  ? "是"
                                  : "否"}
                              </span>
                            </div>
                          )}
                        </dd>
                      </div>
                    );
                  })}
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
