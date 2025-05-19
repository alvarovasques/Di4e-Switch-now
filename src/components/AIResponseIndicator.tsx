import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface AIResponseIndicatorProps {
  confidence: number;
}

const AIResponseIndicator: React.FC<AIResponseIndicatorProps> = ({ confidence }) => {
  // Determine color and icon based on confidence level
  let color = '';
  let Icon = HelpCircle;
  let label = '';
  
  if (confidence >= 0.9) {
    color = 'text-green-500';
    Icon = CheckCircle;
    label = 'Alta confiança';
  } else if (confidence >= 0.7) {
    color = 'text-blue-500';
    Icon = CheckCircle;
    label = 'Boa confiança';
  } else if (confidence >= 0.5) {
    color = 'text-yellow-500';
    Icon = HelpCircle;
    label = 'Confiança moderada';
  } else {
    color = 'text-red-500';
    Icon = AlertCircle;
    label = 'Baixa confiança';
  }
  
  return (
    <div className="relative group">
      <div className={`flex items-center ${color}`}>
        <Icon className="w-3 h-3" />
        <span className="ml-1 text-xs">{Math.round(confidence * 100)}%</span>
      </div>
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </div>
    </div>
  );
};

export default AIResponseIndicator;