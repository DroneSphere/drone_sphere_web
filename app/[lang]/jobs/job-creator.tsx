"use client";

import { createJob, fetchJobCreateionOptions } from "@/api/job/request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "@radix-ui/react-select";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "必填" }),
  description: z.string().optional(),
  areaId: z.string().min(1, { message: "必填" }),
});

export function JobCreator() {
  const router = useRouter();
  // const [open, setOpen] = useState(false);
  const optionsQuery = useQuery({
    queryKey: ["job", "creation", "options"],
    queryFn: fetchJobCreateionOptions,
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      console.log("createMutation", data);
      return createJob({
        area_id: parseInt(data.areaId),
        description: data.description,
        name: data.name,
      });
    },
    onSuccess: (data) => {
      console.log("createMutation onSuccess", data);
      router.push("/jobs/creation/" + data);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      areaId: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("onSubmit", data);
    createMutation.mutate(data);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>创建飞行任务</Button>
      </DialogTrigger>

      <DialogContent className="min-w-[320px] sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">新建飞行任务</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入任务名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    任务名称用于标识和区分不同的飞行任务。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入任务描述" {...field} />
                  </FormControl>
                  <FormDescription>
                    任务描述用于提供有关任务的更多信息。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>选择飞行区域</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={optionsQuery.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择飞行区域" />
                      </SelectTrigger>
                      <SelectContent>
                        {optionsQuery.data?.areas.map((area) => (
                          <SelectItem
                            key={area.id}
                            value={area.id.toString()}
                            className="flex items-center"
                          >
                            <div className="font-semibold">{area.name}</div>
                            {field.value != area.id.toString() && (
                              <div className="text-muted-foreground text-sm">
                                {area.description}
                              </div>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    请选择一个飞行区域进行任务规划。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 底部操作栏 */}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  disabled={createMutation.isPending}
                  variant="outline"
                  className="px-6"
                >
                  取消
                </Button>
              </DialogClose>
              <Button
                disabled={createMutation.isPending}
                type="submit"
                className="px-6 bg-primary hover:bg-primary/90"
              >
                创建任务
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
