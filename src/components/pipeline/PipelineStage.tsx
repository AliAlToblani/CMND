
import React from "react";
import { PipelineStageData } from "@/hooks/usePipelineData";
import { CustomerDot } from "./CustomerDot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PipelineStageProps {
  stage: PipelineStageData;
  viewMode: "value" | "count";
  stageIndex: number;
  totalStages: number;
}

export const PipelineStage: React.FC<PipelineStageProps> = ({ 
  stage, 
  viewMode, 
  stageIndex,
  totalStages 
}) => {
  const getStageColor = (index: number, total: number) => {
    const ratio = index / (total - 1);
    if (ratio <= 0.33) return "from-purple-500 to-purple-400";
    if (ratio <= 0.66) return "from-blue-500 to-blue-400";
    return "from-green-500 to-green-400";
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const isEmpty = stage.customerCount === 0;
  const gradientClass = getStageColor(stageIndex, totalStages);

  return (
    <Card className={`
      relative w-64 min-h-[160px] p-4 transition-all duration-200 hover:shadow-lg
      ${isEmpty ? 'bg-gray-50 dark:bg-gray-800 border-dashed' : ''}
    `}>
      {/* Stage Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          {stage.stageName}
        </h3>
        <div className={`
          inline-block px-3 py-1 rounded-full text-white text-sm font-medium
          bg-gradient-to-r ${gradientClass}
        `}>
          {viewMode === "value" 
            ? formatValue(stage.totalValue)
            : `${stage.customerCount} customers`
          }
        </div>
      </div>

      {/* Customer Content */}
      <div className="flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-16 text-gray-500 dark:text-gray-400">
            <div className="text-xs text-center">
              No customers in this stage
            </div>
            <div className="text-xs mt-1">$0 value</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Customer Dots */}
            <div className="flex flex-wrap gap-1">
              {stage.customers.slice(0, 12).map((customer) => (
                <CustomerDot key={customer.id} customer={customer} />
              ))}
              {stage.customers.length > 12 && (
                <Badge variant="secondary" className="text-xs">
                  +{stage.customers.length - 12}
                </Badge>
              )}
            </div>
            
            {/* Additional Info */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {viewMode === "value" ? (
                <span>{stage.customerCount} customers</span>
              ) : (
                <span>{formatValue(stage.totalValue)} total</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
