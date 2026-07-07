import React from 'react';
import { ResponsiveContainer, LineChart, Line, ReferenceLine, YAxis } from 'recharts';
import { AlertCircle, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { calculateForecast, formatMetricValue, calculateAnomaliesForSeries } from '../data/mockData';
import type { MetricData } from '../data/mockData';

interface KpiCardProps {
  metric: MetricData;
  onClick: () => void;
  isExpanded: boolean;
  gridClass: string;
  showGoalLine: boolean;
  showForecast: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  metric,
  onClick,
  isExpanded,
  gridClass,
  showGoalLine,
  showForecast,
}) => {
  const data = metric.data;
  const lastPoint = data[data.length - 1] || { date: 'Dec', value: 0, target: 0 };
  const value = lastPoint.value;
  const target = lastPoint.target;

  // Format currency vs standard metric dynamically
  const formattedValue = formatMetricValue(value, metric.unit);

  // Get MoM delta details dynamically
  const prevPoint = data[data.length - 2];
  const deltaVal = prevPoint && prevPoint.value !== 0
    ? +(((value - prevPoint.value) / prevPoint.value) * 100).toFixed(1)
    : 0;
  const isPositive = deltaVal >= 0;

  // YoY rate dynamic calculation
  const firstPoint = data[0];
  const yoyDelta = firstPoint && firstPoint.value !== 0
    ? +(((value - firstPoint.value) / firstPoint.value) * 100).toFixed(1)
    : 0;

  // Anomaly check on the latest month (or recent months) dynamically calculated
  const anomalies = calculateAnomaliesForSeries(data, metric.unit);
  const dataWithAnomalies = data.map((pt, idx) => ({
    ...pt,
    isAnomaly: anomalies[idx]?.isAnomaly,
    anomalyExplanation: anomalies[idx]?.explanation
  }));
  const latestAnomaly = dataWithAnomalies.slice(-3).find(pt => pt.isAnomaly);

  // Generate sparkline chart data (combining actuals and forecasted projection)
  const historicalChartData = data.map(pt => ({
    date: pt.date,
    actual: pt.value,
    target: pt.target,
  }));

  // Forecast calculations
  let sparklineData = [...historicalChartData];
  let forecastPoints: { date: string; actual?: number; forecast?: number; target?: number }[] = [];

  if (showForecast) {
    const rawValues = data.map(pt => ({ date: pt.date, value: pt.value }));
    const projectedVals = calculateForecast(rawValues, 3);
    const forecastDates = ["Jan*", "Feb*", "Mar*"];
    
    // Connect the last historical point with the first forecast point
    forecastPoints = [
      {
        date: lastPoint.date,
        forecast: lastPoint.value,
      },
      ...projectedVals.map((val, idx) => ({
        date: forecastDates[idx],
        forecast: val,
        target: lastPoint.target, // baseline target projected
      }))
    ];
  }

  // Determine delta colors based on metric characteristics (e.g. churn retention vs revenue)
  // For retention, drop is negative. For conversion/engagement/revenue, drop is negative.
  const isGoodDelta = isPositive;
  const deltaColorClass = isGoodDelta 
    ? 'text-editorial-sage bg-editorial-sage/5 dark:bg-editorial-sage/10' 
    : 'text-editorial-terracotta bg-editorial-terracotta/5 dark:bg-editorial-terracotta/10';

  // Target Achievement percentage
  const targetAchievement = ((value / target) * 100).toFixed(0);

  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between ${gridClass} group ${
        isExpanded ? 'ring-1 ring-editorial-ochre border-editorial-ochre dark:border-editorial-ochre' : ''
      }`}
    >
      {/* Top Banner: Metric Name and Target Goal Progress */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
            Performance Index
          </span>
          <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark mt-0.5">
            {metric.name}
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-sans text-ink-light/40 dark:text-ink-darkLight/40 uppercase tracking-widest">
            Goal Target
          </span>
          <span className="text-xs font-sans font-semibold text-ink-light/70 dark:text-ink-darkLight/70 flex items-center gap-1 mt-0.5">
            <Target className="w-3 h-3 text-editorial-ochre" />
            {targetAchievement}% met
          </span>
        </div>
      </div>

      {/* Main KPI Figures - Pull Quote Style */}
      <div className="my-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-serif text-5xl md:text-6xl font-black tracking-tight text-ink dark:text-ink-dark leading-none">
            {formattedValue}
          </span>
          
          {/* Muted Editorial Delta Badge */}
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-sans font-semibold uppercase tracking-wider ${deltaColorClass}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(deltaVal)}% MoM
          </span>
        </div>
        
        {/* Editorial YoY Subtitle */}
        <p className="text-[11px] font-sans text-ink-light/40 dark:text-ink-darkLight/40 mt-1">
          YoY Rate: <span className="font-medium text-ink-light/60 dark:text-ink-darkLight/60">{yoyDelta >= 0 ? '+' : ''}{yoyDelta}%</span>
        </p>
      </div>

      {/* Sparkline & Target Line Overlay */}
      <div className="h-16 w-full flex items-end mt-4 mb-2">
        <div className="w-2/3 h-full pr-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={sparklineData}
              margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
            >
              {/* Target Line Reference Overlay */}
              {showGoalLine && (
                <ReferenceLine 
                  y={target} 
                  stroke="#BF8A30" 
                  strokeDasharray="2 3" 
                  strokeWidth={1}
                />
              )}
              
              {/* YAxis with domain scaling to prevent sparkline looking flat */}
              <YAxis domain={['auto', 'auto']} hide />

              {/* Historical Line */}
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke={isPositive ? "#4A6F54" : "#B84A39"} 
                strokeWidth={2} 
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Dotted Forecast Tick overlay */}
          {showForecast && forecastPoints.length > 0 && (
            <div className="absolute inset-y-0 right-0 w-[40px] h-full pl-0.5 bg-paper/10 dark:bg-paper-dark/10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={forecastPoints}
                  margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                >
                  <YAxis domain={['auto', 'auto']} hide />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#BF8A30" 
                    strokeWidth={1.5} 
                    strokeDasharray="2 2"
                    dot={{ r: 1.5, fill: "#BF8A30", stroke: 'none' }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Simple 'Forecast' Label Tick */}
              <div className="absolute -top-3.5 right-0 text-[8px] font-sans font-bold tracking-widest text-editorial-ochre uppercase scale-90">
                Proj
              </div>
            </div>
          )}
        </div>

        {/* Small Inline Legend/Labels instead of standard legend box */}
        <div className="w-1/3 flex flex-col justify-end border-l border-ink/5 dark:border-ink-dark/5 pl-3 text-[10px] font-sans text-ink-light/50 dark:text-ink-darkLight/50 gap-0.5">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-editorial-sage' : 'bg-editorial-terracotta'}`} />
            <span>Actual Trend</span>
          </div>
          {showGoalLine && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-[1px] border-b border-dashed border-editorial-ochre" />
              <span>Goal Target</span>
            </div>
          )}
          {showForecast && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-[1px] border-b border-dotted border-editorial-ochre" />
              <span>Projection</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Anomaly Flags - Muted Editorial Callout instead of Red Badges */}
      {latestAnomaly ? (
        <div className="mt-4 pt-3 border-t border-ink/5 dark:border-ink-dark/5 flex items-start gap-2 text-[10px] font-sans text-editorial-ochre bg-editorial-ochre/5 dark:bg-editorial-ochre/10 p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold uppercase tracking-wider">Subtle Trend Deviation Detected</span>
            <p className="text-[10px] text-ink-light/80 dark:text-ink-darkLight/85 leading-normal mt-0.5">
              In {latestAnomaly.date}, value changed to {latestAnomaly.value.toLocaleString()} {metric.unit}. {latestAnomaly.anomalyExplanation || "Deviation from standard rolling average."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-ink/5 dark:border-ink-dark/5 flex justify-between items-center text-[10px] font-sans text-ink-light/40 dark:text-ink-darkLight/40">
          <span>Reporting Interval: 12 Months</span>
          <span className="font-medium group-hover:text-editorial-ochre transition-colors duration-150 flex items-center gap-0.5">
            Click to break down →
          </span>
        </div>
      )}
    </div>
  );
};
