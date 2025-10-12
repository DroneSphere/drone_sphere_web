"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ObjectTypeOption } from "./types";

interface CSVTemplateProps {
  objectTypes: ObjectTypeOption[];
}

const CSVTemplate = ({ objectTypes }: CSVTemplateProps) => {
  const downloadTemplate = () => {
    // CSV模板头部
    const headers = ["target_label", "lng", "lat"];

    // 示例数据 - 根据可用的objectTypes生成三类示例
    const sampleData = [
      // 第一种类型示例
      {
        target_label: objectTypes.length > 0 ? objectTypes[0].label : "汽车",
        lng: 116.3912,
        lat: 39.9042,
      },
      // 第二种类型示例
      {
        target_label: objectTypes.length > 1 ? objectTypes[1].label : "行人",
        lng: 116.392,
        lat: 39.905,
      },
      // 第三种类型示例
      {
        target_label: objectTypes.length > 2 ? objectTypes[2].label : "建筑物",
        lng: 116.3905,
        lat: 39.9038,
      },
    ];

    // 构建CSV内容
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        [row.target_label, row.lng, row.lat].join(",")
      ),
    ].join("\n");

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "真值数据模板.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={downloadTemplate}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      下载模板
    </Button>
  );
};

export default CSVTemplate;
