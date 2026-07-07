export interface DataPoint {
  date: string; // Jan, Feb, ...
  value: number;
  target: number;
}

export interface ChannelBreakdown {
  channel: string;
  percentage: number;
  value: number;
}

export interface MetricData {
  id: string; // e.g. "revenue", "engagement", "conversion", "retention", "turnaround" or custom names
  name: string;
  unit: string; // "₹", "%", "days", etc.
  data: DataPoint[];
}

export interface Annotation {
  id: string;
  metricId: string;
  date: string;
  text: string;
  author: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  description: string;
  primaryGoal: string;
  colorTag: string; // e.g. "sage", "ochre", "terracotta"
  metrics: {
    [metricId: string]: MetricData;
  };
  annotations: Annotation[];
}

// Simple linear regression forecast helper
export function calculateForecast(dataPoints: { date: string; value: number }[], steps: number = 3): number[] {
  const n = dataPoints.length;
  if (n === 0) return [];
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += dataPoints[i].value;
    sumXY += i * dataPoints[i].value;
    sumXX += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  
  const forecasts: number[] = [];
  for (let i = 0; i < steps; i++) {
    forecasts.push(slope * (n + i) + intercept);
  }
  return forecasts;
}

// Recalculates currentValue string based on unit
export function formatMetricValue(value: number, unit: string): string {
  if (unit === '₹') {
    return '₹' + value.toLocaleString('en-IN');
  }
  if (unit === '%') {
    return value.toFixed(2) + '%';
  }
  if (unit === 'days') {
    return value.toFixed(1) + ' days';
  }
  return value.toLocaleString() + (unit ? ` ${unit}` : '');
}

// Simple rolling average anomaly detection
export function calculateAnomaliesForSeries(
  data: { date: string; value: number }[],
  unit: string
): { isAnomaly: boolean; explanation?: string }[] {
  const result: { isAnomaly: boolean; explanation?: string }[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < 3) {
      result.push({ isAnomaly: false });
      continue;
    }
    
    // Mean of previous 3 points (excluding current)
    const prevWindow = data.slice(i - 3, i).map(d => d.value);
    const mean = prevWindow.reduce((a, b) => a + b, 0) / 3;
    
    // Standard deviation of previous 3 points
    const variance = prevWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 3;
    const stdDev = Math.sqrt(variance) || (mean * 0.05); // fallback stddev if flat
    
    const currentValue = data[i].value;
    const diff = Math.abs(currentValue - mean);
    
    // Threshold triggers anomaly if it deviates > 1.75 standard deviations
    const isAnomaly = diff > (1.75 * stdDev) && i > 3;
    
    if (isAnomaly) {
      const changePct = (((currentValue - mean) / (mean || 1)) * 100).toFixed(0);
      const direction = currentValue > mean ? "surge" : "dip";
      const formattedMean = formatMetricValue(mean, unit);
      
      result.push({
        isAnomaly: true,
        explanation: `Unexpected ${direction} of ${Math.abs(Number(changePct))}% compared to the rolling 3-month average of ${formattedMean}`
      });
    } else {
      result.push({ isAnomaly: false });
    }
  }
  return result;
}

// Initial template data loaded on first boot
export const DEFAULT_CLIENT: Client = {
  id: "aether",
  name: "Aether Cosmetics",
  industry: "DTC Luxury Skincare",
  description: "DTC clean-ingredient luxury skincare brand focused on customer retention and holiday sales optimization.",
  primaryGoal: "Maximize Customer Lifetime Value & Holiday Revenue Conversion",
  colorTag: "sage",
  annotations: [
    { id: "a1", metricId: "revenue", date: "Nov", text: "Black Friday and Cyber Monday campaign outperformance.", author: "E. Markham" },
    { id: "a2", metricId: "engagement", date: "Jun", text: "Viral TikTok influencer collaboration goes live.", author: "L. Thorne" },
    { id: "a3", metricId: "conversion", date: "Sep", text: "Checkout redesign rolled out; checkout speed improved.", author: "T. Chen" }
  ],
  metrics: {
    revenue: {
      id: "revenue",
      name: "Revenue",
      unit: "₹",
      data: [
        { date: "Jan", value: 320000, target: 300000 },
        { date: "Feb", value: 310000, target: 310000 },
        { date: "Mar", value: 350000, target: 320000 },
        { date: "Apr", value: 330000, target: 330000 },
        { date: "May", value: 380000, target: 350000 },
        { date: "Jun", value: 410000, target: 370000 },
        { date: "Jul", value: 390000, target: 380000 },
        { date: "Aug", value: 385000, target: 390000 },
        { date: "Sep", value: 420000, target: 400000 },
        { date: "Oct", value: 435000, target: 420000 },
        { date: "Nov", value: 580000, target: 480000 }, // programmatic anomaly detected due to spike
        { date: "Dec", value: 542000, target: 500000 }
      ]
    },
    engagement: {
      id: "engagement",
      name: "Engagement Rate",
      unit: "%",
      data: [
        { date: "Jan", value: 4.2, target: 4.0 },
        { date: "Feb", value: 4.5, target: 4.1 },
        { date: "Mar", value: 4.8, target: 4.2 },
        { date: "Apr", value: 4.7, target: 4.3 },
        { date: "May", value: 5.1, target: 4.4 },
        { date: "Jun", value: 6.9, target: 4.5 }, // programmatic anomaly detected
        { date: "Jul", value: 6.2, target: 4.6 },
        { date: "Aug", value: 5.9, target: 4.7 },
        { date: "Sep", value: 6.1, target: 4.8 },
        { date: "Oct", value: 6.3, target: 4.9 },
        { date: "Nov", value: 6.08, target: 5.0 },
        { date: "Dec", value: 5.82, target: 5.1 }
      ]
    },
    conversion: {
      id: "conversion",
      name: "Conversion Rate",
      unit: "%",
      data: [
        { date: "Jan", value: 2.8, target: 3.0 },
        { date: "Feb", value: 2.9, target: 3.0 },
        { date: "Mar", value: 3.1, target: 3.1 },
        { date: "Apr", value: 3.0, target: 3.1 },
        { date: "May", value: 3.2, target: 3.2 },
        { date: "Jun", value: 3.1, target: 3.2 },
        { date: "Jul", value: 3.0, target: 3.3 },
        { date: "Aug", value: 2.9, target: 3.3 },
        { date: "Sep", value: 3.6, target: 3.4 },
        { date: "Oct", value: 3.5, target: 3.4 },
        { date: "Nov", value: 3.26, target: 3.5 },
        { date: "Dec", value: 3.48, target: 3.5 }
      ]
    },
    retention: {
      id: "retention",
      name: "Retention Rate",
      unit: "%",
      data: [
        { date: "Jan", value: 81.2, target: 80.0 },
        { date: "Feb", value: 80.5, target: 80.0 },
        { date: "Mar", value: 79.8, target: 80.5 },
        { date: "Apr", value: 80.1, target: 80.5 },
        { date: "May", value: 79.5, target: 81.0 },
        { date: "Jun", value: 78.9, target: 81.0 },
        { date: "Jul", value: 79.2, target: 81.5 },
        { date: "Aug", value: 78.4, target: 81.5 },
        { date: "Sep", value: 79.0, target: 82.0 },
        { date: "Oct", value: 78.8, target: 82.0 },
        { date: "Nov", value: 79.3, target: 82.5 },
        { date: "Dec", value: 78.4, target: 82.5 }
      ]
    },
    turnaround: {
      id: "turnaround",
      name: "Report Turnaround Time",
      unit: "days",
      data: [
        { date: "Jan", value: 3.2, target: 3.0 },
        { date: "Feb", value: 3.1, target: 3.0 },
        { date: "Mar", value: 2.8, target: 2.8 },
        { date: "Apr", value: 2.9, target: 2.8 },
        { date: "May", value: 2.5, target: 2.5 },
        { date: "Jun", value: 2.4, target: 2.5 },
        { date: "Jul", value: 2.6, target: 2.5 },
        { date: "Aug", value: 2.3, target: 2.4 },
        { date: "Sep", value: 3.5, target: 2.4 }, // programmatic anomaly detected
        { date: "Oct", value: 2.2, target: 2.3 },
        { date: "Nov", value: 2.1, target: 2.2 },
        { date: "Dec", value: 1.8, target: 2.0 }
      ]
    }
  }
};

export function createNewClient(id: string, name: string, industry: string, primaryGoal: string): Client {
  // Generate distinct baseline values to make client metrics look realistic
  const revenueScale = Math.floor(Math.random() * 400000) + 150000;
  const engagementScale = +(Math.random() * 4 + 3).toFixed(2);
  const conversionScale = +(Math.random() * 2.5 + 2).toFixed(2);
  const retentionScale = +(Math.random() * 10 + 80).toFixed(1);
  const turnaroundScale = +(Math.random() * 2 + 2).toFixed(1);

  const generateSeries = (baseline: number, unit: string) => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i];
      const trend = (Math.random() * 0.12 - 0.04);
      const value = +(baseline * (1 + trend * (i / 11))).toFixed(unit === '%' ? 2 : unit === 'days' ? 1 : 0);
      const target = +(baseline * (1 + 0.04 * (i / 11))).toFixed(unit === '%' ? 2 : unit === 'days' ? 1 : 0);
      return { date, value, target };
    });
  };

  return {
    id,
    name,
    industry,
    description: `Registered workspace client: ${name}. Dedicated to performance targeting.`,
    primaryGoal,
    colorTag: 'sage',
    annotations: [
      { id: `ann-${id}-1`, metricId: 'revenue', date: 'Oct', text: 'Baseline registered corporate parameters established.', author: 'Systems' }
    ],
    metrics: {
      revenue: {
        id: 'revenue',
        name: 'Revenue',
        unit: '₹',
        data: generateSeries(revenueScale, '₹')
      },
      engagement: {
        id: 'engagement',
        name: 'Engagement Rate',
        unit: '%',
        data: generateSeries(engagementScale, '%')
      },
      conversion: {
        id: 'conversion',
        name: 'Conversion Rate',
        unit: '%',
        data: generateSeries(conversionScale, '%')
      },
      retention: {
        id: 'retention',
        name: 'Retention Rate',
        unit: '%',
        data: generateSeries(retentionScale, '%')
      },
      turnaround: {
        id: 'turnaround',
        name: 'Report Turnaround Time',
        unit: 'days',
        data: generateSeries(turnaroundScale, 'days')
      }
    }
  };
}
