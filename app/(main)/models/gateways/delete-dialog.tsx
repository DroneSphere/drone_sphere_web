// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/models/gateways/delete-dialog.tsx
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
import { useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useState } from "react";
import { deleteGateway } from "./request";

export default function DeleteDialog(
  props: Readonly<{
    id: number;
    name: string;
  }>
) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  // 处理删除操作
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGateway(props.id);
      // 删除成功后刷新列表
      queryClient.invalidateQueries({
        queryKey: ["models", "gateways"],
      });
      setOpen(false);
    } catch (error) {
      console.error("删除失败:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-sm hover:bg-red-600">
          <Trash className="h-4 w-4 mr-1" />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>是否删除网关型号?</AlertDialogTitle>
          <AlertDialogDescription>
            删除后该网关型号（{props.name || `ID: ${props.id}`}）将无法恢复。
            <br />
            <span className="text-red-500">删除操作不可逆，请谨慎操作！</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-red-500 text-gray-100 hover:bg-red-600"
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
