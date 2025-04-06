"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import { View } from "lucide-react";
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
        <div className="flex items-center space-x-2">
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
  columnHelper.display({
    id: "actions",
    header: () => "操作",
    cell: (row) => (
      <div className="flex justify-center space-x-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
          onClick={() => {
            window.location.href = `/tasks/${row.row.original.job_id}`;
          }}
        >
          <View className="h-4 w-4" />
        </Button>
      </div>
    ),
  }),
];

export default function Page() {
  const query = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4 mb-4">
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
            <TableRow key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-center p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
