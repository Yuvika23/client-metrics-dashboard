import React, { useState, useRef } from 'react';
import type { Client, MetricData, DataPoint } from '../data/mockData';
import { Save, Plus, Trash2, Upload, AlertCircle, Check, FileSpreadsheet } from 'lucide-react';

interface DataManagementProps {
  activeClient: Client;
  onUpdateClientMetrics: (clientId: string, metrics: { [key: string]: MetricData }) => void;
  onUpdateClientMetadata: (clientId: string, name: string, industry: string, goal: string, colorTag: string) => void;
  onDeleteClient: (clientId: string) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DataManagement: React.FC<DataManagementProps> = ({
  activeClient,
  onUpdateClientMetrics,
  onUpdateClientMetadata,
  onDeleteClient,
}) => {
  // Navigation tabs within Management view
  const [mgmtTab, setMgmtTab] = useState<'manual' | 'csv' | 'settings'>('manual');

  // Metadata form states
  const [clientName, setClientName] = useState(activeClient.name);
  const [clientIndustry, setClientIndustry] = useState(activeClient.industry);
  const [clientGoal, setClientGoal] = useState(activeClient.primaryGoal);
  const [clientColor, setClientColor] = useState(activeClient.colorTag || 'sage');

  // Manual Editor states
  const [selectedMetricId, setSelectedMetricId] = useState<string>(
    Object.keys(activeClient.metrics)[0] || 'revenue'
  );
  
  // Create a copy of the selected metric's data points for local editing
  const activeMetric = activeClient.metrics[selectedMetricId];
  const [localData, setLocalData] = useState<DataPoint[]>(() => {
    return activeMetric ? JSON.parse(JSON.stringify(activeMetric.data)) : [];
  });

  // Re-sync local state when the active client or selected metric changes
  React.useEffect(() => {
    if (activeMetric) {
      setLocalData(JSON.parse(JSON.stringify(activeMetric.data)));
    }
  }, [selectedMetricId, activeClient.id]);

  // Sync client metadata forms when activeClient changes
  React.useEffect(() => {
    setClientName(activeClient.name);
    setClientIndustry(activeClient.industry);
    setClientGoal(activeClient.primaryGoal);
    setClientColor(activeClient.colorTag || 'sage');
    setSelectedMetricId(Object.keys(activeClient.metrics)[0] || 'revenue');
  }, [activeClient.id]);

  // Custom Metric form states
  const [customMetricName, setCustomMetricName] = useState('');
  const [customMetricUnit, setCustomMetricUnit] = useState('₹');

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle manual input cell change
  const handleCellChange = (index: number, field: 'value' | 'target', rawVal: string) => {
    const numericVal = parseFloat(rawVal) || 0;
    setLocalData(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: numericVal
      };
      return copy;
    });
  };

  // Save manual edits
  const handleSaveManualData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMetric) return;

    const updatedMetrics = { ...activeClient.metrics };
    updatedMetrics[selectedMetricId] = {
      ...activeMetric,
      data: localData
    };

    onUpdateClientMetrics(activeClient.id, updatedMetrics);
    triggerToast(`Data updated for index: ${activeMetric.name}`);
  };

  // Add Custom Metric
  const handleCreateCustomMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMetricName.trim()) return;

    const metricId = customMetricName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (activeClient.metrics[metricId]) {
      triggerToast(`Metric with key "${metricId}" already exists.`);
      return;
    }

    // Initialize with standard 12 months at baseline values
    const baselineData: DataPoint[] = MONTHS.map(m => ({
      date: m,
      value: 0,
      target: 0
    }));

    const newMetric: MetricData = {
      id: metricId,
      name: customMetricName,
      unit: customMetricUnit,
      data: baselineData
    };

    const updatedMetrics = {
      ...activeClient.metrics,
      [metricId]: newMetric
    };

    onUpdateClientMetrics(activeClient.id, updatedMetrics);
    setCustomMetricName('');
    setSelectedMetricId(metricId);
    triggerToast(`Custom metric index "${customMetricName}" registered!`);
  };

  const handleLoadSampleDataClick = () => {
    const text = `Month, Revenue, EngagementRate, ConversionRate, RetentionRate, TurnaroundTime
Jan, 400000, 5.2, 3.1, 85.0, 2.5
Feb, 420000, 5.5, 3.2, 84.5, 2.4
Mar, 450000, 5.8, 3.4, 83.8, 2.2
Apr, 430000, 5.7, 3.3, 84.1, 2.3
May, 480000, 6.1, 3.5, 83.5, 2.0
Jun, 510000, 7.9, 3.4, 82.9, 1.9
Jul, 490000, 7.2, 3.3, 83.2, 2.1
Aug, 485000, 6.9, 3.2, 82.4, 1.8
Sep, 520000, 7.1, 3.9, 83.0, 2.9
Oct, 535000, 7.3, 3.8, 82.8, 1.7
Nov, 680000, 7.0, 3.5, 83.3, 1.6
Dec, 642000, 6.8, 3.7, 82.4, 1.4`;

    setCsvFile(new File([text], "sample_metrics.csv", { type: "text/csv" }));
    setCsvError(null);

    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    setCsvHeaders(lines[0].split(',').map(h => h.trim()));

    const monthIndex = headers.findIndex(h => h === 'month' || h === 'date');
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const rowObj: any = {};
      
      headers.forEach((header, idx) => {
        const rawVal = cols[idx] || '0';
        if (idx === monthIndex) {
          rowObj[header] = rawVal;
        } else {
          rowObj[header] = parseFloat(rawVal) || 0;
        }
      });
      rows.push(rowObj);
    }
    setCsvPreview(rows);
  };

  // Process CSV upload file
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);
    setCsvPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Empty file content");

        // Split lines
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) throw new Error("CSV must contain at least a header row and one data row.");

        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        setCsvHeaders(lines[0].split(',').map(h => h.trim()));

        // We require 'month' or 'date' column
        const monthIndex = headers.findIndex(h => h === 'month' || h === 'date');
        if (monthIndex === -1) {
          throw new Error("Missing required column header: 'Month' or 'Date'.");
        }

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const rowObj: any = {};
          
          headers.forEach((header, idx) => {
            const rawVal = cols[idx] || '0';
            if (idx === monthIndex) {
              rowObj[header] = rawVal;
            } else {
              rowObj[header] = parseFloat(rawVal) || 0;
            }
          });
          rows.push(rowObj);
        }

        // Limit preview size to max 12 rows
        setCsvPreview(rows.slice(0, 12));
      } catch (err: any) {
        setCsvError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Commit parsed CSV to active client state (overwriting existing metrics)
  const handleImportCsv = () => {
    if (!csvPreview || !csvFile) return;

    try {
      const updatedMetrics: { [key: string]: MetricData } = {};
      const headersMap = csvHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const monthIdx = headersMap.findIndex(h => h === 'month' || h === 'date');
      
      if (monthIdx === -1) {
        throw new Error("Month column not found.");
      }
      
      const monthHeaderKey = csvHeaders[monthIdx].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Loop through all columns except the month column
      csvHeaders.forEach((header, idx) => {
        if (idx === monthIdx) return;
        
        const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        let mId = cleanHeader;
        let mName = header;

        // Map common terms to standard metric IDs for standard layout/icons
        if (cleanHeader.includes('revenue') || cleanHeader === 'sales') {
          mId = 'revenue';
          mName = 'Revenue';
        } else if (cleanHeader.includes('engagement')) {
          mId = 'engagement';
          mName = 'Engagement Rate';
        } else if (cleanHeader.includes('conversion')) {
          mId = 'conversion';
          mName = 'Conversion Rate';
        } else if (cleanHeader.includes('retention')) {
          mId = 'retention';
          mName = 'Retention Rate';
        } else if (cleanHeader.includes('turnaround')) {
          mId = 'turnaround';
          mName = 'Report Turnaround Time';
        } else {
          // Format custom headers as Title Case
          mName = header
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .trim();
          mName = mName.charAt(0).toUpperCase() + mName.slice(1);
        }

        // Auto-detect unit
        let unit = '';
        if (cleanHeader.includes('rate') || cleanHeader.includes('percent') || cleanHeader.includes('%')) {
          unit = '%';
        } else if (cleanHeader.includes('revenue') || cleanHeader.includes('cost') || cleanHeader.includes('price') || cleanHeader.includes('₹') || cleanHeader.includes('inr') || cleanHeader.includes('sales')) {
          unit = '₹';
        } else if (cleanHeader.includes('days') || cleanHeader.includes('time') || cleanHeader.includes('turnaround')) {
          unit = 'days';
        }

        // Map values month by month
        const updatedSeries: DataPoint[] = MONTHS.map(m => {
          const parsedRow = csvPreview.find(row => 
            row[monthHeaderKey] && row[monthHeaderKey].toString().toLowerCase().startsWith(m.toLowerCase())
          );
          
          const value = parsedRow ? parseFloat(parsedRow[cleanHeader]) || 0 : 0;
          const target = value * 0.95; // auto-target helper baseline
          
          return {
            date: m,
            value,
            target
          };
        });

        updatedMetrics[mId] = {
          id: mId,
          name: mName,
          unit,
          data: updatedSeries
        };
      });

      onUpdateClientMetrics(activeClient.id, updatedMetrics);
      triggerToast("CSV Metrics successfully parsed and imported!");
      setCsvFile(null);
      setCsvPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setCsvError("Error mapping CSV columns to metrics: " + err.message);
    }
  };

  // Update metadata form
  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientIndustry.trim()) return;
    onUpdateClientMetadata(activeClient.id, clientName, clientIndustry, clientGoal, clientColor);
    triggerToast("Client metadata updated.");
  };

  // Delete workspace safeguard
  const handleDeleteTrigger = () => {
    const confirmation = window.confirm(`CAUTION: You are about to delete client workspace "${activeClient.name}". This deletes all data entries and cannot be undone. Proceed?`);
    if (confirmation) {
      onDeleteClient(activeClient.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark border border-editorial-ochre p-4 shadow-xl flex items-center gap-3 animate-slideIn">
          <Check className="w-5 h-5 text-editorial-ochre" />
          <span className="text-sm font-sans font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Left Column (lg:col-span-3): Secondary Navigation */}
      <div className="lg:col-span-3 bg-paper-card/60 dark:bg-paper-cardDark/60 border border-paper-border dark:border-paper-borderDark p-5 no-print">
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark border-b border-paper-border dark:border-paper-borderDark pb-2.5 mb-4">
          Data Management
        </h3>
        <nav className="flex flex-col gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
          <button
            onClick={() => setMgmtTab('manual')}
            className={`w-full text-left p-3 border transition-all duration-150 ${
              mgmtTab === 'manual'
                ? 'bg-paper dark:bg-paper-dark border-editorial-ochre border-l-3 text-ink dark:text-ink-dark font-bold'
                : 'border-transparent text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Manual Metrics Grid
          </button>
          
          <button
            onClick={() => setMgmtTab('csv')}
            className={`w-full text-left p-3 border transition-all duration-150 ${
              mgmtTab === 'csv'
                ? 'bg-paper dark:bg-paper-dark border-editorial-ochre border-l-3 text-ink dark:text-ink-dark font-bold'
                : 'border-transparent text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            CSV Spreadsheet Upload
          </button>

          <button
            onClick={() => setMgmtTab('settings')}
            className={`w-full text-left p-3 border transition-all duration-150 ${
              mgmtTab === 'settings'
                ? 'bg-paper dark:bg-paper-dark border-editorial-ochre border-l-3 text-ink dark:text-ink-dark font-bold'
                : 'border-transparent text-ink-light/60 dark:text-ink-darkLight/60 hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Workspace Settings
          </button>
        </nav>

        {/* Dynamic Custom Metric Panel (Visible inside Data entries tabs) */}
        {mgmtTab !== 'settings' && (
          <div className="mt-8 pt-5 border-t border-paper-border dark:border-paper-borderDark">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark mb-3 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-editorial-ochre" />
              Add Metric Index
            </h4>
            <form onSubmit={handleCreateCustomMetric} className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50">
                  Metric Title / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAC Cost"
                  className="w-full p-2 bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark text-xs"
                  value={customMetricName}
                  onChange={e => setCustomMetricName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50">
                  Currency/Unit Tag
                </label>
                <select
                  className="w-full p-2 bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark text-xs cursor-pointer"
                  value={customMetricUnit}
                  onChange={e => setCustomMetricUnit(e.target.value)}
                >
                  <option value="₹">Rupee Symbol (₹)</option>
                  <option value="%">Percent Ratio (%)</option>
                  <option value="days">Interval Duration (days)</option>
                  <option value="">No custom unit</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark font-bold uppercase tracking-wider text-[10px] hover:bg-editorial-ochre transition-colors duration-150"
              >
                Create Custom Metric
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Right Column (lg:col-span-9): Form Panels */}
      <div className="lg:col-span-9 bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark p-6 shadow-md">
        
        {/* Tab 1: Manual Data entries grid table */}
        {mgmtTab === 'manual' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-paper-border dark:border-paper-borderDark pb-4 gap-4">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
                  Grid Entry Console
                </span>
                <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark mt-0.5">
                  Manual Monthly Metrics Input
                </h2>
              </div>
              
              {/* Metric Dropdown Selector */}
              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="font-semibold text-ink-light/60">Active Index:</span>
                <select
                  className="p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark font-bold"
                  value={selectedMetricId}
                  onChange={e => setSelectedMetricId(e.target.value)}
                >
                  {Object.values(activeClient.metrics).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit || 'no unit'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeMetric ? (
              <form onSubmit={handleSaveManualData} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-ink/10 dark:border-ink-dark/15 text-ink-light/50 dark:text-ink-darkLight/50 font-bold uppercase tracking-wider text-[9px] pb-2">
                        <th className="py-2.5">Reporting Month</th>
                        <th className="py-2.5">Actual Value ({activeMetric.unit})</th>
                        <th className="py-2.5">Target Threshold ({activeMetric.unit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-border/30 dark:divide-paper-borderDark/30">
                      {localData.map((pt, idx) => (
                        <tr key={pt.date} className="hover:bg-paper-card/30 transition-colors duration-150">
                          <td className="py-2.5 font-bold text-ink dark:text-ink-dark">{pt.date}</td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="any"
                              required
                              className="p-1.5 w-32 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark text-xs font-semibold outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre"
                              value={pt.value}
                              onChange={e => handleCellChange(idx, 'value', e.target.value)}
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="any"
                              required
                              className="p-1.5 w-32 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark text-xs font-semibold outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre"
                              value={pt.target}
                              onChange={e => handleCellChange(idx, 'target', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-4 border-t border-paper-border dark:border-paper-borderDark justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-editorial-ochre text-paper font-bold uppercase tracking-wider text-xs hover:bg-ink dark:hover:bg-ink-dark hover:text-paper transition-all duration-150 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Grid Data</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-ink-light/40 dark:text-ink-darkLight/40 font-serif italic">
                No active metrics configuration found. Create a custom metric on the left.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: CSV Spreadsheet Upload Dropzone */}
        {mgmtTab === 'csv' && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
                Bulk Load Interface
              </span>
              <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark mt-0.5">
                CSV Document Processing
              </h2>
            </div>

            {/* Instruction Callout Box */}
            <div className="bg-paper-card/50 dark:bg-paper-cardDark/50 border border-paper-border dark:border-paper-borderDark p-4 font-sans text-xs text-ink-light/80 dark:text-ink-darkLight/85 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-editorial-ochre block">
                Required CSV Formatting Standards:
              </span>
              <p>
                The spreadsheet columns must include a <span className="font-semibold text-ink">Month</span> header, followed by column headers matching active metrics (e.g. <span className="font-semibold text-ink">Revenue</span>, <span className="font-semibold text-ink">EngagementRate</span>, <span className="font-semibold text-ink">ConversionRate</span>, <span className="font-semibold text-ink">RetentionRate</span>, <span className="font-semibold text-ink">TurnaroundTime</span>).
              </p>
              <pre className="p-3 bg-paper dark:bg-paper-dark border border-paper-border/60 dark:border-paper-borderDark/60 text-[10px] font-mono leading-relaxed overflow-x-auto text-ink-light/70 dark:text-ink-darkLight/75">
                Month, Revenue, EngagementRate, ConversionRate, RetentionRate, TurnaroundTime{"\n"}
                Jan, 320000, 4.20, 2.80, 81.20, 3.20{"\n"}
                Feb, 310000, 4.50, 2.90, 80.50, 3.10
              </pre>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-paper-border dark:border-paper-borderDark bg-paper-card/10 dark:bg-paper-cardDark/10 p-8 text-center relative hover:bg-paper-card/20 transition-all duration-150">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleCsvChange}
                />
                <Upload className="w-10 h-10 mx-auto text-ink-light/40 dark:text-ink-darkLight/40 mb-3" />
                <p className="text-xs font-sans text-ink dark:text-ink-dark font-medium">
                  {csvFile ? `Selected File: ${csvFile.name}` : "Click or drag & drop a .csv file to parse"}
                </p>
                <p className="text-[10px] font-sans text-ink-light/50 dark:text-ink-darkLight/50 mt-1">
                  Supported extensions: .csv files only
                </p>
              </div>

              <div className="flex justify-center select-none no-print">
                <button
                  type="button"
                  onClick={handleLoadSampleDataClick}
                  className="text-xs font-sans text-editorial-ochre hover:underline uppercase tracking-wider font-bold flex items-center gap-1 mt-1"
                >
                  💡 Load Sample E-Commerce CSV Template
                </button>
              </div>

              {csvError && (
                <div className="bg-editorial-terracotta/5 border border-editorial-terracotta text-editorial-terracotta p-3 text-xs font-sans flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Parsed CSV Preview table */}
              {csvPreview && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-editorial-ochre" />
                    CSV Data Import Preview (Max 12 Rows)
                  </h4>
                  <div className="overflow-x-auto border border-paper-border dark:border-paper-borderDark">
                    <table className="w-full text-left font-sans text-[10px] divide-y divide-paper-border dark:divide-paper-borderDark">
                      <thead className="bg-paper-card dark:bg-paper-cardDark">
                        <tr className="text-ink-light/60 uppercase tracking-wider">
                          {csvHeaders.map(h => (
                            <th key={h} className="p-2 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-border dark:divide-paper-borderDark text-ink-light/80">
                        {csvPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-paper-card/25">
                            {csvHeaders.map(header => {
                              const cleanKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');
                              return (
                                <td key={header} className="p-2">
                                  {row[cleanKey]?.toLocaleString() ?? '0'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={handleImportCsv}
                      className="py-2 px-6 bg-editorial-ochre text-paper font-bold uppercase tracking-wider text-xs hover:bg-ink dark:hover:bg-ink-dark hover:text-paper transition-all duration-150 flex items-center gap-1.5 animate-pulse"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Import to Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="py-2 px-4 border border-paper-border dark:border-paper-borderDark text-ink-light/60 font-bold uppercase tracking-wider text-xs hover:bg-paper-card transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Workspace Metadata Settings & Deletion */}
        {mgmtTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
                Workspace Controls
              </span>
              <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark mt-0.5">
                Workspace Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Client Info settings form */}
              <form onSubmit={handleSaveMetadata} className="space-y-4 font-sans text-xs">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark border-b border-paper-border dark:border-paper-borderDark pb-2 mb-1">
                  Update Metadata Details
                </h4>

                <div className="space-y-1">
                  <label htmlFor="edit-client-name" className="block font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                    Client / Workspace Name
                  </label>
                  <input
                    id="edit-client-name"
                    type="text"
                    required
                    className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-client-ind" className="block font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                    Focus Sector / Industry
                  </label>
                  <input
                    id="edit-client-ind"
                    type="text"
                    required
                    className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark"
                    value={clientIndustry}
                    onChange={e => setClientIndustry(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-client-goal" className="block font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                    Primary objective goal text
                  </label>
                  <input
                    id="edit-client-goal"
                    type="text"
                    required
                    className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark font-serif italic text-sm"
                    value={clientGoal}
                    onChange={e => setClientGoal(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-client-color" className="block font-bold uppercase text-ink-light/50 dark:text-ink-darkLight/50 text-[10px]">
                    Workspace Color Badge
                  </label>
                  <select
                    id="edit-client-color"
                    className="w-full p-2 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark cursor-pointer font-semibold uppercase tracking-wider"
                    value={clientColor}
                    onChange={e => setClientColor(e.target.value)}
                  >
                    <option value="sage">Sage Green (Positive Growth)</option>
                    <option value="ochre">Ochre Yellow (Warnings/Targets)</option>
                    <option value="terracotta">Terracotta Crimson (High contrast)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="py-2 px-6 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark font-bold uppercase tracking-wider hover:bg-editorial-ochre hover:text-paper transition-colors duration-150"
                >
                  Save Metadata Updates
                </button>
              </form>

              {/* Danger Zone */}
              <div className="bg-editorial-terracotta/5 border border-editorial-terracotta/20 p-5 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-editorial-terracotta border-b border-editorial-terracotta/10 pb-2 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Workspace Danger Registry
                </h4>
                <p className="text-xs font-sans text-ink-light/80 dark:text-ink-darkLight/85 leading-normal">
                  Deleting a workspace removes all monthly metrics data grid lines, customized benchmarks, annotations, and system report files from the browser memory cache permanently.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDeleteTrigger}
                    className="py-2.5 px-4 bg-editorial-terracotta text-paper font-sans font-bold text-xs uppercase tracking-wider hover:bg-red-800 transition-colors duration-150 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Client Workspace</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
