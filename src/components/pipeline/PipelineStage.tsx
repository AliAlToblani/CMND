
import React, { useState } from "react";
import { PipelineStageData } from "@/hooks/usePipelineData";
import { CustomerDot } from "./CustomerDot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 10;

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
  const hasOverflow = stage.customers.length > INITIAL_DISPLAY_COUNT;
  const overflowCount = stage.customers.length - INITIAL_DISPLAY_COUNT;
  const displayCustomers = isExpanded ? stage.customers : stage.customers.slice(0, INITIAL_DISPLAY_COUNT);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`
      relative w-64 p-4 transition-all duration-300 hover:shadow-lg
      ${isEmpty ? 'bg-gray-50 dark:bg-gray-800 border-dashed' : ''}
      ${isExpanded ? 'min-h-[300px]' : 'min-h-[160px]'}
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
          <div className="space-y-3">
            {/* Initial Customer Dots Row */}
            <div className="flex flex-wrap gap-1">
              {stage.customers.slice(0, INITIAL_DISPLAY_COUNT).map((customer) => (
                <CustomerDot key={customer.id} customer={customer} />
              ))}
              {hasOverflow && !isExpanded && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-auto px-2 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  onClick={toggleExpansion}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  +{overflowCount}
                </Button>
              )}
            </div>

            {/* Expanded Customer List */}
            {isExpanded && hasOverflow && (
              <div className="animate-fade-in">
                <ScrollArea className="h-32 w-full">
                  <div className="grid grid-cols-6 gap-1 pb-2">
                    {stage.customers.slice(INITIAL_DISPLAY_COUNT).map((customer) => (
                      <CustomerDot key={customer.id} customer={customer} />
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mt-2"
                  onClick={toggleExpansion}
                >
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Remaining
                </Button>
              </div>
            )}
            
            {/* Additional Info */}
            <div className="text-xs text-gray-600 dark:text-gray-400">
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
