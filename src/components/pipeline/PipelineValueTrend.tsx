import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";

interface TrendData {
  month: string;
  totalValue: number;
  customerCount: number;
  avgDealSize: number;
}

interface PipelineValueTrendProps {
  trendData: TrendData[];
  isLoading?: boolean;
}

export const PipelineValueTrend: React.FC<PipelineValueTrendProps> = ({
  trendData,
  isLoading = false,
}) => {
  const [activeMetrics, setActiveMetrics] = useState({
    totalValue: true,
    customerCount: true,
  });

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">
                {entry.name === "Customer Count"
                  ? entry.value
                  : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show loading when either isLoading is true OR trendData is empty
  if (isLoading || trendData.length === 0) {
    return (
      <Card className="p-6 backdrop-blur-sm bg-card/50 border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <Skeleton className="h-4 w-20 mx-auto mb-2" />
            <Skeleton className="h-6 w-24 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 backdrop-blur-sm bg-card/50 border-border/50 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pipeline Value Trend
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            12-month historical pipeline performance
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeMetrics.totalValue ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetric("totalValue")}
            className="hover-scale transition-all"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Total Value
          </Button>
          <Button
            variant={activeMetrics.customerCount ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetric("customerCount")}
            className="hover-scale transition-all"
          >
            <Users className="h-3 w-3 mr-1" />
            Customers
          </Button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="opacity-30"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
            {activeMetrics.totalValue && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalValue"
                name="Total Value"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            )}
            {activeMetrics.customerCount && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="customerCount"
                name="Customer Count"
                stroke="hsl(var(--chart-2))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Current Total</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(trendData[trendData.length - 1]?.totalValue || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Active Customers</p>
          <p className="text-lg font-bold text-chart-2">
            {trendData[trendData.length - 1]?.customerCount || 0}
          </p>
        </div>
      </div>
    </Card>
  );
};
