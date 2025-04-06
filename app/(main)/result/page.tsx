"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { fetchResults } from "./requests";
import { ResultItem, ResultQuery } from "./types";
import ViewDialog from "./view-dialog";

// 定义表格列
const columnHelper = createColumnHelper<ResultItem>();
const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("job_name", {
    header: "任务名称",
  }),
  columnHelper.accessor("target_label", {
    header: "检测目标分类",
  }),
  columnHelper.accessor("lng", {
    header: "经度",
  }),
  columnHelper.accessor("lat", {
    header: "纬度",
  }),
  columnHelper.accessor("created_at", {
    header: "检测时间",
  }),
  // 添加操作列
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">操作</div>,
    cell: (info) => (
      <div className="flex justify-center space-x-2">
        <ViewDialog id={info.row.original.id} />
      </div>
    ),
  }),
];

export default function ResultPage() {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<ResultQuery>({
    page: 1,
    page_size: 10,
  });

  // 使用 React Query 获取数据
  const { data, isLoading, isError } = useQuery({
    queryKey: ["results", searchParams],
    queryFn: () => fetchResults(searchParams),
  });

  // 初始化表格
  const table = useReactTable({
    data: data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4 mb-4">
      <div className="mb-4 flex gap-4 justify-start items-center">
        <Input
          type="text"
          placeholder="任务ID"
          className="w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({
              ...prev,
              job_id: e.target.value ? parseInt(e.target.value) : undefined,
            }))
          }
        />
        <Select
          onValueChange={(value) =>
            setSearchParams((prev) => ({
              ...prev,
              object_type: parseInt(value),
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="检测目标类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">士兵</SelectItem>
            <SelectItem value="2">坦克</SelectItem>
            <SelectItem value="3">车辆</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={() => setSearchParams((prev) => ({ ...prev }))} 
          disabled={isLoading}
        >
          搜索
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <Table className="border border-gray-200 rounded-md">
          <TableHeader className="bg-gray-100">
            <TableRow>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="text-center text-gray-500 py-8">暂无数据</div>
      )}

      {isError && (
        <div className="text-center text-red-500 py-8">加载失败</div>
      )}

      {/* 分页 TODO: 可以使用组件库的分页组件替换 */}
      {data && data.total > 0 && (
        <div className="flex justify-end items-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() =>
              setSearchParams((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={searchParams.page <= 1}
          >
            上一页
          </Button>
          <span className="mx-2">
            第 {searchParams.page} 页，共 {Math.ceil(data.total / searchParams.page_size)} 页
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setSearchParams((prev) => ({
                ...prev,
                page: prev.page + 1,
              }))
            }
            disabled={
              searchParams.page >= Math.ceil(data.total / searchParams.page_size)
            }
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
