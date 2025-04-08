"use client";

import {
  downloadWayline,
  fetchAllWaylines,
  WaylineItemResult,
} from "@/api/wayline/wayline";
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
import { toast, useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const columnHelper = createColumnHelper<WaylineItemResult>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
  }),
  columnHelper.accessor("drone_model", {
    header: "无人机型号",
  }),
  columnHelper.accessor("drone_sn", {
    header: "无人机序列号",
  }),
  columnHelper.accessor("upload_user", {
    header: "上传用户",
  }),
  columnHelper.accessor("created_at", {
    header: "上传时间",
  }),
  //  删除和下载按钮
  columnHelper.display({
    id: "actions",
    header: () => <span>操作</span>,
    cell: (row) => (
      <div className="flex gap-2 items-center justify-center">
        <Button
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          删除
        </Button>
        <Button
          variant="outline"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              // Get the wayline ID from the row
              const id = row?.cell.id;
              if (!id) {
                throw new Error("Could not find wayline ID");
              }

              // Call the download API function
              const data = await downloadWayline(id);
              // 创建 blob 对象并模拟点击
              const blob = new Blob([data], {
                type: "application/octet-stream",
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "wayline.kmz"; // Specify the filename
              a.click();
              window.URL.revokeObjectURL(url);
              // Show success toast
              toast({
                title: "下载成功",
                description: "航线文件已开始下载",
              });
            } catch (error) {
              console.error("Download failed:", error);
              toast({
                title: "下载失败",
                description: "航线文件下载失败，请稍后重试",
                variant: "destructive",
              });
            }
          }}
        >
          下载
        </Button>
      </div>
    ),
  }),
];

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ["areas", "list"];
  const listQuery = useQuery({
    queryKey: queryKey,
    queryFn: fetchAllWaylines,
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
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
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
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/areas/${row.original.id}`)}
                  className="cursor-pointer"
                >
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
