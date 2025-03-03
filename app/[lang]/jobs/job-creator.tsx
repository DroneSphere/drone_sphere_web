"use client";

import { fetchJobCreateionOptions } from "@/api/job/request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function JobCreator() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    droneId: "",
    areaId: "",
  });
  const optionsQuery = useQuery({
    queryKey: ["job", "creation", "options"],
    queryFn: fetchJobCreateionOptions,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 提交逻辑...
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>创建飞行任务</Button>
      </DialogTrigger>

      <DialogContent className="w-[90vw] max-w-[1200px] sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">新建飞行任务</DialogTitle>
        </DialogHeader>

        {/* 保持原有表单结构，仅调整容器高度 */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 左侧表单区块 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">任务名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入任务名称"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">任务描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="请输入任务详细信息"
                  />
                </div>
              </div>

              {/* 右侧选择区块 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>选择无人机型号</Label>
                  {optionsQuery.isLoading ? (
                    <Skeleton className="rounded-lg" />
                  ) : (
                    <Select
                      value={formData.droneId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, droneId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择可用无人机" />
                      </SelectTrigger>
                      <SelectContent>
                        {optionsQuery.data?.droneModels.map((model) => (
                          <SelectItem
                            key={model.key}
                            value={model.key}
                            className="flex items-center"
                          >
                            <div className="font-semibold">{model.model}</div>
                            {formData.droneId != model.key && (
                              <div className="text-muted-foreground text-sm flex items-center gap-2">
                                <span>{model.drones.length} 台可用</span>
                                <div className="flex gap-2">
                                  {model.drones.map((drone) => (
                                    <span key={drone.id} className="text-xs">
                                      {drone.callsign}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>选择飞行区域</Label>
                  {optionsQuery.isLoading ? (
                    <Skeleton className="rounded-lg" />
                  ) : (
                    <Select
                      value={formData.areaId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, areaId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择飞行区域" />
                      </SelectTrigger>
                      <SelectContent>
                        {optionsQuery.data?.areas.map((area) => (
                          <SelectItem
                            key={area.id}
                            value={area.id.toString()}
                            className="flex items-center"
                          >
                            <div className="font-semibold">{area.name}</div>
                            {formData.areaId != area.id.toString() && (
                              <div className="text-muted-foreground text-sm">
                                {area.description}
                              </div>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作栏 */}
          <DialogFooter>
            <div className="pt-8 flex justify-end gap-3">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-6"
                >
                  取消
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="px-6 bg-primary hover:bg-primary/90"
              >
                创建任务
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
