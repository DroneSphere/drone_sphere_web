"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createResult, fetchObjectTypeOptions } from "./requests";
import { ObjectTypeOption } from "./types";
import { useToast } from "@/hooks/use-toast";

/**
 * 添加检测结果对话框组件
 * 用于创建新的检测结果
 */
export default function AddDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [objectTypeOptions, setObjectTypeOptions] = useState<
    ObjectTypeOption[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    job_id: "",
    wayline_id: "",
    drone_id: "",
    object_type_id: "",
    object_confidence: "0.85", // 默认值
    position: {
      x: "0.2", // 默认值
      y: "0.7", // 默认值
      w: "0.1", // 默认值
      h: "0.2", // 默认值
    },
    coordinate: {
      lng: "",
      lat: "",
    },
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取目标类型选项
  useEffect(() => {
    const getObjectTypeOptions = async () => {
      if (open) {
        setIsLoadingOptions(true);
        try {
          const options = await fetchObjectTypeOptions();
          setObjectTypeOptions(options);
        } catch (error) {
          console.error("获取目标类型选项失败", error);
          toast({
            title: "获取目标类型选项失败",
            description: "请稍后重试",
            variant: "destructive",
          });
        } finally {
          setIsLoadingOptions(false);
        }
      }
    };

    getObjectTypeOptions();
  }, [open, toast]);

  // 处理表单输入变化
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    nested?: string
  ) => {
    const value = e.target.value;

    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [field]:
          typeof prev[field as keyof typeof prev] === "object" &&
          prev[field as keyof typeof prev] !== null
            ? {
                ...(prev[field as keyof typeof prev] as object), // 类型断言为 object
                [nested]: value,
              }
            : { [nested]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // 清除错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 验证必填字段
    if (!formData.job_id) newErrors.job_id = "任务ID不能为空";
    if (!formData.wayline_id) newErrors.wayline_id = "航线ID不能为空";
    if (!formData.drone_id) newErrors.drone_id = "无人机ID不能为空";
    if (!formData.object_type_id) newErrors.object_type_id = "目标类型不能为空";

    // 验证坐标值
    if (!formData.coordinate.lng) newErrors["coordinate.lng"] = "经度不能为空";
    if (!formData.coordinate.lat) newErrors["coordinate.lat"] = "纬度不能为空";

    // 验证数值类型
    if (formData.job_id && isNaN(Number(formData.job_id)))
      newErrors.job_id = "任务ID必须是数字";
    if (formData.wayline_id && isNaN(Number(formData.wayline_id)))
      newErrors.wayline_id = "航线ID必须是数字";
    if (formData.drone_id && isNaN(Number(formData.drone_id)))
      newErrors.drone_id = "无人机ID必须是数字";

    if (formData.coordinate.lng && isNaN(Number(formData.coordinate.lng)))
      newErrors["coordinate.lng"] = "经度必须是数字";
    if (formData.coordinate.lat && isNaN(Number(formData.coordinate.lat)))
      newErrors["coordinate.lat"] = "纬度必须是数字";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 转换表单数据类型
      const data = {
        job_id: Number(formData.job_id),
        wayline_id: Number(formData.wayline_id),
        drone_id: Number(formData.drone_id),
        object_type_id: Number(formData.object_type_id),
        object_confidence: Number(formData.object_confidence),
        position: {
          x: Number(formData.position.x),
          y: Number(formData.position.y),
          w: Number(formData.position.w),
          h: Number(formData.position.h),
        },
        coordinate: {
          lng: Number(formData.coordinate.lng),
          lat: Number(formData.coordinate.lat),
        },
      };

      await createResult(data);
      toast({
        title: "创建成功",
        description: "已成功创建检测结果",
      });
      setOpen(false);

      // 重置表单
      setFormData({
        job_id: "",
        wayline_id: "",
        drone_id: "",
        object_type_id: "",
        object_confidence: "0.85",
        position: {
          x: "0.2",
          y: "0.7",
          w: "0.1",
          h: "0.2",
        },
        coordinate: {
          lng: "",
          lat: "",
        },
      });

      // 调用成功回调
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("创建检测结果失败", error);
      toast({
        title: "创建失败",
        description: "请检查输入数据并重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 text-gray-100 hover:bg-green-600">
          <Plus className="h-4 w-4 mr-1" />
          添加结果
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加检测结果</DialogTitle>
          <DialogDescription>
            填写以下表单创建新的检测结果，带 * 的字段为必填项
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 任务ID */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="job_id" className="text-right">
              任务ID *
            </Label>
            <Input
              id="job_id"
              value={formData.job_id}
              onChange={(e) => handleInputChange(e, "job_id")}
              className="col-span-3"
              placeholder="输入任务ID"
            />
            {errors.job_id && (
              <div className="col-span-3 col-start-2 text-red-500 text-sm">
                {errors.job_id}
              </div>
            )}
          </div>

          {/* 航线ID */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wayline_id" className="text-right">
              航线ID *
            </Label>
            <Input
              id="wayline_id"
              value={formData.wayline_id}
              onChange={(e) => handleInputChange(e, "wayline_id")}
              className="col-span-3"
              placeholder="输入航线ID"
            />
            {errors.wayline_id && (
              <div className="col-span-3 col-start-2 text-red-500 text-sm">
                {errors.wayline_id}
              </div>
            )}
          </div>

          {/* 无人机ID */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="drone_id" className="text-right">
              无人机ID *
            </Label>
            <Input
              id="drone_id"
              value={formData.drone_id}
              onChange={(e) => handleInputChange(e, "drone_id")}
              className="col-span-3"
              placeholder="输入无人机ID"
            />
            {errors.drone_id && (
              <div className="col-span-3 col-start-2 text-red-500 text-sm">
                {errors.drone_id}
              </div>
            )}
          </div>

          {/* 目标类型 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="object_type_id" className="text-right">
              目标类型 *
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.object_type_id}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    object_type_id: value,
                  }));
                  // 清除错误
                  if (errors.object_type_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.object_type_id;
                      return newErrors;
                    });
                  }
                }}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="object_type_id">
                  <SelectValue placeholder="选择目标类型" />
                </SelectTrigger>
                <SelectContent>
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
            </div>
            {errors.object_type_id && (
              <div className="col-span-3 col-start-2 text-red-500 text-sm">
                {errors.object_type_id}
              </div>
            )}
          </div>

          {/* 目标置信度 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="object_confidence" className="text-right">
              置信度
            </Label>
            <Input
              id="object_confidence"
              value={formData.object_confidence}
              onChange={(e) => handleInputChange(e, "object_confidence")}
              className="col-span-3"
              placeholder="输入目标置信度 (0-1)"
              type="number"
              min="0"
              max="1"
              step="0.01"
            />
          </div>

          {/* 位置信息 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">位置信息</Label>
            <div className="col-span-3 grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="position_x" className="text-xs">
                  X
                </Label>
                <Input
                  id="position_x"
                  value={formData.position.x}
                  onChange={(e) => handleInputChange(e, "position", "x")}
                  className="mt-1"
                  type="number"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="position_y" className="text-xs">
                  Y
                </Label>
                <Input
                  id="position_y"
                  value={formData.position.y}
                  onChange={(e) => handleInputChange(e, "position", "y")}
                  className="mt-1"
                  type="number"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="position_w" className="text-xs">
                  W
                </Label>
                <Input
                  id="position_w"
                  value={formData.position.w}
                  onChange={(e) => handleInputChange(e, "position", "w")}
                  className="mt-1"
                  type="number"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="position_h" className="text-xs">
                  H
                </Label>
                <Input
                  id="position_h"
                  value={formData.position.h}
                  onChange={(e) => handleInputChange(e, "position", "h")}
                  className="mt-1"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* 坐标信息 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">坐标信息 *</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="coordinate_lng" className="text-xs">
                  经度
                </Label>
                <Input
                  id="coordinate_lng"
                  value={formData.coordinate.lng}
                  onChange={(e) => handleInputChange(e, "coordinate", "lng")}
                  className="mt-1"
                  placeholder="例如: 129.5123"
                />
                {errors["coordinate.lng"] && (
                  <div className="text-red-500 text-sm">
                    {errors["coordinate.lng"]}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="coordinate_lat" className="text-xs">
                  纬度
                </Label>
                <Input
                  id="coordinate_lat"
                  value={formData.coordinate.lat}
                  onChange={(e) => handleInputChange(e, "coordinate", "lat")}
                  className="mt-1"
                  placeholder="例如: 31.25123"
                />
                {errors["coordinate.lat"] && (
                  <div className="text-red-500 text-sm">
                    {errors["coordinate.lat"]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-500 text-gray-100 hover:bg-blue-600"
          >
            {isSubmitting ? "提交中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
