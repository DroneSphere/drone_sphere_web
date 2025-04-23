"use client";

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
import { UserResult } from "./types";
import { getAllUsers } from "./requests";
import ChangePasswordDialog from "./change-password-dialog";
import AddUserDialog from "./add-user-dialog";

// 定义表格列
const columnHelper = createColumnHelper<UserResult>();
const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("username", {
    header: "用户名",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("email", {
    header: "邮箱",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("created_time", {
    header: "创建时间",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("updated_time", {
    header: "更新时间",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">操作</div>,
    cell: (info) => (
      <div className="flex justify-center space-x-2">
        <ChangePasswordDialog
          id={info.row.original.id}
          username={info.row.original.username}
        />
      </div>
    ),
  }),
];

export default function Page() {
  // 使用 React Query 获取数据，禁用自动获取
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // 初始化表格
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4 mb-4">
      <div className="mb-4 flex gap-4 justify-between items-center">
        <div className="flex" />
        <AddUserDialog />
      </div>
      {(isLoading || isFetching) && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !isFetching && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-300">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-center font-semibold border-r border-gray-300 last:border-r-0"
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
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center p-2 border-r border-gray-200 last:border-r-0"
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

      {!isLoading && data?.length === 0 && (
        <div className="text-center text-gray-500 py-8">暂无数据</div>
      )}

      {isError && <div className="text-center text-red-500 py-8">加载失败</div>}
    </div>
  );
}
