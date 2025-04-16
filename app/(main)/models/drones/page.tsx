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
import { getAllModels } from "./request";
import { DroneModelItemResult } from "./type";
import DeleteDialog from "./delete-dialog";
import DetailDialog from "./detail-dialog";

const columnHelper = createColumnHelper<DroneModelItemResult>();

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
  columnHelper.accessor("gateway_name", {
    header: "网关设备",
    cell: (info) => (
      <HoverCard>
        <HoverCardTrigger>
          <div className="text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-72 hover:underline hover:cursor-pointer">
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
  columnHelper.accessor("gimbals", {
    header: "可搭载云台",
    cell: (info) => {
      const gimbals = info.getValue();
      if (!gimbals || gimbals.length === 0) {
        return "机载云台";
      }
      return (
        <div className="flex flex-col">
          {gimbals.map(
            (gimbal: { id: number; name: string; description?: string }) => (
              <div key={gimbal.id} className="text-left">
                {gimbal.description ? (
                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-72 hover:underline hover:cursor-pointer">
                        {gimbal.name}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="text-left max-w-196">
                        {gimbal.description}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  gimbal.name
                )}
              </div>
            )
          )}
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
        <DetailDialog id={info.row.original.id} name={info.row.original.name} description={info.row.original.description} />
        <DeleteDialog id={info.row.original.id} name={info.row.original.name} />
      </div>
    ),
  }),
];

export default function Page() {
  const query = useQuery({
    queryKey: ["models", "drones"],
    queryFn: () => getAllModels(),
  });

  useEffect(() => {
    if (query.isError) {
      toast({
        title: "获取无人机型号列表失败",
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
                    <TableHead key={header.id} className="text-center border border-gray-300 p-2">
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
                <TableRow key={row.id} className="hover:bg-gray-50 border-b border-gray-200">
                  {row.getVisibleCells().map((cell) => (
                    // 居中
                    <TableCell key={cell.id} className="text-center p-2 border-x border-gray-200">
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
