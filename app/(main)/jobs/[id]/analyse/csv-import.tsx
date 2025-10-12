"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, FileText } from "lucide-react";
import { useRef } from "react";
import { GroundTruthItem, ObjectTypeOption } from "./types";
import { generateUniqueId } from "./utils";
import CSVTemplate from "./csv-template";

interface CSVImportProps {
  objectTypes: ObjectTypeOption[];
  onImportGroundTruths: (groundTruths: GroundTruthItem[]) => void;
  categoryCount: Map<string, number>;
}

const CSVImport = ({ objectTypes, onImportGroundTruths, categoryCount }: CSVImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的CSV字段映射（支持多种字段名称）
  const fieldMappings = {
    target_label: ["target_label", "target", "label", "type", "category", "object_type"],
    lng: ["lng", "longitude", "lon", "经度"],
    lat: ["lat", "latitude", "纬度"],
    code: ["code", "id", "编号"]
  };

  // 解析CSV内容
  const parseCSV = (content: string): GroundTruthItem[] => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV文件至少需要包含标题行和数据行");
    }

    // 解析标题行，支持多种字段名称
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());

    // 映射字段索引
    const fieldIndices: Record<string, number> = {};

    Object.entries(fieldMappings).forEach(([field, aliases]) => {
      const index = headers.findIndex(header =>
        aliases.some(alias => header.includes(alias.toLowerCase()))
      );
      if (index !== -1) {
        fieldIndices[field] = index;
      }
    });

    // 检查必需字段
    if (fieldIndices.target_label === undefined) {
      throw new Error("CSV文件中未找到目标类型字段（支持：target_label, target, label, type, category, object_type）");
    }
    if (fieldIndices.lng === undefined) {
      throw new Error("CSV文件中未找到经度字段（支持：lng, longitude, lon, 经度）");
    }
    if (fieldIndices.lat === undefined) {
      throw new Error("CSV文件中未找到纬度字段（支持：lat, latitude, 纬度）");
    }

    const results: GroundTruthItem[] = [];
    const validObjectTypes = new Set(objectTypes.map(opt => opt.label));

    // 处理数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(value => value.trim());

      try {
        const target_label = values[fieldIndices.target_label];
        const lng = parseFloat(values[fieldIndices.lng]);
        const lat = parseFloat(values[fieldIndices.lat]);

        // 验证数据
        if (!target_label) {
          console.warn(`第${i+1}行：目标类型为空，跳过`);
          continue;
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
          console.warn(`第${i+1}行：经度值无效 (${values[fieldIndices.lng]}), 跳过`);
          continue;
        }

        if (isNaN(lat) || lat < -90 || lat > 90) {
          console.warn(`第${i+1}行：纬度值无效 (${values[fieldIndices.lat]}), 跳过`);
          continue;
        }

        // 验证目标类型是否在可选列表中
        if (!validObjectTypes.has(target_label)) {
          console.warn(`第${i+1}行：目标类型"${target_label}"不在可选列表中，跳过`);
          continue;
        }

        // 生成代码
        if (categoryCount.has(target_label)) {
          categoryCount.set(target_label, categoryCount.get(target_label)! + 1);
        } else {
          categoryCount.set(target_label, 1);
        }
        const codeIndex = categoryCount.get(target_label)!;
        const code = fieldIndices.code !== undefined ? values[fieldIndices.code] : `${target_label}-${codeIndex}`;

        const groundTruth: GroundTruthItem = {
          id: generateUniqueId(),
          code,
          target_label,
          lng,
          lat,
          created_at: new Date().toLocaleString("zh-CN")
        };

        results.push(groundTruth);
      } catch (error) {
        console.warn(`第${i+1}行解析失败:`, error);
      }
    }

    return results;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("请选择CSV文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const groundTruths = parseCSV(content);

        if (groundTruths.length === 0) {
          alert("CSV文件中没有有效的真值数据");
          return;
        }

        onImportGroundTruths(groundTruths);
        alert(`成功导入 ${groundTruths.length} 条真值数据`);

        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("CSV解析错误:", error);
        alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };

    reader.onerror = () => {
      alert("文件读取失败，请重试");
    };

    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv"
        className="hidden"
      />
      <CSVTemplate objectTypes={objectTypes} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              导入CSV
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              <span>支持: target_label/lng/lat 或 目标类型/经度/纬度</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CSVImport;