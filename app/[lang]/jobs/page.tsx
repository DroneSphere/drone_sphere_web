"use client";

import { fetchAllJobs, JobItemResult, JobSearchParams } from "@/api/job/request";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { JobCreator } from "./job-creator";

const columnHelper = createColumnHelper<JobItemResult>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
  }),
  columnHelper.accessor("name", {
    header: "名称",
  }),
  columnHelper.accessor("description", {
    header: "描述",
  }),
  columnHelper.accessor("area_name", {
    header: "搜索区域",
  }),
  columnHelper.accessor("drones", {
    header: () => "无人机",
  }),
  columnHelper.accessor("target_classes", {
    header: () => "目标类别",
  }),
  // 操作列
  columnHelper.accessor("id", {
    header: () => "操作",
    cell: (row) => (
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log(row.row.original);

            window.location.href = `/jobs/${row.row.original.id}`;
          }}
        >
          查看
        </Button>
        <Button variant="destructive" size="sm">
          删除
        </Button>
      </div>
    ),
  }),
];

export default function JobListPage() {
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(
    null
  );
  const listQuery = useQuery({
    queryKey: ["jobs", searchParams],
    queryFn: () => {
      return fetchAllJobs(searchParams);
    },
  });

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      <div className="mb-4 flex gap-4 justify-between items-center">
        <Input
          type="text"
          placeholder="任务名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <Input
          type="text"
          placeholder="区域名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchParams((prev) => ({ ...prev, area: e.target.value }))
          }
        />
        <div className="flex gap-2 items-center">
          <span>开始时间:</span>
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
                  : "选择日期"}
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
                    createAtBegin: date
                      ? format(date, "yyyy-MM-dd")
                      : undefined,
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 items-center">
          <span>结束时间:</span>
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
                  : "选择日期"}
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
        </div>
        <div className="flex-1"></div>
        <Button
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isPending}
        >
          搜索
        </Button>
        <JobCreator />
      </div>
      {listQuery.isLoading ? (
        <div>Loading...</div>
      ) : listQuery.isError ? (
        <div>Error: {listQuery.error.message}</div>
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
                    <TableCell key={cell.id} className="text-center">
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
