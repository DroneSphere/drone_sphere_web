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
import { useMemo } from "react";
import { getAllGateways } from "./request";
import { GatewayItemResult } from "./type";
import EditDialog from "./edit-dialog";

const columnHelper = createColumnHelper<GatewayItemResult>();

// 状态现在直接使用字符串，不需要映射
// const statusMap: Record<number, string> = {
//   0: "离线",
//   1: "在线",
// };

export default function DronesPage() {
  const query = useQuery({
    queryKey: ["gateways"],
    queryFn: () => {
      return getAllGateways();
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
        // 状态现在直接显示字符串
        cell: (info) => info.getValue() || <span className="text-gray-400">未知</span>,
      }),
      columnHelper.accessor("product_model", {
        header: "设备型号", // 直接显示产品型号
      }),
      columnHelper.accessor("description", {
        header: "描述",
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
      columnHelper.accessor("created_at", {
        header: "创建时间", // 新增创建时间
      }),
      columnHelper.accessor("last_online_at", {
        header: "最后在线", // 新增最后在线时间
      }),
      // 操作列
      columnHelper.display({
        id: "actions",
        header: "操作",
        cell: (info) => (
          <div className="flex justify-center">
            <EditDialog
              sn={info.row.original.sn}
              callsign={info.row.original.callsign}
              description={info.row.original.description}
            />
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      {
        // 加载中
        query.isPending && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )
      }
      {query.isSuccess && (
        <div className="my-4 max-w-full overflow-x-auto">
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
        </div>
      )}
      {
        // 无数据
        !query.isPending && query.isSuccess && query.data?.length === 0 && (
          <div className="text-center text-gray-500">暂无数据</div>
        )
      }
      {
        // 加载失败
        query.isError && <div className="text-center">加载失败</div>
      }
    </div>
  );
}
