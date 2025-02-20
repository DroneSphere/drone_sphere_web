"use client";

import { fetchAllJobs, JobItemResult } from "@/api/job/job";
import { Button } from "@/components/ui/button";
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
  const query = useQuery({
    queryKey: ["jobs"],
    queryFn: () => {
      return fetchAllJobs();
    },
  });

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      {query.isLoading ? (
        <div>Loading...</div>
      ) : query.isError ? (
        <div>Error: {query.error.message}</div>
      ) : (
        <div>
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
    </div>
  );
}
