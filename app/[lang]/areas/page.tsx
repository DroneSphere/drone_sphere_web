"use client";

import { AreaListResult, fetchAllAreas } from "@/api/search_area/search_area";
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
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer } from "react";

const columnHelper = createColumnHelper<AreaListResult>();

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
  columnHelper.accessor("center_lat", {
    header: "区域中心点纬度",
  }),
  columnHelper.accessor("center_lng", {
    header: "区域中心点经度",
  }),
];

export default function AreasPage() {
  const router = useRouter();
  const listQuery = useQuery({
    queryKey: ["areas", "list"],
    queryFn: fetchAllAreas,
  });
  const rerender = useReducer(() => ({}), {})[1];

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen p-4">
      <div className="my-4 flex justify-between">
        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={() => rerender()}>
            <RefreshCw size={16} />
          </Button>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-[96px] rounded-xl" />
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-12 w-[256px] rounded-xl" />
        </div>
        <Button onClick={() => router.push("/areas/new")}>
          <Plus size={16} />
        </Button>
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
