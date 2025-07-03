
import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { LifecycleStageProps } from "./LifecycleStage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedLifecycleProgressProps {
  stages: LifecycleStageProps[];
}

interface CategoryProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  status: 'completed' | 'in-progress' | 'not-started';
  color: string;
  bgColor: string;
}

export function EnhancedLifecycleProgress({ stages }: EnhancedLifecycleProgressProps) {
  const { overallProgress, categoryProgress } = useMemo(() => {
    if (!stages || stages.length === 0) {
      return { 
        overallProgress: { completed: 0, total: 0, percentage: 0 },
        categoryProgress: []
      };
    }

    // Calculate overall progress
    const totalStages = stages.filter(s => s.status !== 'not-applicable').length;
    const completedStages = stages.filter(s => s.status === 'done').length;
    const overallPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    // Group stages by category and calculate progress
    const categories = ['Pre-Sales', 'Sales', 'Implementation', 'Finance'];
    const categoryData: CategoryProgress[] = categories.map(categoryName => {
      const categoryStages = stages.filter(s => s.category === categoryName && s.status !== 'not-applicable');
      const categoryCompleted = categoryStages.filter(s => s.status === 'done').length;
      const categoryTotal = categoryStages.length;
      const categoryPercentage = categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0;
      
      let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
      if (categoryPercentage === 100) status = 'completed';
      else if (categoryPercentage > 0) status = 'in-progress';

      const colors = {
        'Pre-Sales': { color: 'text-blue-600', bgColor: 'bg-blue-500' },
        'Sales': { color: 'text-green-600', bgColor: 'bg-green-500' },
        'Implementation': { color: 'text-purple-600', bgColor: 'bg-purple-500' },
        'Finance': { color: 'text-orange-600', bgColor: 'bg-orange-500' }
      };

      return {
        name: categoryName,
        completed: categoryCompleted,
        total: categoryTotal,
        percentage: categoryPercentage,
        status,
        color: colors[categoryName as keyof typeof colors].color,
        bgColor: colors[categoryName as keyof typeof colors].bgColor
      };
    });

    return {
      overallProgress: {
        completed: completedStages,
        total: totalStages,
        percentage: overallPercentage
      },
      categoryProgress: categoryData
    };
  }, [stages]);

  const getStepperIcon = (category: CategoryProgress) => {
    switch (category.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-6 w-6 text-blue-500" />;
      default:
        return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepperDot = (category: CategoryProgress, index: number) => {
    const isLast = index === categoryProgress.length - 1;
    
    return (
      <div key={category.name} className="flex items-center">
        <div className="flex flex-col items-center space-y-2 relative">
          {/* Stepper Dot */}
          <div className={cn(
            "relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-105",
            category.status === 'completed' 
              ? "bg-green-50 border-green-500" 
              : category.status === 'in-progress'
              ? "bg-blue-50 border-blue-500"
              : "bg-gray-50 border-gray-300"
          )}>
            {category.status === 'completed' && (
              <div className={cn("w-6 h-6 rounded-full", category.bgColor)} />
            )}
            {category.status === 'in-progress' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-transparent" />
            )}
            {category.status === 'not-started' && (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
            )}
          </div>
          
          {/* Category Info */}
          <div className="text-center min-w-[80px]">
            <p className="text-sm font-medium text-gray-900 mb-1">{category.name}</p>
            <Badge variant="outline" className="text-xs">
              {category.total > 0 ? `${category.completed}/${category.total}` : '0/0'}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">{category.percentage}%</p>
          </div>
        </div>
        
        {/* Connection Line */}
        {!isLast && (
          <div className="flex-1 h-px bg-gray-300 mx-4 mt-[-40px]" />
        )}
      </div>
    );
  };

  return (
    <Card className="glass-card animate-fade-in mb-6">
      <CardContent className="p-6">
        {/* Overall Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Customer Lifecycle Progress</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{overallProgress.percentage}%</p>
              <p className="text-sm text-gray-500">
                {overallProgress.completed} of {overallProgress.total} completed
              </p>
            </div>
          </div>
          
          {/* Dynamic Progress Bar */}
          <div className="relative">
            <Progress 
              value={overallProgress.percentage} 
              className="h-3 bg-gray-200 rounded-full overflow-hidden"
            />
            <div 
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Visual Stepper */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 mb-4">Stage Progress</h4>
          
          {/* Desktop Horizontal Stepper */}
          <div className="hidden md:flex justify-between items-start">
            {categoryProgress.map((category, index) => getStepperDot(category, index))}
          </div>
          
          {/* Mobile Vertical Stepper */}
          <div className="md:hidden space-y-4">
            {categoryProgress.map((category, index) => (
              <div key={category.name} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  category.status === 'completed' 
                    ? "bg-green-50 border-green-500" 
                    : category.status === 'in-progress'
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 border-gray-300"
                )}>
                  {getStepperIcon(category)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {category.completed}/{category.total}
                    </Badge>
                    <span className="text-sm text-gray-500">{category.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
