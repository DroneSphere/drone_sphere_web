"use client";

import { DetectResultItem, fetchAllDetectResults } from "@/api/result/result";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { RefreshCw } from "lucide-react";
import { useReducer } from "react";

function StatisticsPanel() {
  return (
    <div className="mb-4">
      <div className="flex gap-4 justify-around">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[192px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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
    header: "型号",
  }),
  columnHelper.accessor("lat", {
    header: "纬度",
  }),
  columnHelper.accessor("created_at", {
    header: "上传时间",
  }),
];

export default function DronesPage() {
  const listQuery = useQuery({
    queryKey: ["detects"],
    queryFn: fetchAllDetectResults,
  });
  const rerender = useReducer(() => ({}), {})[1];

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen p-4">
      <StatisticsPanel />
      <div className="my-4 flex justify-between">
        <div className="flex gap-4 items-center">
          <Button onClick={() => rerender()}>
            <RefreshCw size={16} />
          </Button>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-[96px] rounded-xl" />
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-12 w-[256px] rounded-xl" />
        </div>
      </div>
      {
        // 加载中
        listQuery.isPending && <div className="text-center">加载中...</div>
      }
      {listQuery.isSuccess && (
        <div className="my-4">
          <Table>
            <TableHeader>
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
      {
        // 无数据
        !listQuery.isPending &&
          listQuery.isSuccess &&
          listQuery.data?.length === 0 && (
            <div className="text-center text-gray-500">暂无数据</div>
          )
      }
      {
        // 加载失败
        listQuery.isError && <div className="text-center">加载失败</div>
      }
    </div>
  );
}
