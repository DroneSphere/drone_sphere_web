"use client";

import {
  DetectResultItem,
  DetectSearchParams,
  fetchAllDetectResults,
} from "@/api/result/result";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

const columnHelper = createColumnHelper<DetectResultItem>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
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
];

export default function DronesPage() {
  const [searchParams, setSearchParams] = useState<DetectSearchParams | null>(
    null
  );
  const query = useQuery({
    queryKey: ["detects"],
    queryFn: () => {
      return fetchAllDetectResults(searchParams);
    },
  });

  const selectOptions = [
    { label: "士兵", value: "soldier" },
    { label: "坦克", value: "tank" },
    { label: "车辆", value: "car" },
  ];

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4 mb-4">
      <div className="mb-4 flex gap-4 justify-start items-center">
        <Input
          type="text"
          placeholder="任务名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <Select>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="检测目标分类" />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    class: [option.value],
                  }))
                }
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !searchParams?.createAtBegin && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {searchParams?.createAtBegin
                ? format(new Date(searchParams.createAtBegin), "PPP")
                : "开始时间"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                searchParams?.createAtBegin
                  ? new Date(searchParams.createAtBegin)
                  : undefined
              }
              onSelect={(date) =>
                setSearchParams((prev) => ({
                  ...prev,
                  createAtBegin: date ? format(date, "yyyy-MM-dd") : undefined,
                }))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !searchParams?.createAtEnd && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {searchParams?.createAtEnd
                ? format(new Date(searchParams.createAtEnd), "PPP")
                : "结束时间"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                searchParams?.createAtEnd
                  ? new Date(searchParams.createAtEnd)
                  : undefined
              }
              onSelect={(date) =>
                setSearchParams((prev) => ({
                  ...prev,
                  createAtEnd: date ? format(date, "yyyy-MM-dd") : undefined,
                }))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button onClick={() => query.refetch()} disabled={query.isLoading}>
          搜索
        </Button>
      </div>
      {query.isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      {query.isSuccess && (
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
      {
        // 无数据
        !query.isPending && query.isSuccess && query.data?.length === 0 && (
          <div className="text-center text-gray-500">暂无数据</div>
        )
      }
      {
        // 加载失败
        query.isError && <div className="text-center">加载失败</div>
      }
    </div>
  );
}
