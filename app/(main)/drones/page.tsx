"use client";

import {
  DroneSearchParams,
  fetchAllDrones,
  fetchDroneModels,
} from "@/app/(main)/drones/requests";
import { DroneItemResult } from "@/app/(main)/drones/types";
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
import DeleteDialog from "./delete-dialog";
import DetailDialog from "./detail-dialog";
import AddDroneDialog from "./add-dialog";
import { Search } from "lucide-react";
import MaterialPagination from "@/components/material-pagination";

const columnHelper = createColumnHelper<DroneItemResult>();

const renderIndicator = (value: boolean | undefined) => {
  return (
    <div className="flex justify-center items-center">
      <span
        className={`w-3 h-3 rounded-full ${
          value === null ? "bg-gray-300" : value ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="ml-2 text-sm w-12 text-left">
        {value === null ? "未知" : value ? "支持" : "不支持"}
      </span>
    </div>
  );
};

export default function DronesPage() {
  // 使用一个状态来存储搜索参数
  const [searchParams, setSearchParams] = useState<DroneSearchParams | null>(
    {
      page: 1,
      page_size: 10
    }
  );
  // 使用另一个状态来存储实际执行查询的参数
  const [queryParams, setQueryParams] = useState<DroneSearchParams | null>(
    {
      page: 1,
      page_size: 10
    }
  );

  // 查询配置，只依赖于 queryParams 而不是 searchParams
  const query = useQuery({
    queryKey: ["drones", queryParams],
    queryFn: () => {
      return fetchAllDrones(queryParams);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // 获取无人机型号列表
  const modelsQuery = useQuery({
    queryKey: ["droneModels"],
    queryFn: fetchDroneModels,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: () => "ID",
      }),
      columnHelper.accessor("sn", {
        header: "序列号",
      }),
      columnHelper.accessor("callsign", {
        header: "呼号",
        cell: (info) => <div className="w-32">{info.getValue()}</div>,
      }),

      columnHelper.accessor("product_model", {
        header: "型号",
        cell: (info) => <div className="w-32">{info.getValue()}</div>, // 增加型号列宽度，从w-16修改为w-32
      }),
      columnHelper.accessor("is_rtk_available", {
        header: () => "RTK",
        cell: (info) => renderIndicator(info.getValue()),
      }),
      columnHelper.accessor("is_thermal_available", {
        header: () => "热成像",
        cell: (info) => renderIndicator(info.getValue()),
      }),
      columnHelper.accessor("created_at", {
        header: "创建时间",
        cell: (info) => <div className="">{info.getValue()}</div>,
      }),
      columnHelper.accessor("last_online_at", {
        header: "最后在线时间",
        cell: (info) => <div className="">{info.getValue()}</div>,
      }),
      columnHelper.accessor("status", {
        header: "状态",
        cell: (info) =>
          info.getValue() || <span className="text-gray-400">未知</span>,
      }),
      // columnHelper.accessor("description", {
      //   header: "描述",
      //   cell: (info) => (
      //     <HoverCard>
      //       <HoverCardTrigger>
      //         <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap max-w-36">
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
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: (info) => (
          <div className="flex justify-center space-x-2">
            <DetailDialog
              sn={info.row.original.sn}
              callsign={info.row.original.callsign}
              description={info.row.original.description}
            />
            <DeleteDialog sn={info.row.original.sn} />
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: query.data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4 justify-between items-center">
        <Input
          type="text"
          placeholder="无人机序列号"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) => {
            setSearchParams((prev) => ({ ...prev, sn: e.target.value }));
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
            setSearchParams((prev) => {
              const model_id = value === "all" ? undefined : Number(value);
              return { ...prev, model_id };
            });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="无人机型号" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部型号</SelectItem>
            {modelsQuery.isSuccess && modelsQuery.data ? (
              modelsQuery.data.map((model) => (
                <SelectItem key={model.id} value={String(model.id)}>
                  {model.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading_or_error" disabled>
                {modelsQuery.isPending ? "加载中..." : "获取型号列表失败"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            // 点击搜索按钮时，将当前的搜索参数设置为查询参数，从而触发查询
            setQueryParams(searchParams);
          }}
          disabled={query.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <Search className="h-4 w-4" />
          搜索
        </Button>
        <div className="flex-1"></div>
        <AddDroneDialog />
      </div>
      {/* 加载 */}
      {query.isPending && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      {/* 成功 */}
      {query.isSuccess && query.data.items && (
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
                    // 居中
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
      {query.isSuccess && (!query.data.items || query.data.items.length === 0) && (
        <div className="text-center text-gray-500">暂无数据</div>
      )}
      {query.isError && <div className="text-center">加载失败</div>}
      <MaterialPagination currentPage={(()=>{
        console.log(queryParams?.page)
        return(queryParams?.page || 0)})()} total={Math.ceil((query.data?.total||0)/((queryParams?.page_size||1)))} onChange={(newPage)=>{
        setSearchParams((prev)=>({ ...prev, page:newPage }))
        setQueryParams((prev)=>({ ...prev, page:newPage }))
      }}/>
    </div>
  );
}
