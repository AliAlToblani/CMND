import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 800, 
  formatFn = (v) => v.toLocaleString(),
  className = ""
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatFn(displayValue)}</span>;
}

// Helper to parse formatted strings like "$774K" or "196" back to numbers
export function parseFormattedValue(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[$,]/g, '').trim();
  
  // Handle K, M, B suffixes
  const multipliers: Record<string, number> = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };
  
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();
    return suffix ? num * multipliers[suffix] : num;
  }
  
  // Try parsing as plain number
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Format number back to display format
export function formatAnimatedValue(value: number, originalFormat: string): string {
  // Detect original format and apply same formatting
  if (originalFormat.includes('$')) {
    if (originalFormat.includes('M')) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (originalFormat.includes('K')) {
      return `$${Math.round(value / 1000)}K`;
    }
    return `$${value.toLocaleString()}`;
  }
  
  if (originalFormat.includes('%')) {
    return `${value.toFixed(1)}%`;
  }
  
  if (originalFormat.includes('days')) {
    return `${Math.round(value)} days`;
  }
  
  // Plain number
  return Math.round(value).toLocaleString();
}

