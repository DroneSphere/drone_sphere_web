import { getBySN } from "@/api/drone/request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { View } from "lucide-react";
import { useState } from "react";
import { keyMappings } from "./misc";
export default function ViewDialog(
  props: Readonly<{
    sn: string;
  }>
) {
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["drones", props.sn],
    queryFn: () => {
      return getBySN(props.sn);
    },
    enabled: open, // Only fetch when dialog is open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
        >
          <View className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {query.isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {query.isError && (
          <div className="text-center py-4 text-red-500">
            <p>发生错误: {query.error.message}</p>
            <p>请稍后再试</p>
            <p>如果问题持续存在，请联系管理员</p>
          </div>
        )}
        {query.isSuccess && query.data && (
          <DialogHeader>
            <DialogTitle>详细信息 - {query.data.sn}</DialogTitle>
            <DialogDescription>
              <dl className="my-4 divide-y divide-gray-200">
                {Object.entries(query.data).map(([key, value]) => (
                  <div
                    key={key}
                    className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-gray-500">
                      {keyMappings[key] || key}
                    </dt>

                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {!key.includes("is") && !key.includes("has") ? (
                        <span className="text-gray-500">{value}</span>
                      ) : (
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              value === null
                                ? "bg-gray-300"
                                : value
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="ml-2 text-gray-500">
                            {value ? "是" : "否"}
                          </span>
                        </div>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}
