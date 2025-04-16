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
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect } from "react";
import { getGatewayModels } from "./request";
import { GatewayModelItemResult } from "./type";
import DetailDialog from "./detail-dialog";
import DeleteDialog from "./delete-dialog";

const columnHelper = createColumnHelper<GatewayModelItemResult>();

const columns = [
  columnHelper.accessor("gateway_model_id", {
    header: () => "ID",
  }),
  columnHelper.accessor("gateway_model_name", {
    header: "名称",
  }),
  columnHelper.accessor("gateway_model_domain", {
    header: "领域",
  }),
  columnHelper.accessor("gateway_model_type", {
    header: "主型号",
  }),
  columnHelper.accessor("gateway_model_sub_type", {
    header: "子型号",
  }),
  columnHelper.accessor("gateway_model_description", {
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
  columnHelper.accessor("created_time", {
    header: "创建时间",
    cell: (info) => new Date(info.getValue()).toLocaleString("zh-CN"),
  }),
  columnHelper.accessor("updated_time", {
    header: "更新时间",
    cell: (info) => new Date(info.getValue()).toLocaleString("zh-CN"),
  }),
  columnHelper.accessor("state", {
    header: "状态",
    cell: (info) => (info.getValue() === 0 ? "正常" : "未知"),
  }),
  // 添加操作列
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">操作</div>,
    cell: (info) => (
      <div className="flex justify-center space-x-2">
        <DetailDialog
          id={info.row.original.gateway_model_id}
          name={info.row.original.gateway_model_name}
          description={info.row.original.gateway_model_description}
        />
        <DeleteDialog
          id={info.row.original.gateway_model_id}
          name={info.row.original.gateway_model_name}
        />
      </div>
    ),
  }),
];

export default function Page() {
  const query = useQuery({
    queryKey: ["models", "gateways"],
    queryFn: () => getGatewayModels(),
  });

  useEffect(() => {
    if (query.isError) {
      toast({
        title: "获取网关型号列表失败",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.isError, query.error]);

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      {query.isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      {query.isSuccess && query.data && (
        <div className="my-4 max-w-full overflow-x-auto">
          <Table className="border border-gray-200 rounded-md border-collapse">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-300">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-center border border-gray-300 p-2"
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
                  className="hover:bg-gray-50 border-b border-gray-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center p-2 border-x border-gray-200"
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
    </div>
  );
}
