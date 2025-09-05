
"use client";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function CircularProgress({ value, color = 'hsl(var(--chart-1))', className, strokeWidth = 10 }: CircularProgressProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn(`relative h-28 w-28`, className)}>
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.35s',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{value.toFixed(0)}%</span>
      </div>
    </div>
  );
}
