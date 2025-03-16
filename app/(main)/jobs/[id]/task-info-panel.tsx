import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface TaskInfoPanelProps {
  isEditing: boolean;
  isCreating: boolean;
  form: UseFormReturn<{
    name?: string | undefined;
    description?: string | undefined;
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
  const [collapsed, setCollapsed] = useState<boolean>(false);
  return (
    <div className="space-y-2 p-3 border rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">任务信息</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.preventDefault();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </Button>
      </div>
      {!collapsed && (
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
                      <Input placeholder="请输入任务描述" {...field} />
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
                <div className="font-medium">任务描述</div>
                <div className="text-sm text-gray-700">
                  {form.getValues("description") || "无描述"}
                </div>
              </div>
              <div className="mb-4">
                <div className="font-medium">区域</div>
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
