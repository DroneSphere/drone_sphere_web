"use client";

import { deleteJob } from "@/app/(main)/jobs/report/[id]/request";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CalendarIcon,
  Edit,
  PlusCircle,
  Search,
  Trash,
  View,
} from "lucide-react";
import { useMemo, useState } from "react";
import { JobItemResult, JobSearchParams } from "./types";
import { fetchAllJobs } from "./requests";
import { useRouter } from "next/navigation";

const columnHelper = createColumnHelper<JobItemResult>();

export default function JobListPage() {
  const router = useRouter();
  // 使用一个状态来存储搜索参数
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(
    null
  );
  const query = useQuery({
    queryKey: ["jobs"],
    queryFn: () => {
      return fetchAllJobs(searchParams);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return deleteJob(id);
    },
    onSuccess: () => {
      query.refetch();
    },
  });

  const columns = [
    columnHelper.accessor("id", {
      header: () => "ID",
    }),
    columnHelper.accessor("name", {
      header: () => <div className="min-w-8">任务名称</div>,
    }),
    columnHelper.accessor("area_name", {
      header: "搜索区域",
    }),
    columnHelper.accessor("drones", {
      header: () => <div className="min-w-8">无人机</div>,
      cell: (info) =>
        (info.getValue() && info.getValue().length) > 0 ? (
          <div className="flex flex-col">规划{info.getValue().length}架</div>
        ) : (
          <span className="text-gray-400">无</span>
        ),
    }),
    columnHelper.accessor("schedule_time", {
      header: () => <div className="min-w-8">计划飞行时间</div>,
      cell: (info) => {
        // 格式化日期时间显示
        const scheduleTime = info.getValue();
        if (!scheduleTime) return <span className="text-gray-400">未安排</span>;

        try {
          // 将时间格式化为更友好的显示方式
          return format(new Date(scheduleTime), "yyyy-MM-dd HH:mm");
        } catch (error) {
          // 处理无效日期
          console.log(error);

          return <span className="text-gray-400">日期格式错误</span>;
        }
      },
    }),
    columnHelper.accessor("description", {
      header: () => <div className="min-w-12">描述</div>,
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
            className="h-8 px-2 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center min-w-[80px]" // 修改1：添加 min-width
            onClick={() => {
              window.location.href = `/jobs/${row.row.original.id}`;
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            编辑
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center min-w-[100px]" // 修改2：添加 min-width
            onClick={() => {
              router.push(`/jobs/report/${row.row.original.id}`);
            }}
          >
            <View className="h-4 w-4 mr-1" />
            任务报告
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center min-w-[100px]" // 修改2：添加 min-width
            onClick={() => {
              router.push(`/jobs/${row.row.original.id}/analyse`);
            }}
          >
            <View className="h-4 w-4 mr-1" />
            搜索结果
          </Button>
          <Button
            variant="destructive"
            className="h-8 px-2 flex items-center min-w-[80px]" // 修改3：添加 min-width
            onClick={() => {
              deleteMutation.mutate(row.row.original.id);
            }}
          >
            <Trash className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: useMemo(() => query.data || [], [query.data]),
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4 justify-between items-center max-w-full overflow-x-auto">
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
                ? format(
                    new Date(searchParams.schedule_time_start),
                    "yyyy年MM月dd日",
                    { locale: zhCN }
                  )
                : "计划开始时间"}
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
                  schedule_time_start: date
                    ? format(date, "yyyy-MM-dd")
                    : undefined,
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
                ? format(
                    new Date(searchParams.schedule_time_end),
                    "yyyy年MM月dd日",
                    { locale: zhCN }
                  )
                : "计划结束时间"}
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
                  schedule_time_end: date
                    ? format(date, "yyyy-MM-dd")
                    : undefined,
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
        <div className="flex-1"></div>
        <Button
          variant="default"
          size="default"
          className="rounded-sm bg-green-500 text-gray-100 hover:bg-green-600"
          onClick={() => {
            window.location.href = "/jobs/new";
          }}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          创建
        </Button>
      </div>
      {/* 加载 */}
      {query.isPending && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      {/* 成功 */}
      {query.isSuccess && query.data && (
        <div className="my-4 max-w-full overflow-x-auto">
          <Table className="border border-gray-200 rounded-md border-collapse min-w-[800px] w-full">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-300">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-center border border-gray-300 p-2",
                        header.id === "description" && "w-[35%] min-w-[300px]",
                        header.id === "actions" && "w-[380px]",
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
                      className={cn(
                        "text-center p-2 border-x border-gray-200",
                        // 同步单元格宽度设置
                        cell.column.id === "description" && "text-left truncate min-w-[300px]"
                      )}
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