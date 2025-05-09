import {
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
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar1 } from "lucide-react";
import { JobAction, JobState } from "./job-state";

interface TaskInfoPanelProps {
  isEditing: boolean;
  isCreating: boolean;
  form: UseFormReturn<{
    name?: string | undefined;
    description?: string | undefined;
    schedule_time?: string | undefined;
    area_id?: number | undefined;
  }>;
  optionsQuery: {
    data?: {
      areas: Array<{
        id: number;
        name: string;
        points: Array<{
          lng: number;
          lat: number;
        }>;
      }>;
    };
  };
  dataQuery: {
    data?: {
      area?: {
        name: string;
      };
    };
  };
  // 替换setPath为state和dispatch
  state: JobState;
  dispatch: React.Dispatch<JobAction>; // 使用更具体的Action类型会更好
  AMapRef: React.MutableRefObject<typeof AMap | null>;
}

export default function TaskInfoPanel({
  isEditing,
  isCreating,
  form,
  optionsQuery,
  dataQuery,
  state,
  dispatch,
  AMapRef,
}: TaskInfoPanelProps) {
  console.log("TaskInfoPanel props", {
    isEditing,
    isCreating,
    form,
    optionsQuery,
    dataQuery,
    state,
    dispatch,
    AMapRef,
  });
  

  // 处理时间选择的逻辑
  const handleTimeChange = (
    type: "year" | "month" | "day" | "hour" | "minute",
    value: string
  ) => {
    // 获取当前的日期时间值
    const { year, month, day, hour, minute } = getCurrentTimeValues();

    // 根据修改的类型更新对应的时间值
    let newDate = "";
    if (type === "year") {
      newDate = `${value}-${month}-${day} ${hour}:${minute}:00`;
    } else if (type === "month") {
      newDate = `${year}-${value}-${day} ${hour}:${minute}:00`;
    } else if (type === "day") {
      newDate = `${year}-${month}-${value} ${hour}:${minute}:00`;
    } else if (type === "hour") {
      newDate = `${year}-${month}-${day} ${value.padStart(2, "0")}:${minute}:00`;
    } else if (type === "minute") {
      newDate = `${year}-${month}-${day} ${hour}:${value.padStart(2, "0")}:00`;
    } else if (type === "second") {
      newDate = `${year}-${month}-${day} ${hour}:${minute}:${value.padStart(2, "0")}`;
    } else {
      newDate = `${year}-${month}-${day} ${hour}:${minute}:00`;
    }

    form.setValue("schedule_time", newDate);
  };

  // 解析ISO日期字符串为Date对象
  const parseISODate = (isoDateString?: string): Date | undefined => {
    if (!isoDateString) return undefined;
    try {
      // 从ISO格式解析日期
      return new Date(isoDateString);
    } catch {
      return undefined;
    }
  };

  // 处理日历选择日期的函数
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // 获取当前的时分值
    const { hour, minute } = getCurrentTimeValues();

    // 格式化日期为YYYY-MM-DD格式
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // 更新表单值
    const newDate = `${year}-${month}-${day} ${hour}:${minute}`;
    form.setValue("schedule_time", newDate);
  };

  // 获取当前选择的时间值
  const getCurrentTimeValues = () => {
    // 默认使用当前日期和时间
    const today = new Date();
    const defaultYear = today.getFullYear().toString();
    const defaultMonth = (today.getMonth() + 1).toString().padStart(2, "0");
    const defaultDay = today.getDate().toString().padStart(2, "0");
    const defaultHour = today.getHours().toString().padStart(2, "0");
    const defaultMinute = today.getMinutes().toString().padStart(2, "0");

    // 如果 schedule_time 为空，则返回当前时间
    if (!form.getValues("schedule_time")) {
      // 设置默认时间到表单
      const defaultDateTime = `${defaultYear}-${defaultMonth}-${defaultDay} ${defaultHour}:${defaultMinute}`;
      form.setValue("schedule_time", defaultDateTime);

      return {
        year: defaultYear,
        month: defaultMonth,
        day: defaultDay,
        hour: defaultHour,
        minute: defaultMinute,
      };
    }

    // 从表单获取当前值
    const currentDateTime = form.getValues("schedule_time")!;

    try {
      // 如果是旧格式（HH:MM:SS），转换为新格式
      if (currentDateTime.includes(":") && !currentDateTime.includes("-")) {
        const [hour, minute] = currentDateTime.split(":");
        return {
          year: defaultYear,
          month: defaultMonth,
          day: defaultDay,
          hour: hour || defaultHour,
          minute: minute || defaultMinute,
        };
      }

      // 解析日期时间格式
      const [datePart, timePart] = currentDateTime.includes("T")
        ? currentDateTime.split("T")
        : currentDateTime.split(" ");
      const [year, month, day] = datePart.split("-");
      const [hour, minute] = timePart.split(":");

      return {
        year: year || defaultYear,
        month: month || defaultMonth,
        day: day || defaultDay,
        hour: hour || defaultHour,
        minute: minute || defaultMinute,
      };
    } catch {
      // 解析出错时返回当前时间
      const defaultDateTime = `${defaultYear}-${defaultMonth}-${defaultDay} ${defaultHour}:${defaultMinute}`;
      form.setValue("schedule_time", defaultDateTime);

      return {
        year: defaultYear,
        month: defaultMonth,
        day: defaultDay,
        hour: defaultHour,
        minute: defaultMinute,
      };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">基本信息</div>
      </div>
      {
        <>
          {isEditing || isCreating ? (
            <>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入任务名称" {...field} />
                    </FormControl>
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
                    </FormControl>{" "}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schedule_time"
                render={() => (
                  <FormItem>
                    <FormLabel>计划执行时间</FormLabel>

                    {/* 时间显示文本框 - 只读模式 */}
                    {/* <FormControl> */}
                    {/* <Input
                        placeholder="选择器选择的时间将在此处显示"
                        value={
                          form.getValues("schedule_time")
                            ? new Date(
                                form.getValues("schedule_time") || ""
                              ).toLocaleString("zh-CN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""
                        }
                        readOnly={true}
                        className="mb-2 bg-gray-50"
                      /> */}
                    {/* </FormControl> */}

                    {/* 时间选择器 */}
                    <div className="flex gap-1 w-full">
                      {/* 日期选择器 */}
                      <div className="flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full font-normal"
                            >
                              <Calendar1 className="mr-1 h-4 w-4" />
                              <span>
                                {form.getValues("schedule_time")
                                  ? new Date(
                                      form.getValues("schedule_time") || ""
                                    ).toLocaleDateString("zh-CN", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    })
                                  : "选择日期"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={parseISODate(
                                form.getValues("schedule_time")
                              )}
                              onSelect={handleDateSelect}
                              disabled={(date) =>
                                date < new Date()
                              } /* 禁用过去的日期 */
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* 小时选择器 */}
                      <Select
                        onValueChange={(value) =>
                          handleTimeChange("hour", value)
                        }
                        value={getCurrentTimeValues().hour}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="时" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}时
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* 分钟选择器 */}
                      <Select
                        onValueChange={(value) =>
                          handleTimeChange("minute", value)
                        }
                        value={getCurrentTimeValues().minute}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="分" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}分
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>区域</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          // 设置当前区域路径，使用dispatch替代setPath
                          const path =
                            optionsQuery.data?.areas
                              .find((e) => e.id === parseInt(value))
                              ?.points.map((p) => {
                                return new AMapRef.current!.LngLat(
                                  p.lng,
                                  p.lat
                                );
                              }) || [];

                          // 使用dispatch来更新path状态
                          dispatch({ type: "SET_PATH", payload: path });
                        }}
                      >
                        <SelectTrigger>
                          {/* <SelectValue placeholder="请选择区域" /> */}
                          {field.value ? (
                            <SelectValue
                              placeholder={
                                optionsQuery.data?.areas.find(
                                  (e) => e.id === field.value
                                )?.name || "请选择区域"
                              }
                            />
                          ) : (
                            <SelectValue placeholder="请选择区域" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {optionsQuery.data?.areas.map((e) => (
                            <SelectItem key={e.id} value={e.id.toString()}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm font-medium">任务名称</div>
                <div className="text-sm text-gray-700">
                  {form.getValues("name") || "无名称"}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm font-medium">任务描述</div>
                <div className="text-sm text-gray-700">
                  {form.getValues("description") || "无描述"}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm font-medium">区域</div>
                <div className="text-sm text-gray-700">
                  {dataQuery.data?.area?.name || "无区域"}
                </div>
              </div>
            </>
          )}
        </>
      }
    </div>
  );
}
