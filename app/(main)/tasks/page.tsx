"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalendarIcon, Search, View } from "lucide-react";
import { useState } from "react";
import { JobSearchParams } from "../jobs/types";
import { getTasks } from "./request";
import { TaskItemResult, TaskStatus, TaskStatusMap } from "./type";

const columnHelper = createColumnHelper<TaskItemResult>();
const columns = [
  columnHelper.accessor("job_id", {
    header: () => "任务ID",
  }),
  columnHelper.accessor("job_name", {
    header: "任务名称",
  }),
  columnHelper.accessor("area_name", {
    header: "区域名称",
  }),
  columnHelper.accessor("job_status", {
    header: "任务状态",
    cell: (info) => {
      const status = info.getValue();
      const statusText = TaskStatusMap[status];
      let indicator;
      switch (status) {
        case TaskStatus.NOT_STARTED:
          indicator = <div className="w-3 h-3 bg-blue-500 rounded-full" />;
          break;
        case TaskStatus.IN_PROGRESS:
          indicator = <div className="w-3 h-3 bg-green-500 rounded-full" />;
          break;
        case TaskStatus.COMPLETED:
          indicator = <div className="w-3 h-3 bg-gray-500 rounded-full" />;
          break;
        case TaskStatus.FAILED:
          indicator = <div className="w-3 h-3 bg-red-500 rounded-full" />;
          break;
      }
      return (
        <div className="flex items-center space-x-2 justify-center">
          {indicator}
          <span className="ml-2">{statusText}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("schedule_time", {
    header: "计划时间",
  }),
  columnHelper.accessor("job_description", {
    header: "任务描述",
    cell: (info) => (
      <HoverCard>
        <HoverCardTrigger>
          <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap">
            {info.getValue() || <span className="text-gray-400">无</span>}
          </div>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="text-left max-w-196">
            {info.getValue() || <span className="text-gray-400">无</span>}
          </div>
        </HoverCardContent>
      </HoverCard>
    ),
  }),
  // 操作列
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">操作</div>,
    cell: (row) => (
      <div className="flex justify-center space-x-2">
        <Button
          variant="secondary"
          className="h-8 px-2 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center"
          onClick={() => {
            window.location.href = `/tasks/${row.row.original.job_id}`;
          }}
        >
          <View className="h-4 w-4 mr-1" />
          查看
        </Button>
      </div>
    ),
  }),
];

export default function Page() {
  // 使用一个状态来存储搜索参数
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(
    null
  );

  // 查询配置
  const query = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      // 包装一下查询函数，确保参数类型正确
      return getTasks(searchParams);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4 mb-4">
      {/* 搜索表单 */}
      <div className="mb-4 flex gap-4 items-center max-w-full overflow-x-auto">
        <Input
          type="text"
          placeholder="任务名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({ ...prev, job_name: e.target.value }))
          }
        />
        <Input
          type="text"
          placeholder="区域名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchParams((prev) => ({ ...prev, area_name: e.target.value }))
          }
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-fit justify-start text-left font-normal",
                !searchParams?.schedule_time_start && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {searchParams?.schedule_time_start
                ? format(new Date(searchParams.schedule_time_start), "PPP")
                : "开始时间"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                searchParams?.schedule_time_start
                  ? new Date(searchParams.schedule_time_start)
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
                "w-fit justify-start text-left font-normal",
                !searchParams?.schedule_time_end && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {searchParams?.schedule_time_end
                ? format(new Date(searchParams.schedule_time_end), "PPP")
                : "结束时间"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                searchParams?.schedule_time_end
                  ? new Date(searchParams.schedule_time_end)
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
        <Button
          onClick={() => {
            query.refetch();
          }}
          disabled={query.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
      </div>

      {/* 加载 */}
      {query.isPending && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      {/* 成功 */}
      {query.isSuccess && query.data && (
        <div className="my-4 max-w-full overflow-x-auto">
          <Table className="border border-gray-200 rounded-md border-collapse">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-300">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn("text-center border border-gray-300 p-2"
                        ,header.id === "job_description" && "w-[35%] min-w-[300px]"
                        ,header.id === "actions" && "w-[150px]"
                      )}
                    >
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
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 border-b border-gray-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center p-2 border-x border-gray-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {query.isSuccess && (!query.data || query.data.length === 0) && (
        <div className="text-center text-gray-500">暂无数据</div>
      )}
      {query.isError && (
        <div className="text-center text-red-500">
          加载失败: {query.error.message}
        </div>
      )}
    </div>
  );
}
