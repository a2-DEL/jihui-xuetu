"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

const departmentRankings = [
  { rank: 1, name: "计算机学院", score: 96.8, change: "up", accuracy: 95.2, coverage: 98.1, efficiency: 97.3 },
  { rank: 2, name: "信息工程学院", score: 94.5, change: "up", accuracy: 93.8, coverage: 96.2, efficiency: 94.1 },
  { rank: 3, name: "经济管理学院", score: 92.3, change: "down", accuracy: 91.5, coverage: 94.8, efficiency: 90.6 },
  { rank: 4, name: "外国语学院", score: 90.1, change: "same", accuracy: 89.2, coverage: 92.5, efficiency: 88.7 },
  { rank: 5, name: "机械工程学院", score: 88.7, change: "up", accuracy: 87.3, coverage: 91.2, efficiency: 87.6 },
  { rank: 6, name: "电气工程学院", score: 86.4, change: "down", accuracy: 85.8, coverage: 88.9, efficiency: 84.5 },
  { rank: 7, name: "土木工程学院", score: 84.2, change: "same", accuracy: 83.5, coverage: 86.7, efficiency: 82.4 },
  { rank: 8, name: "化学工程学院", score: 82.9, change: "up", accuracy: 82.1, coverage: 85.3, efficiency: 81.3 },
];

export default function CIACRankingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">院系CIAC排名</h1>
        <p className="text-gray-500 mt-1">各院系AI辅助识别能力综合评分排名</p>
      </div>

      {/* 排名说明 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="font-medium">CIAC综合评分规则</p>
              <p className="text-sm text-gray-500">
                综合评分 = 识别准确率 × 0.4 + 覆盖率 × 0.3 + 处理效率 × 0.3
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 排名列表 */}
      <Card>
        <CardHeader>
          <CardTitle>院系排名榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 w-20">排名</th>
                  <th className="text-left p-3">院系名称</th>
                  <th className="text-center p-3">综合评分</th>
                  <th className="text-center p-3">识别准确率</th>
                  <th className="text-center p-3">覆盖率</th>
                  <th className="text-center p-3">处理效率</th>
                  <th className="text-center p-3 w-20">变化</th>
                </tr>
              </thead>
              <tbody>
                {departmentRankings.map((dept) => (
                  <tr key={dept.rank} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {dept.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          dept.rank === 1 ? "bg-yellow-500" :
                          dept.rank === 2 ? "bg-gray-400" :
                          "bg-orange-400"
                        }`}>
                          {dept.rank}
                        </div>
                      ) : (
                        <span className="text-gray-500">{dept.rank}</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">{dept.name}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-blue-600 text-lg">{dept.score}</span>
                    </td>
                    <td className="p-3 text-center">{dept.accuracy}%</td>
                    <td className="p-3 text-center">{dept.coverage}%</td>
                    <td className="p-3 text-center">{dept.efficiency}%</td>
                    <td className="p-3 text-center">
                      {dept.change === "up" && <TrendingUp className="w-5 h-5 text-green-500 inline" />}
                      {dept.change === "down" && <TrendingDown className="w-5 h-5 text-red-500 inline" />}
                      {dept.change === "same" && <Minus className="w-5 h-5 text-gray-400 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
