import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  className = '',
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`metric-card ${className}`}>
      <div className="metric-card__header">
        <h3 className="metric-card__title">{title}</h3>
        {trend && (
          <span className={`metric-card__trend metric-card__trend--${trend}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
        )}
      </div>
      <div className="metric-card__value">{formatValue(value)}</div>
      {subtitle && <div className="metric-card__subtitle">{subtitle}</div>}
    </div>
  );
};
