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
import Image from "next/image";
import { useState } from "react";
import { SearchResultItem } from "./types";

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

  const closeDetailDialog = () => {
    setDetailDialog({ open: false, result: null });
  };

  if (searchResults.length === 0) {
    return (
      <div className="flex items-center justify-center w-auto h-full">
        <span className="text-gray-500 text-sm">暂无搜索结果</span>
      </div>
    );
  }

  return (
    <>
      {/* 设置最小宽度以防止表格内容挤压 */}
      <Table>
        {/* 参考列表页样式的表头 */}
        <TableHeader className="bg-gray-100">
          <TableRow className="border-b border-gray-200">
            {/* 为每列设置最小宽度并防止文本换行 */}
            <TableHead className="text-center p-1 whitespace-nowrap">
              ID
            </TableHead>
            <TableHead className="text-center p-1 whitespace-nowrap">
              检测时间
            </TableHead>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {searchResults.map((result) => (
            <TableRow
              key={result.id}
              className="cursor-pointer hover:bg-gray-50 border-b border-gray-200 group"
              onClick={
                () => setDetailDialog({ open: true, result: result })
              }
            >
              {/* ID */}
              <TableCell
                className="px-1 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap"
                onClick={() => onResultClick?.(result)}
              >
                {result.code}
              </TableCell>

              {/* 检测时间 */}
              <TableCell
                className="px-1 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap"
                onClick={() => onResultClick?.(result)}
              >
                {result.created_at}
              </TableCell>

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
                {result.confidence ? `${(result.confidence * 100).toFixed(2)}%` : "N/A"}
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
            <div
              className="w-full bg-black rounded-md overflow-hidden relative cursor-pointer group"
              onClick={() => window.open(detailDialog.result?.image_url, "_blank")}
              style={{ paddingBottom: '56.25%' }}
            >
              {detailDialog.result && (
                <>
                  <Image
                    src={detailDialog.result.image_url}
                    alt={detailDialog.result.target_label}
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority={true}
                    className="object-contain w-full h-full group-hover:opacity-80 transition-opacity absolute inset-0"
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
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                    <span className="text-white text-sm font-medium">
                      点击查看大图
                    </span>
                  </div>
                </>
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
                  <span className="font-medium">
                    {detailDialog.result.confidence ? `${(detailDialog.result.confidence * 100).toFixed(2)}%` : "N/A"}
                  </span>
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
