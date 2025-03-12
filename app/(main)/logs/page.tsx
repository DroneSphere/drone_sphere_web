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

import { getFlightLogItems } from "./request";
import { FlightLogItemResult } from "./type";

const columnHelper = createColumnHelper<FlightLogItemResult>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
  }),
  columnHelper.accessor("drone_id", {
    header: () => "无人机ID",
  }),
  columnHelper.accessor("drone_callsign", {
    header: () => "无人机呼号",
  }),
  columnHelper.accessor("datetime", {
    header: () => "时间",
  }),
  columnHelper.accessor("latitude", {
    header: () => "纬度",
  }),
  columnHelper.accessor("longitude", {
    header: () => "经度",
  }),
  columnHelper.accessor("height", {
    header: () => "高度",
  }),
  columnHelper.accessor("speed", {
    header: () => "速度",
  }),
  columnHelper.accessor("heading", {
    header: () => "航向",
  }),
  columnHelper.accessor("battery", {
    header: () => "电池电量",
  }),
];

export default function Page() {
  const query = useQuery({
    queryKey: ["logs"],
    queryFn: getFlightLogItems,
    refetchOnWindowFocus: false,
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
                // 居中
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
