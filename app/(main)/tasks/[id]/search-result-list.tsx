"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Compass, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SearchResultItem } from "./type";

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

  if (searchResults.length === 0) {
    return (
      <div className="flex items-center justify-center w-auto h-full">
        <span className="text-gray-500 text-xs">暂无搜索结果</span>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm font-medium mb-3">搜索结果</div>
      {searchResults.map((result, index) => (
        <div key={result.id}>
          {/* 列表项 */}
          <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md cursor-pointer group">
            <div
              className="flex justify-between items-center w-full pr-2"
              onClick={() => onResultClick?.(result)}
            >
              {/* 左侧区域：目标标签和置信度 */}
              <div className="flex flex-col items-start">
                {/* 目标标签 */}
                <div className="font-medium text-xs">{result.target_label}</div>

                {/* 置信度显示 - 直接文字 */}
                <div className="text-[10px] text-muted-foreground">
                  置信度: 90%
                </div>
              </div>

              {/* 右侧区域：坐标信息 */}
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                <Compass className="h-3 w-3" />
                <span className="truncate">
                  {Number(result.lng).toFixed(4)},{" "}
                  {Number(result.lat).toFixed(4)}
                </span>
              </div>
            </div>

            {/* 图片预览按钮 */}
            <button
              onClick={() => openDetailDialog(result)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mx-2"
            >
              <ImageIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* 分隔线，最后一个项目不添加 */}
          {index < searchResults.length - 1 && <Separator />}
        </div>
      ))}

      {/* 详情对话框 */}
      <Dialog open={detailDialog.open} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>检测结果详情</DialogTitle>
            <div>{detailDialog.result?.image_url}</div>
          </DialogHeader>

          <div className="space-y-4">
            {/* 图片展示 */}
            <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative">
              {detailDialog.result && (
                <Image
                  src={detailDialog.result.image_url}
                  alt={detailDialog.result.target_label}
                  fill={true}
                  sizes="100vw"
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

            {/* 详细信息 */}
            {detailDialog.result && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">目标类型：</span>
                  <span>{detailDialog.result.target_label}</span>
                </div>
                <div>
                  <span className="text-gray-500">经度：</span>
                  <span>{Number(detailDialog.result.lng).toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-500">纬度：</span>
                  <span>{Number(detailDialog.result.lat).toFixed(6)}</span>
                </div>
                <div>
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
