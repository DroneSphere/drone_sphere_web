"use client";

import {
  DroneItemResult,
  DroneSearchParams,
  fetchAllDrones,
} from "@/api/drone/drone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { useMemo, useState } from "react";

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

export default function DronesPage() {
  const [searchParams, setSearchParams] = useState<DroneSearchParams | null>(
    null
  );
  const listQuery = useQuery({
    queryKey: ["drones", searchParams],
    queryFn: () => {
      console.log("searchParam", searchParams);

      return fetchAllDrones(searchParams);
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: () => "ID",
      }),
      columnHelper.accessor("sn", {
        header: "SN",
      }),
      columnHelper.accessor("callsign", {
        header: "呼号",
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
    ],
    []
  );

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectOptions = [
    { label: "Mavic 3E", value: "M3E" },
    { label: "Mavic 3T", value: "M3T" },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="mb-4 flex gap-4 justify-between items-center">
        <Input
          type="text"
          placeholder="无人机SN"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) => {
            console.log(e.target.value);
            setSearchParams((prev) => ({ ...prev, sn: e.target.value }));
            console.log(searchParams);
          }}
        />
        <Input
          type="text"
          placeholder="无人机呼号"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({ ...prev, callsign: e.target.value }))
          }
        />
        <Select
          onValueChange={(value) => {
            console.log(value);
            setSearchParams((prev) => ({ ...prev, model: value }));
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="无人机型号" />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1"></div>
        <Button
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isPending}
        >
          搜索
        </Button>
      </div>
      {
        // 加载中
        listQuery.isPending && <div className="text-center">加载中...</div>
      }
      {listQuery.isSuccess && (
        <div className="my-4">
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
