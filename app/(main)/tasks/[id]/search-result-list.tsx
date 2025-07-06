"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SearchResultItem } from "./type";
import { Button } from "@/components/ui/button";

interface SearchResultListProps {
  searchResults: SearchResultItem[];
  onResultClick?: (result: SearchResultItem) => void;
}

const SearchResultList = ({
  searchResults,
  onResultClick,
}: SearchResultListProps) => {
  // 添加详情对话框状态管理
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    result: SearchResultItem | null;
  }>({
    open: false,
    result: null,
  });

  const openDetailDialog = (result: SearchResultItem) => {
    setDetailDialog({ open: true, result });
  };

  const closeDetailDialog = () => {
    setDetailDialog({ open: false, result: null });
  };

  if (searchResults === undefined || searchResults?.length === 0) {
    return (
      <div className="flex items-center justify-center w-auto h-full">
        <span className="text-gray-500 text-xs">暂无搜索结果</span>
      </div>
    );
  }

  return (
    <>
      {/* 表格展示 - 高度溢出时滚动 */}
        {/* 设置最小宽度以防止表格内容挤压 */}
          <Table>
            {/* 参考列表页样式的表头 */}
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-center p-1 whitespace-nowrap">
                  类型
                </TableHead>
                <TableHead className="text-center p-1 whitespace-nowrap">
                  置信度
                </TableHead>
                <TableHead className="text-center p-1 whitespace-nowrap">
                  经度
                </TableHead>
                <TableHead className="text-center p-1 whitespace-nowrap">
                  纬度
                </TableHead>
                <TableHead className="text-center p-1 whitespace-nowrap">查看</TableHead>
                <TableHead className="text-center p-1 whitespace-nowrap">
                  检测时间
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults === undefined || searchResults?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-4">
                    暂无搜索结果
                  </TableCell>
                </TableRow>
              )}
              {searchResults?.map((result) => (
                <TableRow
                  key={result.id}
                  className="cursor-pointer hover:bg-gray-50 border-b border-gray-200 group"
                >
                  {/* 检测时间 */}

                  {/* 类型 */}
                  <TableCell
                    className="px-1 font-medium text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap"
                    onClick={() => onResultClick?.(result)}
                  >
                    {result.target_label}
                  </TableCell>

                  {/* 置信度 */}
                  <TableCell
                    className="px-1 text-sm text-muted-foreground text-center p-2 border-x border-gray-200 whitespace-nowrap"
                    onClick={() => onResultClick?.(result)}
                  >
                    90%
                  </TableCell>

                  {/* 经度 */}
                  <TableCell
                    className="px-1 text-sm text-muted-foreground text-center p-2 border-x border-gray-200 whitespace-nowrap"
                    onClick={() => onResultClick?.(result)}
                  >
                    {Number(result.lng).toFixed(6)}
                  </TableCell>

                  {/* 纬度 */}
                  <TableCell
                    className="px-1 text-sm text-muted-foreground text-center p-2 border-x border-gray-200 whitespace-nowrap"
                    onClick={() => onResultClick?.(result)}
                  >
                    {Number(result.lat).toFixed(6)}
                  </TableCell>

                  {/* 图片预览按钮 - 修改为始终可见 */}
                  <TableCell className="text-center p-1 border-x border-gray-200">
                    <Button
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // 防止触发行点击事件
                        openDetailDialog(result);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 p-1 rounded transition-colors"
                    >
                      <ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-600 mx-auto" />
                    </Button>
                  </TableCell>
                  <TableCell
                    className="text-xs text-center p-1 border-x border-gray-200 whitespace-nowrap"
                    onClick={() => onResultClick?.(result)}
                  >
                    {result.created_at}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

      {/* 详情对话框 */}
      <Dialog open={detailDialog.open} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>检测结果详情</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 图片展示 - 优化容器和图片显示 */}
            <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative flex items-center justify-center">
              {detailDialog.result && (
                <Image
                  src={detailDialog.result.image_url}
                  alt={detailDialog.result.target_label}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority={true}
                  className="object-contain w-full h-full"
                  style={{ objectFit: "contain" }}
                  onError={(e) => {
                    console.log(
                      "图片加载失败:",
                      detailDialog.result?.image_url
                    );
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.src = "/placeholder-image.jpg";
                  }}
                />
              )}
            </div>

            {/* 详细信息 - 网格布局（按每行排序） */}
            {detailDialog.result && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* 第一行：目标类型和置信度 */}
                <div className="p-2">
                  <span className="text-gray-500">目标类型：</span>
                  <span className="font-medium">
                    {detailDialog.result.target_label}
                  </span>
                </div>
                <div className="p-2">
                  <span className="text-gray-500">置信度：</span>
                  <span className="font-medium">90%</span>
                </div>

                {/* 第二行：经度和纬度 */}
                <div className="p-2 bg-gray-50">
                  <span className="text-gray-500">经度：</span>
                  <span>{Number(detailDialog.result.lng).toFixed(6)}</span>
                </div>
                <div className="p-2 bg-gray-50">
                  <span className="text-gray-500">纬度：</span>
                  <span>{Number(detailDialog.result.lat).toFixed(6)}</span>
                </div>

                {/* 第三行：检测时间 */}
                <div className="p-2 col-span-2">
                  <span className="text-gray-500">检测时间：</span>
                  <span>{detailDialog.result.created_at}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchResultList;
