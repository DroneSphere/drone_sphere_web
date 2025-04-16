// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/models/drones/detail-dialog.tsx
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
import { getModelById, updateModel } from "./request";

// 定义可编辑字段的表单模式
const formSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string().optional(),
  domain: z.number().optional(),
  type: z.number().optional(),
  sub_type: z.number().optional(),
  gateway_name: z.string().optional(),
});

// 定义键值映射，用于显示字段的中文名称
const keyMappings: Record<string, string> = {
  id: "ID",
  name: "名称",
  domain: "领域",
  type: "主型号",
  sub_type: "子型号",
  gateway_name: "网关设备",
  gateway_id: "网关ID",
  gateway_description: "网关描述",
  gimbals: "可搭载云台",
  description: "描述",
};

export default function DetailDialog(
  props: Readonly<{
    id: number;
    name?: string;
    description?: string;
  }>
) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 获取无人机型号详细信息的查询
  const query = useQuery({
    queryKey: ["models", "drones", props.id],
    queryFn: () => {
      return getModelById(props.id);
    },
    enabled: open, // 只在对话框打开时获取数据
  });

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return updateModel(props.id, data);
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["models", "drones"],
      });
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.name ?? "",
      description: props.description ?? "",
    },
  });

  // 当获取到详细数据后更新表单默认值
  if (query.isSuccess && query.data) {
    form.setValue("name", query.data.name || "");
    form.setValue("description", query.data.description || "");
    form.setValue("domain", query.data.domain);
    form.setValue("type", query.data.type);
    form.setValue("sub_type", query.data.sub_type);
    form.setValue("gateway_name", query.data.gateway_name || "");
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
          <Edit className="h-4 w-4 mr-1" />
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
              <DialogTitle>无人机型号详细信息 - {query.data.name}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* 表单内容部分 */}
                <div className="my-4 divide-y divide-gray-200">
                  {/* 可编辑字段 - 名称 */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["name"] || "名称"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                placeholder="请输入无人机型号名称"
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
                              <Input placeholder="请输入描述" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </dd>
                  </div>

                  {/* 可编辑字段 - 领域 */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["domain"] || "领域"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="请输入领域" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </dd>
                  </div>

                  {/* 可编辑字段 - 主型号 */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["type"] || "主型号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="请输入主型号" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </dd>
                  </div>

                  {/* 可编辑字段 - 子型号 */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["sub_type"] || "子型号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="sub_type"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="请输入子型号" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </dd>
                  </div>

                  {/* 可编辑字段 - 网关设备 */}
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings["gateway_name"] || "网关设备"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_name"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input placeholder="请输入网关设备" {...field} />
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
                      key === "name" ||
                      key === "description" ||
                      key === "domain" ||
                      key === "type" ||
                      key === "sub_type" ||
                      key === "gateway_name"
                    ) {
                      return null;
                    }

                    // 特殊处理 gimbals 数组
                    if (key === "gimbals") {
                      return (
                        <div
                          key={key}
                          className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"
                        >
                          <dt className="text-sm font-medium text-gray-500">
                            {keyMappings[key] || key}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {Array.isArray(value) && value.length > 0 ? (
                              <div className="flex flex-col">
                                {value.map((gimbal: any) => (
                                  <div key={gimbal.id} className="text-left">
                                    {gimbal.name}
                                    {gimbal.description && (
                                      <span className="text-gray-500 ml-2">
                                        ({gimbal.description})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">无</span>
                            )}
                          </dd>
                        </div>
                      );
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
                          <span className="text-gray-500">
                            {value === null ||
                            value === undefined ||
                            value === "" ? (
                              <span className="text-gray-400">无</span>
                            ) : (
                              value
                            )}
                          </span>
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
