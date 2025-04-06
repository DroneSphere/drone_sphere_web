import { fetchResultById } from "./requests";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { View } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

// key的中文映射
const keyMappings: Record<string, string> = {
  id: "ID",
  job_id: "任务ID",
  job_name: "任务名称",
  wayline_id: "航线ID",
  drone_id: "无人机ID",
  object_type: "目标类型",
  object_label: "目标标签",
  object_confidence: "置信度",
  created_at: "创建时间",
};

export default function ViewDialog(
  props: Readonly<{
    id: number;
  }>
) {
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["result", props.id],
    queryFn: () => fetchResultById(props.id),
    enabled: open, // 只在对话框打开时获取数据
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
        >
          <View className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        {query.isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {query.isError && (
          <div className="text-center py-4 text-red-500">
            <p>发生错误: {query.error.message}</p>
            <p>请稍后再试</p>
          </div>
        )}
        {query.isSuccess && query.data && (
          <DialogHeader>
            <DialogTitle>检测结果详情</DialogTitle>
            <div className="mt-8 flex gap-4">
              {/* 左侧图片 */}
              <div className="flex-1 relative min-h-[400px]">
                <Image
                  src={query.data.image_url}
                  alt="检测结果图片"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-lg"
                />
              </div>
              {/* 右侧信息 */}
              <div className="flex-1">
                <dl className="divide-y divide-gray-200">
                  {Object.entries(query.data).map(([key, value]) => {
                    // 跳过图片URL和position、coordinate等复杂类型
                    if (key === "image_url" || typeof value === "object") return null;
                    
                    return (
                      <div key={key} className="py-2 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          {keyMappings[key] || key}
                        </dt>
                        <dd className="text-sm text-gray-900 col-span-2">
                          {key === "object_confidence" 
                            ? `${(value * 100).toFixed(2)}%`
                            : String(value)}
                        </dd>
                      </div>
                    );
                  })}
                  {/* 坐标信息 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">坐标</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      经度: {query.data.coordinate.lng}°, 纬度: {query.data.coordinate.lat}°
                    </dd>
                  </div>
                  {/* 位置信息 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">框选位置</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      X: {query.data.position.x}, Y: {query.data.position.y},
                      宽度: {query.data.position.w}, 高度: {query.data.position.h}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}