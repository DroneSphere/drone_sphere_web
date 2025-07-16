"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { GroundTruthItem, ObjectTypeOption } from "./types";
import { generateUniqueId } from "./utils";

interface GroundTruthInputProps {
  objectTypes: ObjectTypeOption[];
  onAddGroundTruth: (groundTruth: GroundTruthItem) => void;
  isLoading?: boolean;
}

const GroundTruthInput = ({
  objectTypes,
  onAddGroundTruth,
  isLoading = false,
}: GroundTruthInputProps) => {
  const [formData, setFormData] = useState({
    target_label: "",
    lng: "",
    lat: "",
  });

  const [errors, setErrors] = useState<{
    target_label?: string;
    lng?: string;
    lat?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.target_label) {
      newErrors.target_label = "请选择目标类型";
    }

    const lng = parseFloat(formData.lng);
    if (!formData.lng || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = "请输入有效的经度（-180 到 180）";
    }

    const lat = parseFloat(formData.lat);
    if (!formData.lat || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = "请输入有效的纬度（-90 到 90）";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const groundTruth: GroundTruthItem = {
      id: generateUniqueId(),
      target_label: formData.target_label,
      lng: parseFloat(formData.lng),
      lat: parseFloat(formData.lat),
      created_at: new Date().toLocaleString("zh-CN"),
    };

    onAddGroundTruth(groundTruth);

    // 清空表单
    setFormData({
      target_label: "",
      lng: "",
      lat: "",
    });
    setErrors({});
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">添加真值坐标</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 目标类型和经纬度 - 横向排列 */}
          <div className="grid grid-cols-3 gap-3">
            {/* 目标类型选择 */}
            <div className="space-y-1">
              <Label htmlFor="target_label">目标类型</Label>
              <Select
                value={formData.target_label}
                onValueChange={(value) =>
                  setFormData({ ...formData, target_label: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {objectTypes.map((option) => (
                    <SelectItem key={option.id} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 经度输入 */}
            <div className="space-y-1">
              <Label htmlFor="lng">经度</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                placeholder="经度"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              />
            </div>

            {/* 纬度输入 */}
            <div className="space-y-1">
              <Label htmlFor="lat">纬度</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                placeholder="纬度"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              />
            </div>
          </div>

          {/* 错误提示 */}
          {(errors.target_label || errors.lng || errors.lat) && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                {errors.target_label && (
                  <p className="text-sm text-red-500">{errors.target_label}</p>
                )}
              </div>
              <div>
                {errors.lng && (
                  <p className="text-sm text-red-500">{errors.lng}</p>
                )}
              </div>
              <div>
                {errors.lat && (
                  <p className="text-sm text-red-500">{errors.lat}</p>
                )}
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white">
            {isLoading ? "添加中..." : "添加真值"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GroundTruthInput;
