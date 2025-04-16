// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/models/gateways/detail-dialog.tsx
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
import { getGatewayById, updateGateway } from "./request";

// 定义可编辑字段的表单模式
const formSchema = z.object({
  gateway_model_name: z.string().min(1, "名称不能为空"),
  gateway_model_description: z.string().optional(),
  gateway_model_domain: z.number().optional(),
  gateway_model_type: z.number().optional(),
  gateway_model_sub_type: z.number().optional(),
});

// 定义键值映射，用于显示字段的中文名称
const keyMappings: Record<string, string> = {
  gateway_model_id: "ID",
  gateway_model_name: "名称",
  gateway_model_description: "描述",
  gateway_model_domain: "领域",
  gateway_model_type: "主型号",
  gateway_model_sub_type: "子型号",
  created_time: "创建时间",
  updated_time: "更新时间",
  state: "状态",
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

  // 获取网关型号详细信息的查询
  const query = useQuery({
    queryKey: ["models", "gateways", props.id],
    queryFn: () => {
      return getGatewayById(props.id);
    },
    enabled: open, // 只在对话框打开时获取数据
  });

  // 处理表单提交的逻辑
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return updateGateway(props.id, data);
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["models", "gateways"],
      });
      setOpen(false);
    },
  });

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gateway_model_name: props.name ?? "",
      gateway_model_description: props.description ?? "",
    },
  });

  // 当获取到详细数据后更新表单默认值
  if (query.isSuccess && query.data) {
    form.setValue("gateway_model_name", query.data.gateway_model_name || "");
    form.setValue("gateway_model_description", query.data.gateway_model_description || "");
    form.setValue("gateway_model_domain", query.data.gateway_model_domain);
    form.setValue("gateway_model_type", query.data.gateway_model_type);
    form.setValue("gateway_model_sub_type", query.data.gateway_model_sub_type);
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
              <DialogTitle>网关型号详细信息 - {query.data.gateway_model_name}</DialogTitle>
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
                      {keyMappings["gateway_model_name"] || "名称"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_model_name"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                placeholder="请输入网关型号名称"
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
                      {keyMappings["gateway_model_description"] || "描述"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_model_description"
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
                      {keyMappings["gateway_model_domain"] || "领域"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_model_domain"
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
                      {keyMappings["gateway_model_type"] || "主型号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_model_type"
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
                      {keyMappings["gateway_model_sub_type"] || "子型号"}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <FormField
                        control={form.control}
                        name="gateway_model_sub_type"
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

                  {/* 非可编辑字段 */}
                  {Object.entries(query.data).map(([key, value]) => {
                    // 跳过可编辑字段，因为已经在上面单独处理了
                    if (
                      key === "gateway_model_name" ||
                      key === "gateway_model_description" ||
                      key === "gateway_model_domain" ||
                      key === "gateway_model_type" ||
                      key === "gateway_model_sub_type"
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
