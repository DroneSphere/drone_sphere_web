"use client";

import { DroneItemResult, fetchAllDrones } from "@/api/drone/drone";
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

const columnHelper = createColumnHelper<DroneItemResult>();

const renderIndicator = (value: boolean | undefined) => {
  return (
    <div className="flex justify-center">
      <div
        className={`w-3 h-3 rounded-full ${
          value === null ? "bg-gray-300" : value ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </div>
  );
};

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
  }),
  columnHelper.accessor("sn", {
    header: "SN",
  }),
  columnHelper.accessor("status", {
    header: "状态",
  }),
  columnHelper.accessor("product_type", {
    header: "型号",
  }),
  columnHelper.accessor("is_rtk_available", {
    header: () => "RTK",
    cell: (info) => renderIndicator(info.getValue()),
  }),
  columnHelper.accessor("is_thermal_available", {
    header: () => "热成像",
    cell: (info) => renderIndicator(info.getValue()),
  }),
  columnHelper.accessor("last_login_at", {
    header: "最后登录时间",
  }),
];

export default function DronesPage() {
  const listQuery = useQuery({ queryKey: ["drones"], queryFn: fetchAllDrones });
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
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-[96px] rounded-xl" />
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-12 w-[256px] rounded-xl" />
        </div>
      </div>
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
            {/* <TableFooter>
              <TableRow>
                {table.getFooterGroups().map((footerGroup) =>
                  footerGroup.headers.map((footer) => (
                    <TableHead key={footer.id} className="text-center">
                      {footer.isPlaceholder
                        ? null
                        : flexRender(
                            footer.column.columnDef.footer,
                            footer.getContext()
                          )}
                    </TableHead>
                  ))
                )}
              </TableRow>
            </TableFooter> */}
          </Table>
        </div>
      )}
    </div>
  );
}
