"use client";

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
import { getGimbalList } from "./request";
import { GimbalItemResult } from "./type";

const columnHelper = createColumnHelper<GimbalItemResult>();

const columns = [
  columnHelper.accessor("gimbal_model_id", {
    header: () => "ID",
  }),
  columnHelper.accessor("gimbal_model_product", {
    header: "产品",
  }),
  columnHelper.accessor("gimbal_model_name", {
    header: "名称",
  }),
  columnHelper.accessor("gimbal_model_domain", {
    header: "领域",
  }),
  columnHelper.accessor("gimbal_model_type", {
    header: "主型号",
  }),
  columnHelper.accessor("gimbal_model_sub_type", {
    header: "子型号",
  }),
  columnHelper.accessor("gimbalindex", {
    header: "云台索引",
  }),
  columnHelper.accessor("gimbal_model_description", {
    header: "描述",
    cell: (info) => (
      <HoverCard>
        <HoverCardTrigger>
          <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap min-w-24">
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
  columnHelper.accessor("is_thermal_available", {
    header: "支持热成像",
    cell: (info) => (
      <div>{info.getValue() ? "是" : "否"}</div>
    ),
  }),
];

export default function Page() {
  const query = useQuery({
    queryKey: ["gimbals"],
    queryFn: () => getGimbalList(),
  });

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      <div className="my-4 max-w-full overflow-x-auto">
        {query.isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        {query.isSuccess && query.data && (
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
        )}
      </div>
    </div>
  );
}
