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
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Trash } from "lucide-react";
import { useState } from "react";
import { deleteDroneBySN } from "./requests";
import { toast } from "@/hooks/use-toast";

export default function DeleteDialog(
  props: Readonly<{
    sn: string;
  }>
) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: deleteDroneBySN,
    onSuccess: () => {
      // 刷新 useQuery 的数据
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      toast({
        title: "删除无人机成功",
        description: `无人机（SN: ${props.sn}）已被删除`,
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "删除无人机失败",
        description: `无人机（SN: ${props.sn}）删除失败，请稍后再试`,
        variant: "destructive",
      });
      console.error("删除无人机失败:", error);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="rounded-sm hover:bg-red-600"
        >
          <Trash className="h-4 w-4" />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>是否删除无人机?</AlertDialogTitle>
          <AlertDialogDescription>
            删除后该无人机（SN: {props.sn}）将无法恢复。
            <br />
            <span className="text-red-500">删除操作不可逆，请谨慎操作！</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-gray-100 hover:bg-red-600"
            onClick={() => mutate(props.sn)}
            disabled={isPending}
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
