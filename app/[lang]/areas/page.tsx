"use client";

import { AreaListResult, fetchAllAreas } from "@/api/search_area/search_area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const columnHelper = createColumnHelper<AreaListResult>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
  }),
  columnHelper.accessor("name", {
    header: "名称",
  }),
  columnHelper.accessor("description", {
    header: "描述",
  }),
  columnHelper.accessor("center_lat", {
    header: "区域中心点纬度",
  }),
  columnHelper.accessor("center_lng", {
    header: "区域中心点经度",
  }),
];

export default function AreasPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ["areas", "list"];
  const listQuery = useQuery({
    queryKey: queryKey,
    queryFn: fetchAllAreas,
  });

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <div className="my-4 flex justify-between">
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: queryKey,
              });
              toast({
                title: "刷新成功",
                description: "已刷新搜索区域列表",
              });
            }}
          >
            <RefreshCw size={16} />
          </Button>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-[96px] rounded-xl" />
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-12 w-[256px] rounded-xl" />
        </div>
        <Button onClick={() => router.push("/areas/new")}>
          <Plus size={16} />
        </Button>
      </div>
      {
        // 加载中
        listQuery.isPending && (
          <div className="my-16 space-y-4 items-center justify-center flex flex-col">
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            </div>
            <div>加载中</div>
          </div>
        )
      }
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
