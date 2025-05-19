import React from 'react';

interface GaugeProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  label?: string;
  textSize?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animate?: boolean;
}

export default function Gauge({ 
  value, 
  size = 120,
  thickness = 10,
  label,
  textSize = 'md',
  showValue = true,
  color = 'primary',
  animate = true
}: GaugeProps) {
  // Ensure value is between 0-100
  const safeValue = Math.min(100, Math.max(0, value));
  
  // Calculate angles and dimensions
  const startAngle = -135; // Start at -135 degrees
  const endAngle = 135; // End at 135 degrees
  const angleRange = endAngle - startAngle;
  const valueToDegrees = (val: number) => startAngle + (val / 100) * angleRange;
  const valueAngle = valueToDegrees(safeValue);
  
  // Convert degrees to radians for path calculation
  const degreesToRadians = (degrees: number) => degrees * Math.PI / 180;
  
  // Calculate outer and inner radius
  const radius = size / 2;
  const innerRadius = radius - thickness;
  
  // Calculate center coordinates
  const cx = size / 2;
  const cy = size / 2;
  
  // Calculate path coordinates
  const startRads = degreesToRadians(startAngle);
  const valueRads = degreesToRadians(valueAngle);
  
  // Calculate path arc points (outer arc)
  const startX = cx + innerRadius * Math.cos(startRads);
  const startY = cy + innerRadius * Math.sin(startRads);
  const endX = cx + innerRadius * Math.cos(valueRads);
  const endY = cy + innerRadius * Math.sin(valueRads);
  
  // Determine if the arc is more than 180 degrees (large-arc-flag)
  const largeArcFlag = safeValue > 50 ? 1 : 0;
  
  // Determine text size classes
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  // Determine color classes
  const colorClasses = {
    primary: 'text-primary fill-primary',
    success: 'text-green-500 fill-green-500',
    warning: 'text-amber-500 fill-amber-500',
    danger: 'text-red-500 fill-red-500',
  };
  
  // Generate track and value paths
  const trackPath = `
    M ${startX},${startY}
    A ${innerRadius},${innerRadius} 0 1,1 ${cx + innerRadius * Math.cos(degreesToRadians(endAngle))},${cy + innerRadius * Math.sin(degreesToRadians(endAngle))}
  `;
  
  const valuePath = `
    M ${startX},${startY}
    A ${innerRadius},${innerRadius} 0 ${largeArcFlag},1 ${endX},${endY}
  `;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg width={size} height={size} className="absolute inset-0">
          <path
            d={trackPath}
            fill="none"
            stroke="#e5e7eb"  // gray-200
            strokeWidth={thickness}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Value path */}
        <svg width={size} height={size} className="absolute inset-0">
          <path
            d={valuePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            className={`${colorClasses[color]} ${animate ? 'transition-all duration-1000' : ''}`}
          />
        </svg>
        
        {/* Center text and label */}
        {(showValue || label) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showValue && (
              <span className={`font-bold ${textSizeClasses[textSize]} ${colorClasses[color]}`}>
                {Math.round(safeValue)}%
              </span>
            )}
            {label && (
              <span className="text-xs text-gray-500 mt-1">{label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}