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
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { getGatewayModels } from "./request";
import { GatewayModelItemResult } from "./type";
import DetailDialog from "./detail-dialog";
import DeleteDialog from "./delete-dialog";
import AddGatewayDialog from "./add-dialog";
import { Search } from "lucide-react";

const columnHelper = createColumnHelper<GatewayModelItemResult>();

export default function Page() {
  // 添加搜索状态
  const [searchText, setSearchText] = useState("");

  // 查询网关型号数据
  const query = useQuery({
    queryKey: ["models", "gateways"],
    queryFn: () => getGatewayModels(),
  });

  // 定义表格列定义
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

  // 错误处理
  useEffect(() => {
    if (query.isError) {
      toast({
        title: "获取网关型号列表失败",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.isError, query.error]);

  // 过滤数据
  const filteredData = useMemo(() => {
    const lowercaseSearch = searchText.toLowerCase();
    return (query.data || []).filter((item) => {
      return (
        String(item.gateway_model_id).includes(lowercaseSearch) ||
        (item.gateway_model_name || "")
          .toLowerCase()
          .includes(lowercaseSearch) ||
        (item.gateway_model_description || "")
          .toLowerCase()
          .includes(lowercaseSearch)
      );
    });
  }, [query.data, searchText]);

  // 创建表格实例
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="搜索网关型号..."
            className="pl-10 py-2"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <AddGatewayDialog />
      </div>

      {/* 加载状态 */}
      {query.isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* 数据表格 */}
      {query.isSuccess && (
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    没有找到符合条件的数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
