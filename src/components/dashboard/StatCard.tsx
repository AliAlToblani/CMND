
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}

// Parse value string to extract numeric value and format info
function parseValue(value: string): { numericValue: number; prefix: string; suffix: string; decimals: number } {
  // Handle special cases like "N/A"
  if (value === "N/A" || value === "-" || !value) {
    return { numericValue: 0, prefix: "", suffix: "", decimals: 0 };
  }

  // Extract prefix (like $)
  const prefixMatch = value.match(/^([^0-9.-]*)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  
  // Extract suffix (like K, M, %, days)
  const suffixMatch = value.match(/([^0-9.,]+)$/);
  const suffix = suffixMatch ? suffixMatch[1] : "";
  
  // Extract number
  const numStr = value.replace(/[^0-9.-]/g, "");
  const numericValue = parseFloat(numStr) || 0;
  
  // Count decimals
  const decimalMatch = numStr.match(/\.(\d+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;
  
  return { numericValue, prefix, suffix, decimals };
}

// Animated value component
function AnimatedValue({ value, duration = 800 }: { value: string; duration?: number }) {
  const { numericValue, prefix, suffix, decimals } = parseValue(value);
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Only animate on first load or when value changes significantly
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }

    const startValue = hasAnimated.current ? previousValue.current : 0;
    const endValue = numericValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numericValue, duration]);

  // Format display value
  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  // Handle special display case
  if (value === "N/A" || value === "-") {
    return <>{value}</>;
  }

  return <>{prefix}{formattedValue}{suffix}</>;
}

export function StatCard({ title, value, description, icon, onClick, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="h-[140px] border-0 bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-8 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] h-[140px] border-0 bg-gradient-to-br from-card to-card/80" 
      onClick={onClick}
    >
      {/* Gradient accent bar on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <div className="text-primary w-5 h-5">
                {icon}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            <AnimatedValue value={value} />
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
