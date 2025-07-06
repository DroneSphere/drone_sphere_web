"use client";

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
import { useState, useEffect } from "react";
import { fetchResults, fetchObjectTypeOptions } from "./requests";
import { ResultItem, ResultQuery, ObjectTypeOption } from "./types";
import ViewDialog from "./view-dialog";
import DeleteDialog from "./delete-dialog";
import { Search } from "lucide-react";
import MaterialPagination from "@/components/material-pagination";


// 定义表格列
const columnHelper = createColumnHelper<ResultItem>();
const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("job_name", {
    header: "任务名称",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("drone_callsign", {
    header: "检测无人机",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("target_label", {
    header: "检测目标类型",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  columnHelper.accessor("lng", {
    header: "经度",
  }),
  columnHelper.accessor("lat", {
    header: "纬度",
  }),
  columnHelper.accessor("created_at", {
    header: "检测时间",
    cell: (info) => <div className="">{info.getValue()}</div>,
  }),
  // 添加操作列
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">操作</div>,
    cell: (info) => (
      <div className="flex justify-center space-x-2">
        <ViewDialog id={info.row.original.id} />
        <DeleteDialog id={info.row.original.id} />
      </div>
    ),
  }),
];

export default function ResultPage() {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<ResultQuery>({
    page: 1,
    page_size: 10,
  });

  // 目标类型选项状态
  const [objectTypeOptions, setObjectTypeOptions] = useState<
    ObjectTypeOption[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // 获取目标类型选项
  useEffect(() => {
    const getObjectTypeOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const options = await fetchObjectTypeOptions();
        setObjectTypeOptions(options);
      } catch (error) {
        console.error("获取目标类型选项失败", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    getObjectTypeOptions();
  }, []);

  // 使用 React Query 获取数据，禁用自动获取
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["results", searchParams],
    queryFn: () => fetchResults(searchParams),
  });

  // 初始化表格
  const table = useReactTable({
    data: data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4 mb-4">
      <div className="mb-4 flex gap-4 justify-start items-center">
        <Input
          type="text"
          placeholder="任务名称"
          className="w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({
              ...prev,
              job_name: e.target.value,
            }))
          }
        />
        <Select
          defaultValue="all" // 默认选择"所有分类"选项
          onValueChange={(value) => {
            // 根据选择更新搜索参数
            if (value === "all") {
              // 选择"所有分类"时，移除 object_type_id 参数
              setSearchParams((prev) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { object_type_id, ...rest } = prev;
                return rest;
              });
            } else if (value !== "-1") {
              // 选择具体分类且不是占位符时，设置 object_type_id
              setSearchParams((prev) => ({
                ...prev,
                object_type_id: parseInt(value),
              }));
            }
          }}
          disabled={isLoadingOptions}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="检测目标类型" />
          </SelectTrigger>
          <SelectContent>
            {/* 添加"所有分类"选项 */}
            <SelectItem value="all">所有分类</SelectItem>

            {objectTypeOptions.length > 0 ? (
              objectTypeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="-1" disabled>
                {isLoadingOptions ? "加载中..." : "暂无选项"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            console.log("搜索参数", searchParams);
            refetch();
          }}
          disabled={isLoading || isFetching}
          className="bg-blue-500 text-gray-100 hover:bg-blue-600"
        >
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
        <div className="flex-1" />
        {/* 添加结果按钮 */}
        {/* <AddDialog onSuccess={() => refetch()} /> */}
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

      {!isLoading && data?.items.length === 0 && (
        <div className="text-center text-gray-500 py-8">暂无数据</div>
      )}

      {isError && <div className="text-center text-red-500 py-8">加载失败</div>}

      {/* 分页 TODO: 可以使用组件库的分页组件替换 */}
      {data && data.total > 0 && (
        <MaterialPagination currentPage={(()=>{
        console.log(searchParams?.page)
        return(searchParams?.page || 0)})()} total={Math.ceil((data?.total||0)/((searchParams?.page_size||1)))} onChange={(newPage)=>{
        setSearchParams((prev)=>({ ...prev, page:newPage }))
      }}/>
      )}
    </div>
  );
}
