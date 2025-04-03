"use client";

import { deleteJob } from "@/app/(main)/jobs/[id]/request";
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
import { CalendarIcon, Edit, Trash, View } from "lucide-react";
import { useMemo, useState } from "react";
import { JobItemResult, JobSearchParams } from "./types";
import { fetchAllJobs } from "./requests";

const columnHelper = createColumnHelper<JobItemResult>();

export default function JobListPage() {
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(
    null
  );
  const query = useQuery({
    queryKey: ["jobs"],
    queryFn: () => {
      return fetchAllJobs(searchParams);
    },
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
        info.getValue() || <span className="text-gray-400">未指定</span>,
    }),
    columnHelper.accessor("description", {
      header: () => <div className="min-w-12">描述</div>,
      cell: (info) => (
        <HoverCard>
          <HoverCardTrigger>
            <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap max-w-36">
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
    columnHelper.accessor("id", {
      header: () => "操作",
      cell: (row) => (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
            onClick={() => {
              console.log(row.row.original);
              window.location.href = `/jobs/${row.row.original.id}`;
            }}
          >
            <View className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
            onClick={() => {
              console.log(row.row.original);
              window.location.href = `/jobs/creation/${row.row.original.id}`;
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              deleteMutation.mutate(row.row.original.id);
            }}
          >
            <Trash className="h-4 w-4" />
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
    <div className="px-4">
      <div className="flex gap-4 justify-start items-center max-w-full overflow-x-auto p-2">
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
                "w-[128px] justify-start text-left font-normal",
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
                "w-[128px] justify-start text-left font-normal",
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
        <Button onClick={() => query.refetch()} disabled={query.isPending}>
          搜索
        </Button>
        <div className="flex-1" />
        <Button
          onClick={() => {
            window.location.href = "/jobs/new";
          }}
          disabled={query.isPending}
        >
          创建任务
        </Button>
      </div>
      {query.isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : query.isError ? (
        <div>Error: {query.error.message}</div>
      ) : (
        <div>
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
                    // 居中
                    <TableCell key={cell.id} className="text-center p-2">
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
    </div>
  );
}
