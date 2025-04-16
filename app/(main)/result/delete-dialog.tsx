import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useState } from "react";
import { deleteResult } from "./requests";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// 删除检测结果对话框组件
export default function DeleteDialog(
  props: Readonly<{
    id: number;
  }>
) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 处理删除操作的逻辑
  const mutation = useMutation({
    mutationFn: () => {
      return deleteResult(props.id);
    },
    onSuccess: () => {
      // 使之前的查询失效
      queryClient.invalidateQueries({
        queryKey: ["results"],
      });
      setOpen(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-sm hover:bg-red-600">
          <Trash className="h-4 w-4" />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>是否删除检测结果?</AlertDialogTitle>
          <AlertDialogDescription>
            删除后该检测结果（ID: {props.id}）将无法恢复。
            <br />
            <span className="text-red-500">删除操作不可逆，请谨慎操作！</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-500 text-gray-100 hover:bg-red-600"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
