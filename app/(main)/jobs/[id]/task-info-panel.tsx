import {
  FormControl,
  FormDescription,
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
  setPath: (path: AMap.LngLat[]) => void;
  AMapRef: React.MutableRefObject<typeof AMap | null>;
}

export default function TaskInfoPanel({
  isEditing,
  isCreating,
  form,
  optionsQuery,
  dataQuery,
  setPath,
  AMapRef,
}: TaskInfoPanelProps) {
  // 移除折叠状态，内容始终可见
  
  // 处理时间选择的逻辑
  const handleTimeChange = (type: 'hour' | 'minute' | 'second', value: string) => {
    const currentTime = form.getValues('schedule_time') || '00:00:00';
    const [hour, minute, second] = currentTime.split(':');

    let newTime = '';
    if (type === 'hour') {
      newTime = `${value.padStart(2, '0')}:${minute}:${second}`;
    } else if (type === 'minute') {
      newTime = `${hour}:${value.padStart(2, '0')}:${second}`;
    } else {
      newTime = `${hour}:${minute}:${value.padStart(2, '0')}`;
    }

    form.setValue('schedule_time', newTime);
  };

  // 获取当前选择的时间值
  const getCurrentTimeValues = () => {
    const currentTime = form.getValues('schedule_time') || '00:00:00';
    const [hour, minute, second] = currentTime.split(':');
    return { hour, minute, second };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">基本信息</div>
      </div>
      {(
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
                    <FormDescription>
                      该名称将用于对任务进行标识和说明，可以是任何信息。
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
                      <Textarea placeholder="请输入任务描述" {...field} className="resize-none" />
                    </FormControl>
                    <FormDescription>
                      描述用于对该任务进行标识和说明，可以是任何信息。
                    </FormDescription>
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
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => handleTimeChange('hour', value)}
                        defaultValue={getCurrentTimeValues().hour}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="小时" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}时
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) => handleTimeChange('minute', value)}
                        defaultValue={getCurrentTimeValues().minute}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="分钟" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}分
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) => handleTimeChange('second', value)}
                        defaultValue={getCurrentTimeValues().second}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="秒" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}秒
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormDescription>
                      设置任务的计划执行时间（24小时制）
                    </FormDescription>
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
                          // 设置当前区域路径
                          setPath(
                            optionsQuery.data?.areas
                              .find((e) => e.id === parseInt(value))
                              ?.points.map((p) => {
                                return new AMapRef.current!.LngLat(
                                  p.lng,
                                  p.lat
                                );
                              }) || []
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择区域" />
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
      )}
    </div>
  );
}
