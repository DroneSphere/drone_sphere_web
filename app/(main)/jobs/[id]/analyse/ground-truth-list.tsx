"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { GroundTruthItem } from "./types";

interface GroundTruthListProps {
  groundTruths: GroundTruthItem[];
  onDeleteGroundTruth: (id: string) => void;
  onGroundTruthClick?: (groundTruth: GroundTruthItem) => void;
}

const GroundTruthList = ({
  groundTruths,
  onDeleteGroundTruth,
  onGroundTruthClick,
}: GroundTruthListProps) => {
  if (groundTruths.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">真值列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <span className="text-gray-500 text-sm">暂无真值数据</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          真值列表 ({groundTruths.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow className="border-b border-gray-200">
              <TableHead className="text-center p-2 whitespace-nowrap">
                目标类型
              </TableHead>
              <TableHead className="text-center p-2 whitespace-nowrap">
                经度
              </TableHead>
              <TableHead className="text-center p-2 whitespace-nowrap">
                纬度
              </TableHead>
              <TableHead className="text-center p-2 whitespace-nowrap">
                创建时间
              </TableHead>
              <TableHead className="text-center p-2 whitespace-nowrap">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groundTruths.map((groundTruth) => (
              <TableRow
                key={groundTruth.id}
                className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer"
                onClick={() => onGroundTruthClick?.(groundTruth)}
              >
                <TableCell className="px-2 font-medium text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap">
                  {groundTruth.target_label}
                </TableCell>
                <TableCell className="px-2 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap">
                  {groundTruth.lng.toFixed(6)}
                </TableCell>
                <TableCell className="px-2 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap">
                  {groundTruth.lat.toFixed(6)}
                </TableCell>
                <TableCell className="px-2 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap">
                  {groundTruth.created_at}
                </TableCell>
                <TableCell className="px-2 text-sm text-center p-2 border-x border-gray-200 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroundTruth(groundTruth.id);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GroundTruthList;
