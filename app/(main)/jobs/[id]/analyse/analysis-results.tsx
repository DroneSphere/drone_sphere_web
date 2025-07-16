"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  BarChart3 
} from "lucide-react";
import { ErrorStatistics, MatchResult } from "./types";
import { formatDistance, formatPercentage } from "./utils";
import styles from "./analysis-results.module.css";

interface AnalysisResultsProps {
  statistics: ErrorStatistics;
  matchResults: MatchResult[];
}

const AnalysisResults = ({ statistics, matchResults }: AnalysisResultsProps) => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return "text-green-600";
    if (accuracy >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 0.8) return "bg-green-100";
    if (accuracy >= 0.6) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-4">
      {/* 总体统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 准确率 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">准确率</p>
                <p className={`text-2xl font-bold ${getAccuracyColor(statistics.accuracy)}`}>
                  {formatPercentage(statistics.accuracy)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 匹配成功数 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">匹配成功</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.matchedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 匹配失败数 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">匹配失败</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.totalGroundTruths - statistics.matchedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 平均误差 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">平均误差</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.errors.length > 0 ? formatDistance(statistics.avgError) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">误差统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 准确率进度条 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">准确率</span>
                <Badge variant="outline" className={getAccuracyBgColor(statistics.accuracy)}>
                  {statistics.matchedCount}/{statistics.totalGroundTruths}
                </Badge>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${styles[`progressFill${Math.round(statistics.accuracy * 10) * 10}`]}`}
                />
              </div>
            </div>

            {/* 误差统计 */}
            {statistics.errors.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-600">最大误差</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">
                    {formatDistance(statistics.maxError)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-600">最小误差</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatDistance(statistics.minError)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">平均误差</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {formatDistance(statistics.avgError)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600">标准差</span>
                  </div>
                  <p className="text-lg font-bold text-purple-600">
                    {formatDistance(statistics.stdError)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">均方根误差</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {formatDistance(statistics.rmsError)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 匹配结果列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">匹配结果明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {matchResults.map((result) => (
              <div
                key={result.groundTruth.id}
                className={`p-3 rounded-lg border ${
                  result.isMatched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result.isMatched ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {result.groundTruth.target_label}
                      </p>
                      <p className="text-xs text-gray-500">
                        真值: ({result.groundTruth.lng.toFixed(6)}, {result.groundTruth.lat.toFixed(6)})
                      </p>
                      {result.detection && (
                        <p className="text-xs text-gray-500">
                          检测: ({parseFloat(result.detection.lng).toFixed(6)}, {parseFloat(result.detection.lat).toFixed(6)})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {result.isMatched ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        {formatDistance(result.distance)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        未匹配
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;
