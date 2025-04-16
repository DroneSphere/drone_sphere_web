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

// 注意：由于我们现在直接使用特定字段，不再需要通用映射
// 旧的key映射被移除

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
            <div className="pt-4 flex gap-4">
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
                  {/* ID */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {String(query.data.id)}
                    </dd>
                  </div>
                  
                  {/* 任务名称 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">任务名称</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {String(query.data.job_name)}
                    </dd>
                  </div>
                  
                  {/* 目标标签 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">目标标签</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {String(query.data.object_label)}
                    </dd>
                  </div>
                  
                  {/* 置信度 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">置信度</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {`${(query.data.object_confidence * 100).toFixed(2)}%`}
                    </dd>
                  </div>
                  
                  {/* 坐标信息 - 经度 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">经度</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.coordinate.lng.toFixed(6)}
                    </dd>
                  </div>
                  
                  {/* 坐标信息 - 纬度 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">纬度</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.coordinate.lat.toFixed(6)}
                    </dd>
                  </div>
                  
                  {/* 检测结果 - X坐标 */}
                  {/* <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">检测结果 - X坐标</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.position.x}
                    </dd>
                  </div> */}
                  
                  {/* 检测结果 - Y坐标 */}
                  {/* <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">检测结果 - Y坐标</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.position.y}
                    </dd>
                  </div> */}
                  
                  {/* 检测结果 - 宽度 */}
                  {/* <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">检测结果 - 宽度</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.position.w}
                    </dd>
                  </div> */}
                  
                  {/* 检测结果 - 高度 */}
                  {/* <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">检测结果 - 高度</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {query.data.position.h}
                    </dd>
                  </div> */}
                  
                  {/* 创建时间 */}
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {String(query.data.created_at)}
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