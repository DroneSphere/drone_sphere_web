"use client";

import { selectAllAreas } from "@/app/(main)/areas/requests";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, Trash, View } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteArea } from "./[id]/requests";
import { AreaItemResult, AreaSearchParams } from "./types";

const columnHelper = createColumnHelper<AreaItemResult>();

export default function AreasPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<AreaSearchParams | null>(
    null
  );
  const queryClient = useQueryClient();
  const queryKey = ["areas"];
  const query = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      return selectAllAreas(searchParams);
    },
  });

  // 删除区域的mutation
  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "删除成功",
        description: "区域已删除",
      });
    },
  });
  const columns = [
    columnHelper.accessor("id", {
      header: () => "ID",
    }),
    columnHelper.accessor("name", {
      header: () => <div className="text-center min-w-32">区域名称</div>,
    }),
    columnHelper.accessor("points", {
      header: () => <div className="text-center min-w-16">顶点个数</div>,
      cell: (info) =>
        info.getValue()?.length || <span className="text-gray-400">无</span>,
    }),
    columnHelper.accessor("center_lat", {
      header: () => <div className="text-center min-w-32">区域中心点纬度</div>,
      cell: (info) => info.getValue()?.toFixed(8),
    }),
    columnHelper.accessor("center_lng", {
      header: () => <div className="text-center min-w-32">区域中心点经度</div>,
      cell: (info) => info.getValue()?.toFixed(8),
    }),
    columnHelper.accessor("created_at", {
      header: () => <div className="text-center min-w-32">创建时间</div>,
    }),
    columnHelper.accessor("updated_at", {
      header: () => <div className="text-center min-w-32">更新时间</div>,
    }),
    columnHelper.accessor("description", {
      header: () => <div className="text-center min-w-32">描述</div>,
      cell: (info) => (
        <HoverCard>
          <HoverCardTrigger>
            <div className="text-left overflow-hidden text-ellipsis whitespace-nowrap max-w-48">
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
      header: () => <div className="text-center min-w-12">操作</div>,
      cell: (info) => (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
            onClick={() => router.push(`/areas/${info.row.original.id}`)}
          >
            <View className="h-4 w-4" />
          </Button>
          <Dialog>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 bg-red-400 text-gray-100 hover:bg-red-500"
            >
              <DialogTrigger>
                <Trash className="h-4 w-4" />
              </DialogTrigger>
            </Button>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>删除区域</DialogTitle>
                <DialogDescription>
                  您确定要删除这个区域吗？此操作不可撤销。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteMutation.mutate(info.row.original.id.toString())
                  }
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "删除中..." : "确认删除"}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: query.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-4">
      <div className="mb-4 flex gap-4 justify-between items-center">
        <Input
          type="text"
          placeholder="区域名称"
          className="px-4 py-2 border rounded-md w-[200px]"
          onChange={(e) =>
            setSearchParams((prev) => ({
              ...(prev || {}),
              name: e.target.value,
            }))
          }
          value={searchParams?.name || ""}
        />
        <div className="flex gap-2 items-center">
          <span>开始时间:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !searchParams?.createAtBegin && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {searchParams?.createAtBegin
                  ? format(new Date(searchParams.createAtBegin), "PPP")
                  : "选择日期"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  searchParams?.createAtBegin
                    ? new Date(searchParams.createAtBegin)
                    : undefined
                }
                onSelect={(date) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    createAtBegin: date
                      ? format(date, "yyyy-MM-dd")
                      : undefined,
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 items-center">
          <span>结束时间:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !searchParams?.createAtEnd && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {searchParams?.createAtEnd
                  ? format(new Date(searchParams.createAtEnd), "PPP")
                  : "选择日期"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  searchParams?.createAtEnd
                    ? new Date(searchParams.createAtEnd)
                    : undefined
                }
                onSelect={(date) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    createAtEnd: date ? format(date, "yyyy-MM-dd") : undefined,
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1"></div>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
          }}
          disabled={query.isPending}
        >
          搜索
        </Button>
        {/* 创建 */}
        <Button
          onClick={() => router.push("/areas/new")}
          disabled={query.isPending}
          variant="outline"
        >
          创建
        </Button>
      </div>
      {
        // 加载中
        query.isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )
      }
      {query.isSuccess && (
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
        !query.isLoading &&
          query.isSuccess &&
          (!query.data || query.data.length === 0) && (
            <div className="text-center text-gray-500">
              未找到符合条件的区域
            </div>
          )
      }
      {
        // 加载失败
        query.isError && <div className="text-center">加载失败</div>
      }
    </div>
  );
}
