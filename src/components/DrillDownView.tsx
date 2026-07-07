import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { MessageSquare, Plus, X, Trash2, HelpCircle } from 'lucide-react';
import { calculateAnomaliesForSeries } from '../data/mockData';
import type { MetricData, Annotation } from '../data/mockData';

interface DrillDownViewProps {
  metric: MetricData;
  annotations: Annotation[];
  onAddAnnotation: (date: string, text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onClose: () => void;
  showGoalLine: boolean;
}

export const DrillDownView: React.FC<DrillDownViewProps> = ({
  metric,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onClose,
  showGoalLine,
}) => {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');

  // Prepare full data (historical + forecast if enabled)
  const data = metric.data;
  const lastPoint = data[data.length - 1] || { date: 'Dec', value: 0, target: 0 };
  const target = lastPoint.target;

  const anomalies = calculateAnomaliesForSeries(data, metric.unit);
  const chartData = data.map((pt, idx) => ({
    date: pt.date,
    actual: pt.value,
    target: pt.target,
    anomaly: anomalies[idx]?.isAnomaly ? pt.value : undefined,
  }));

  // Click handler on chart point
  const handleChartClick = (state: any) => {
    if (state && state.activeLabel) {
      setActiveDate(state.activeLabel);
    }
  };

  // Find annotations for active metric and specific date
  const filteredAnnotations = annotations.filter(
    ann => ann.metricId === metric.id
  );
  
  const dateAnnotations = activeDate 
    ? filteredAnnotations.filter(ann => ann.date === activeDate)
    : [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotationText.trim() || !activeDate) return;
    onAddAnnotation(activeDate, newAnnotationText);
    setNewAnnotationText('');
  };

  return (
    <div className="bg-paper-card dark:bg-paper-cardDark border-3 border-ink dark:border-ink-dark/30 p-6 my-6 transition-all duration-500 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex justify-between items-center border-b border-ink/10 dark:border-ink-dark/10 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
            Granular Breakdown View
          </span>
          <h2 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark mt-1">
            {metric.name} Historical Trends & Channel Attribution
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 border border-ink/10 dark:border-ink-dark/10 hover:bg-paper dark:hover:bg-paper-dark text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark transition-colors duration-150"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Big Detailed Chart */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-sans text-ink-light/60 dark:text-ink-darkLight/60">
                Click any point on the chart to pin editorial annotations.
              </p>
              <div className="flex gap-4 text-xs font-sans text-ink-light/50 dark:text-ink-darkLight/50">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-editorial-sage/30 border border-editorial-sage rounded-sm" />
                  Actual
                </span>
                {showGoalLine && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-[1px] border-b border-dashed border-editorial-ochre" />
                    Target Goal
                  </span>
                )}
              </div>
            </div>
            
            {/* Recharts Chart Area */}
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onClick={handleChartClick}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A6F54" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4A6F54" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2DDD5' }}
                    tick={{ fill: '#6B6864', fontSize: 10, fontFamily: 'DM Sans' }}
                  />
                  
                  <YAxis 
                    tickLine={false}
                    axisLine={{ stroke: '#E2DDD5' }}
                    tick={{ fill: '#6B6864', fontSize: 10, fontFamily: 'DM Sans' }}
                    domain={['auto', 'auto']}
                  />
                  
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FAF8F5',
                      border: '1px solid #E2DDD5',
                      color: '#1E1C19',
                      fontFamily: 'DM Sans',
                      fontSize: '12px'
                    }}
                  />
                  
                  {showGoalLine && (
                    <ReferenceLine 
                      y={target} 
                      stroke="#BF8A30" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: `Target Goal: ${target.toLocaleString()} ${metric.unit}`, 
                        fill: '#BF8A30', 
                        position: 'top',
                        fontSize: 9,
                        fontFamily: 'DM Sans',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  
                  {/* Highlight any pre-pinned annotations with flags on the X axis */}
                  {filteredAnnotations.map((ann, idx) => (
                    <ReferenceLine
                      key={`ref-ann-${idx}`}
                      x={ann.date}
                      stroke="#BF8A30"
                      strokeWidth={0.5}
                      strokeDasharray="2 2"
                    />
                  ))}

                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#4A6F54" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#actualColor)"
                    activeDot={{ r: 5, fill: "#4A6F54", strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Annotations List under Chart */}
          <div className="mt-6 pt-4 border-t border-ink/5 dark:border-ink-dark/5">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-4 h-4 text-editorial-ochre" />
              Pinned Editorial Notes
            </h4>
            
            {filteredAnnotations.length === 0 ? (
              <p className="text-xs font-sans text-ink-light/50 dark:text-ink-darkLight/50 italic py-2">
                No annotations pinned to this report yet. Click points on the chart to log notes.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-28 overflow-y-auto pr-2">
                {filteredAnnotations.map((ann) => (
                  <div 
                    key={ann.id} 
                    className="bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark p-2.5 flex justify-between items-start gap-2"
                  >
                    <div>
                      <div className="flex gap-2 items-center">
                        <span className="px-1.5 py-0.5 bg-editorial-ochre/10 text-editorial-ochre font-sans text-[9px] uppercase font-bold tracking-wider rounded-sm">
                          {ann.date}
                        </span>
                        <span className="text-[10px] text-ink-light/40 dark:text-ink-darkLight/40 font-sans font-medium">
                          By {ann.author}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-ink-light/85 dark:text-ink-darkLight/90 mt-1">
                        {ann.text}
                      </p>
                    </div>
                    <button 
                      onClick={() => onDeleteAnnotation(ann.id)}
                      className="text-ink-light/30 hover:text-editorial-terracotta transition-colors duration-150 p-1"
                      title="Delete annotation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Channel Breakdown Table & Interactive Annotation Composer */}
        <div className="flex flex-col gap-6">
          {/* Table Breakdown */}
          <div className="border border-paper-border dark:border-paper-borderDark bg-paper dark:bg-paper-dark p-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark border-b border-paper-border dark:border-paper-borderDark pb-2 mb-3">
              Channel Attribution Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="text-ink-light/40 dark:text-ink-darkLight/40 font-bold uppercase tracking-wider text-[9px] border-b border-paper-border dark:border-paper-borderDark">
                    <th className="pb-1.5">Acquisition Channel</th>
                    <th className="pb-1.5 text-right">Contrib. %</th>
                    <th className="pb-1.5 text-right">Attributed Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-border/30 dark:divide-paper-borderDark/30">
                  {(() => {
                    const dynamicBreakdown = [
                      { channel: "Organic Traffic / Search", percentage: 45, value: +(lastPoint.value * 0.45) },
                      { channel: "Direct Referrals / Portals", percentage: 35, value: +(lastPoint.value * 0.35) },
                      { channel: "External Campaigns / Social", percentage: 20, value: +(lastPoint.value * 0.20) }
                    ];
                    return dynamicBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-paper-card/45 dark:hover:bg-paper-cardDark/45 transition-colors duration-150">
                        <td className="py-2 text-ink-light/80 dark:text-ink-darkLight/85 font-medium">{row.channel}</td>
                        <td className="py-2 text-right font-medium text-ink-light/60 dark:text-ink-darkLight/60">{row.percentage}%</td>
                        <td className="py-2 text-right font-serif font-bold text-ink dark:text-ink-dark">
                          {metric.unit === '₹' ? '₹' : ''}
                          {row.value.toLocaleString('en-IN', { maximumFractionDigits: metric.unit === '%' ? 2 : 0 })}
                          {metric.unit === '%' ? '%' : ''}
                          {metric.unit === 'days' ? ' days' : ''}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Annotation Editor Box */}
          <div className="border border-paper-border dark:border-paper-borderDark bg-paper dark:bg-paper-dark p-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark border-b border-paper-border dark:border-paper-borderDark pb-2 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-editorial-ochre" />
              Pin Metric Note
            </h4>

            {activeDate ? (
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-sans font-bold uppercase tracking-wider text-ink-light/40 dark:text-ink-darkLight/40 mb-1">
                    Selected Reporting Period
                  </label>
                  <span className="inline-block px-2.5 py-1 bg-editorial-ochre text-paper dark:text-paper-dark font-sans text-[10px] uppercase font-bold tracking-widest rounded-sm">
                    {activeDate} Report
                  </span>
                </div>

                {dateAnnotations.length > 0 && (
                  <div className="text-[10px] text-ink-light/50 dark:text-ink-darkLight/50 italic bg-paper-card dark:bg-paper-cardDark p-2 border-l border-editorial-ochre">
                    Contains {dateAnnotations.length} existing annotation(s).
                  </div>
                )}

                <div>
                  <label htmlFor="note-text" className="block text-[9px] font-sans font-bold uppercase tracking-wider text-ink-light/40 dark:text-ink-darkLight/40 mb-1">
                    Annotation / Observation Note
                  </label>
                  <textarea
                    id="note-text"
                    className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark text-xs font-sans outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre focus:ring-1 focus:ring-editorial-ochre"
                    placeholder="Enter observation notes, core campaigns launched, or system exceptions..."
                    rows={3}
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark py-1.5 px-3 text-xs uppercase tracking-wider font-bold font-sans hover:bg-editorial-ochre dark:hover:bg-editorial-ochre hover:text-paper transition-colors duration-150"
                  >
                    Pin Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDate(null)}
                    className="border border-paper-border dark:border-paper-borderDark text-ink-light/60 dark:text-ink-darkLight/60 py-1.5 px-3 text-xs uppercase tracking-wider font-bold font-sans hover:bg-paper-card/65 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center text-ink-light/40 dark:text-ink-darkLight/40">
                <HelpCircle className="w-6 h-6 mx-auto text-ink-light/20 mb-2" />
                <p className="text-xs font-sans">
                  Click on any monthly data node in the trend chart above to start pinning a local observation.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
