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
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { getAllModels } from "./request";
import { DroneModelItemResult, GimbalModel } from "./type";
import DeleteDialog from "./delete-dialog";
import DetailDialog from "./detail-dialog";
import AddDroneModelDialog from "./add-dialog";
import { Search } from "lucide-react";

const columnHelper = createColumnHelper<DroneModelItemResult>();

export default function Page() {
  // 添加搜索状态
  const [searchText, setSearchText] = useState("");

  // 查询无人机型号数据
  const query = useQuery({
    queryKey: ["models", "drones"],
    queryFn: () => getAllModels(searchText),
  });

  // 定义表格列定义
  const columns = [
    columnHelper.accessor("id", {
      header: () => "ID",
    }),
    columnHelper.accessor("name", {
      header: "名称",
    }),
    columnHelper.accessor("domain", {
      header: "领域",
    }),
    columnHelper.accessor("type", {
      header: "主型号",
    }),
    columnHelper.accessor("sub_type", {
      header: "子型号",
    }),
    // columnHelper.accessor("gateway_name", {
    //   header: "网关设备",
    //   cell: (info) => (
    //     <HoverCard>
    //       <HoverCardTrigger>
    //         <div className="text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-72 hover:underline hover:cursor-pointer">
    //           {info.getValue() || <span className="text-gray-400">无</span>}
    //         </div>
    //       </HoverCardTrigger>
    //       <HoverCardContent>
    //         <div className="text-left max-w-196">
    //           {info.getValue() || <span className="text-gray-400">无</span>}
    //         </div>
    //       </HoverCardContent>
    //     </HoverCard>
    //   ),
    // }),
    columnHelper.accessor("gimbals", {
      header: "可搭载云台",
      cell: (info) => {
        const gimbals = info.getValue();
        if (!gimbals || gimbals.length === 0) {
          return "机载云台";
        }
        return (
          <div className="flex flex-col">
            {gimbals.map((gimbal: GimbalModel) => (
              <div key={gimbal.gimbal_model_id} className="text-left">
                {gimbal.gimbal_model_description ? (
                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-72 hover:underline hover:cursor-pointer">
                        {gimbal.gimbal_model_name}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="text-left max-w-196">
                        {gimbal.gimbal_model_description}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  gimbal.gimbal_model_name
                )}
              </div>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("description", {
      header: "描述",
      cell: (info) => (
        <HoverCard>
          <HoverCardTrigger>
            <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap max-w-72">
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
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center">操作</div>,
      cell: (info) => (
        <div className="flex justify-center space-x-2">
          <DetailDialog
            id={info.row.original.id}
            name={info.row.original.name}
            description={info.row.original.description}
          />
          <DeleteDialog
            id={info.row.original.id}
            name={info.row.original.name}
          />
        </div>
      ),
    }),
  ];

  // 错误处理
  useEffect(() => {
    if (query.isError) {
      toast({
        title: "获取无人机型号列表失败",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.isError, query.error]);

  // 处理回车键搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      query.refetch();
    }
  };

  // 创建表格实例
  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex">
          <div className="relative mr-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="搜索无人机型号..."
              className="pl-10 py-2 w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            variant="default"
            onClick={() => query.refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Search className="h-4 w-4" />
            搜索
          </Button>
        </div>
        <AddDroneModelDialog />
      </div>

      {/* 加载状态 */}
      {query.isPending && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      {/* 数据表格 */}
      {query.isSuccess && query.data && query.data.length > 0 && (
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
      {query.isSuccess && (!query.data || query.data.length === 0) && (
        <div className="text-center text-gray-500">暂无数据</div>
      )}
      {query.isError && (
        <div className="text-center text-red-500">加载失败，请稍后重试</div>
      )}
    </div>
  );
}
