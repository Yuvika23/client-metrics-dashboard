import React, { useState } from 'react';
import type { Client } from '../data/mockData';
import { formatMetricValue } from '../data/mockData';
import { Printer, FileDown, Check, Loader2, Plus, Trash2 } from 'lucide-react';

interface ReportBuilderProps {
  activeClient: Client;
}

interface SavedReport {
  id: string;
  name: string;
  cadence: 'Weekly' | 'Monthly' | 'Quarterly';
  metrics: string[];
  commentary: string;
  createdAt: string;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ activeClient }) => {
  // Pre-seed some realistic saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: 'rep-1',
      name: 'Q3 Executive Performance Digest',
      cadence: 'Monthly',
      metrics: ['revenue', 'conversion', 'retention'],
      commentary: 'Q3 performance exceeded expectations with revenue conversions peaking at 3.6%. Operations recommend maintaining Instagram attribution weights for the upcoming quarter.',
      createdAt: '01 July 2026'
    },
    {
      id: 'rep-2',
      name: 'Weekly Operations Pulse',
      cadence: 'Weekly',
      metrics: ['engagement', 'conversion'],
      commentary: 'A short weekly diagnostic audit on social engagement. TikTok referrals continue to drive conversion volumes.',
      createdAt: '05 July 2026'
    }
  ]);

  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  
  // Current form inputs
  const [reportName, setReportName] = useState('Monthly Performance Digest');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'engagement', 'conversion', 'retention']);
  const [cadence, setCadence] = useState<'Weekly' | 'Monthly' | 'Quarterly'>('Monthly');
  const [commentary, setCommentary] = useState(
    `Overall performance during this period aligns closely with our core objective to "${activeClient.primaryGoal}". Key customer metrics show steady engagement channels with slight seasonal shifts. Recommend optimizing paid attribution weights heading into the next quarterly review cycle.`
  );
  
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Add / Create report action
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) {
      triggerToast("Please enter a valid report title.");
      return;
    }

    const newReport: SavedReport = {
      id: `rep-${Date.now()}`,
      name: reportName,
      cadence,
      metrics: [...selectedMetrics],
      commentary,
      createdAt: new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    };

    setSavedReports(prev => [newReport, ...prev]);
    setActiveReportId(newReport.id);
    triggerToast(`Report "${reportName}" registered successfully.`);
  };

  // Select report from list to view
  const handleSelectReport = (report: SavedReport) => {
    setActiveReportId(report.id);
    setReportName(report.name);
    setCadence(report.cadence);
    setSelectedMetrics(report.metrics);
    setCommentary(report.commentary);
  };

  // Delete report
  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedReports(prev => prev.filter(r => r.id !== id));
    if (activeReportId === id) {
      setActiveReportId(null);
    }
    triggerToast("Report configuration removed.");
  };

  // Start fresh report
  const handleResetForm = () => {
    setActiveReportId(null);
    setReportName('New Scheduled Report');
    setCadence('Monthly');
    setSelectedMetrics(['revenue', 'engagement', 'conversion', 'retention']);
    setCommentary('');
  };

  const handleExport = (type: 'PDF' | 'Excel') => {
    const activeMetrics = selectedMetrics.map(id => activeClient.metrics[id as keyof typeof activeClient.metrics]).filter(Boolean);
    if (activeMetrics.length === 0) {
      triggerToast("Please select at least one metric to export.");
      return;
    }

    if (type === 'PDF') {
      setExportingPdf(true);
      setTimeout(() => {
        try {
          // Generate and download a standalone styled HTML report
          const metricsHtml = activeMetrics.map(metric => {
            const lastPt = metric.data[metric.data.length - 1] || { value: 0, target: 0 };
            const prevPt = metric.data[metric.data.length - 2];
            const change = prevPt && prevPt.value !== 0
              ? +(((lastPt.value - prevPt.value) / prevPt.value) * 100).toFixed(1)
              : 0;
            const firstPt = metric.data[0];
            const yoyVal = firstPt && firstPt.value !== 0
              ? +(((lastPt.value - firstPt.value) / firstPt.value) * 100).toFixed(1)
              : 0;
            const formattedCurrent = formatMetricValue(lastPt.value, metric.unit);
            const formattedTarget = formatMetricValue(lastPt.target, metric.unit);
            return `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-family: Georgia, serif; font-weight: bold;">${metric.name}</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formattedCurrent}</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: ${change >= 0 ? '#1b5e20' : '#b71c1c'}; font-weight: 600;">
                  ${change >= 0 ? '+' : ''}${change}%
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #757575;">${yoyVal >= 0 ? '+' : ''}${yoyVal}%</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #616161;">${formattedTarget}</td>
              </tr>
            `;
          }).join("");

          const standaloneHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeClient.name} - ${reportName}</title>
  <style>
    body {
      background-color: #f5f5f5;
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 40px 20px;
      color: #212121;
    }
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e0e0e0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      padding: 40px 50px;
      position: relative;
    }
    .watermark {
      border-bottom: 2px double #212121;
      padding-bottom: 5px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-family: sans-serif;
      font-weight: bold;
      letter-spacing: 0.15em;
      color: #757575;
      text-transform: uppercase;
      margin-bottom: 30px;
    }
    .watermark-left { float: left; }
    .watermark-right { float: right; }
    .clearfix { clear: both; }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h3 {
      font-size: 10px;
      font-family: sans-serif;
      letter-spacing: 0.25em;
      color: #757575;
      margin: 0 0 10px 0;
    }
    .header h1 {
      font-size: 32px;
      margin: 0 0 10px 0;
      text-transform: uppercase;
      font-weight: 900;
    }
    .header p {
      font-size: 11px;
      font-family: sans-serif;
      font-style: italic;
      color: #9e9e9e;
      margin: 0;
    }
    .divider {
      width: 50px;
      height: 2px;
      background: #212121;
      margin: 15px auto 0 auto;
    }
    .section-title {
      font-size: 11px;
      font-family: sans-serif;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #757575;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
      margin: 30px 0 15px 0;
    }
    .commentary {
      font-size: 14px;
      line-height: 1.6;
      font-style: italic;
      text-align: justify;
      color: #424242;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: sans-serif;
      margin-top: 15px;
    }
    th {
      border-bottom: 1px solid #212121;
      padding: 8px 0;
      color: #757575;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-align: left;
    }
    .text-right { text-align: right; }
    .footer {
      border-top: 1px solid #e0e0e0;
      margin-top: 50px;
      padding-top: 20px;
      font-size: 10px;
      font-family: sans-serif;
      color: #757575;
    }
    .footer-left { float: left; }
    .footer-right { float: right; width: 200px; border-bottom: 1px solid #9e9e9e; text-align: center; font-family: Georgia, serif; font-style: italic; padding-bottom: 5px; color: #424242; }
    .page-footer {
      border-top: 1px solid #eee;
      margin-top: 30px;
      padding-top: 10px;
      font-size: 9px;
      font-family: sans-serif;
      color: #bdbdbd;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="watermark">
      <span class="watermark-left">${cadence} PERFORMANCE DIGEST</span>
      <span class="watermark-right">EST. DATE: ${today}</span>
      <div class="clearfix"></div>
    </div>
    
    <div class="header">
      <h3>OFFICIAL REPORT FOR EXECUTIVE VIEW</h3>
      <h1>${activeClient.name}</h1>
      <p>Subject: ${reportName}</p>
      <div class="divider"></div>
    </div>
    
    <div>
      <div class="section-title">I. Narrative Executive Summary</div>
      <div class="commentary">${commentary || "No manual executive summary logged for this report run."}</div>
    </div>
    
    <div>
      <div class="section-title">II. Quantitative KPIs Summary Table</div>
      <table>
        <thead>
          <tr>
            <th>Metric Index</th>
            <th class="text-right">Current Value</th>
            <th class="text-right">MoM Growth</th>
            <th class="text-right">YoY Rate</th>
            <th class="text-right">Goal Target</th>
          </tr>
        </thead>
        <tbody>
          ${metricsHtml}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <div class="footer-left">
        <p style="font-weight: bold; color: #424242; text-transform: uppercase; margin: 0 0 5px 0; letter-spacing: 0.1em;">REPORT AUDIT ASSURANCE</p>
        <p style="margin: 0; font-style: italic;">Approved and certified by Agency Reporting Partner.</p>
      </div>
      <div class="footer-right">
        /s/ Sterling Editorial Board
      </div>
      <div class="clearfix"></div>
    </div>
    
    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 8px; font-family: sans-serif; color: #9e9e9e;">
      <div style="float: left;">CLASSIFICATION: CONFIDENTIAL</div>
      <div style="float: right;">SYSTEM ID: S-${activeClient.id.toUpperCase()}</div>
      <div style="text-align: center;">PAGE 1 OF 1</div>
      <div class="clearfix"></div>
    </div>
  </div>
</body>
</html>
          `;
          
          // Trigger download of standalone HTML report
          const htmlBlob = new Blob([standaloneHtml], { type: "text/html;charset=utf-8;" });
          const htmlUrl = URL.createObjectURL(htmlBlob);
          const htmlLink = document.createElement("a");
          htmlLink.setAttribute("href", htmlUrl);
          htmlLink.setAttribute("download", `${activeClient.name.replace(/\s+/g, '_')}_${reportName.replace(/\s+/g, '_')}.html`);
          document.body.appendChild(htmlLink);
          htmlLink.click();
          document.body.removeChild(htmlLink);

          // Prompt the user for printing options without freezing UI
          setShowPrintModal(true);
          triggerToast("Report generated! Standalone HTML downloaded.");
        } catch (err) {
          console.error(err);
          triggerToast("Failed to compile print output.");
        } finally {
          setExportingPdf(false);
        }
      }, 800);
    } else {
      setExportingExcel(true);
      setTimeout(() => {
        try {
          // Find all unique months in metrics
          const months = activeMetrics[0].data.map(d => d.date);
          
          // Build CSV content
          let csvContent = "Month," + activeMetrics.map(m => `"${m.name} (${m.unit})"`).join(",") + "\n";
          
          months.forEach((month) => {
            const row = [month];
            activeMetrics.forEach(m => {
              const pt = m.data.find(d => d.date === month) || { value: 0 };
              row.push(pt.value.toString());
            });
            csvContent += row.join(",") + "\n";
          });
          
          // Trigger download of CSV
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `${activeClient.name.replace(/\s+/g, '_')}_${reportName.replace(/\s+/g, '_')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          triggerToast("Spreadsheet successfully exported to CSV (Excel format).");
        } catch (err) {
          console.error(err);
          triggerToast("Failed to compile CSV spreadsheet.");
        } finally {
          setExportingExcel(false);
        }
      }, 800);
    }
  };

  const triggerToast = (message: string) => {
    setShowToast(message);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-12 transition-all duration-300">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark border border-editorial-ochre p-4 shadow-xl flex items-center gap-3 animate-slideIn">
          <Check className="w-5 h-5 text-editorial-ochre" />
          <span className="text-sm font-sans font-medium">{showToast}</span>
        </div>
      )}

      {/* Column 1 (xl:col-span-3): Saved Reports Log */}
      <div className="xl:col-span-3 space-y-4 bg-paper-card/60 dark:bg-paper-cardDark/60 border border-paper-border dark:border-paper-borderDark p-5 no-print h-full">
        <div className="flex justify-between items-center border-b border-paper-border dark:border-paper-borderDark pb-2.5 mb-2">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
            Report Registry
          </h3>
          <button
            onClick={handleResetForm}
            className="text-[9px] font-sans font-bold uppercase tracking-widest bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark px-2 py-1 hover:bg-editorial-ochre transition-colors duration-150"
            title="Configure new report configuration"
          >
            Create New
          </button>
        </div>

        {savedReports.length === 0 ? (
          <div className="py-12 text-center text-ink-light/40 dark:text-ink-darkLight/40">
            <p className="font-serif italic text-xs mb-1">Registry is empty.</p>
            <p className="text-[10px] font-sans">Save compiled reports below to log them here.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {savedReports.map(rep => {
              const isActive = activeReportId === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => handleSelectReport(rep)}
                  className={`p-3 border cursor-pointer transition-all duration-150 relative group ${
                    isActive 
                      ? 'bg-paper dark:bg-paper-dark border-editorial-ochre border-l-3' 
                      : 'border-paper-border dark:border-paper-borderDark bg-paper-card hover:bg-paper dark:hover:bg-paper-dark'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 pr-4">
                    <span className="font-serif text-xs font-bold text-ink dark:text-ink-dark line-clamp-2 leading-tight">
                      {rep.name}
                    </span>
                    <button
                      onClick={(e) => handleDeleteReport(rep.id, e)}
                      className="text-ink-light/35 hover:text-editorial-terracotta transition-colors duration-150 absolute right-2 top-2 p-0.5"
                      title="Delete saved report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center text-[9px] font-sans text-ink-light/40 dark:text-ink-darkLight/40 mt-2">
                    <span className="bg-ink/5 dark:bg-ink-dark/10 px-1 py-0.5 uppercase tracking-wide font-semibold text-ink dark:text-ink-dark">
                      {rep.cadence}
                    </span>
                    <span>Created: {rep.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Column 2 (xl:col-span-4): Report Compiler Form */}
      <div className="xl:col-span-4 space-y-5 bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-5 no-print">
        <div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light/50 dark:text-ink-darkLight/50">
            Design Controls
          </span>
          <h2 className="font-serif text-base font-bold text-ink dark:text-ink-dark mt-0.5">
            Compiler Configuration
          </h2>
        </div>

        <form onSubmit={handleSaveReport} className="space-y-4">
          {/* Report Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="report-title-input" className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Report Title
            </label>
            <input
              id="report-title-input"
              type="text"
              className="w-full p-2 text-xs font-sans bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre"
              placeholder="e.g. Monthly Performance Digest"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              required
            />
          </div>

          {/* Cadence Selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Frequency Interval
            </label>
            <div className="flex gap-2">
              {(['Weekly', 'Monthly', 'Quarterly'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCadence(c)}
                  className={`flex-1 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider border transition-all duration-150 ${
                    cadence === c
                      ? 'bg-ink text-paper border-ink dark:bg-ink-dark dark:text-paper-dark'
                      : 'bg-paper dark:bg-paper-dark border-paper-border dark:border-paper-borderDark text-ink-light/75 dark:text-ink-darkLight/85 hover:bg-paper-card'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Selector checkboxes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Quantitative Metrics Included
            </label>
            <div className="space-y-2 bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark p-3">
              {Object.values(activeClient.metrics).map((metric) => {
                const data = metric.data;
                const lastPoint = data[data.length - 1] || { value: 0 };
                const formattedVal = formatMetricValue(lastPoint.value, metric.unit);
                return (
                  <label
                    key={metric.id}
                    className="flex items-center gap-2 text-ink dark:text-ink-dark cursor-pointer py-1 font-sans text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => handleMetricToggle(metric.id)}
                      className="rounded border-paper-border dark:border-paper-borderDark text-ink focus:ring-editorial-ochre w-4 h-4"
                    />
                    <span className="font-semibold">{metric.name}</span>
                    <span className="text-[10px] text-ink-light/40 dark:text-ink-darkLight/40">({formattedVal})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Executive Commentary editor */}
          <div className="space-y-1.5">
            <label htmlFor="commentary-input" className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Narrative Editorial commentary
            </label>
            <textarea
              id="commentary-input"
              rows={4}
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              className="w-full p-2.5 text-xs font-sans bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre"
              placeholder="Provide a narrative summary of this reporting cycle..."
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-paper-border dark:border-paper-borderDark">
            <button
              type="submit"
              className="w-full py-2 bg-editorial-ochre text-paper font-sans font-bold text-xs uppercase tracking-wider hover:bg-ink dark:hover:bg-ink-dark hover:text-paper transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Report to Registry</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('PDF')}
              disabled={exportingPdf}
              className="w-full py-2 bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark font-sans font-bold text-xs uppercase tracking-wider hover:bg-editorial-ochre transition-colors duration-150 flex items-center justify-center gap-1.5"
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-editorial-ochre" />
                  <span>Formatting PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleExport('Excel')}
              disabled={exportingExcel}
              className="w-full py-2 border border-paper-border dark:border-paper-borderDark font-sans font-bold text-xs uppercase tracking-wider hover:bg-paper-card dark:hover:bg-paper-cardDark text-ink-light/75 dark:text-ink-darkLight/80 hover:text-ink transition-colors duration-150 flex items-center justify-center gap-1.5"
            >
              {exportingExcel ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Spreadsheet...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Spreadsheet (Excel)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Column 3 (xl:col-span-5): Printed Paper Review Layout */}
      <div id="report-print-area" className="xl:col-span-5 bg-white text-gray-900 border border-gray-300 shadow-xl p-6 md:p-8 relative flex flex-col justify-between max-w-full overflow-hidden animate-fadeIn" style={{ minHeight: '620px', fontFamily: '"Georgia", serif' }}>
        
        {/* Editorial Watermark lines/decorations */}
        <div className="absolute inset-x-6 top-6 border-b-2 border-double border-gray-800 pb-1 flex justify-between items-baseline text-[8px] font-sans font-bold tracking-widest text-gray-500 uppercase">
          <span>{cadence} PERFORMANCE DIGEST</span>
          <span>EST. DATE: {today}</span>
        </div>

        {/* Main Document Header */}
        <div className="mt-8 mb-6 text-center">
          <h3 className="text-[9px] font-sans font-black tracking-[0.25em] text-gray-500 uppercase mb-1">
            OFFICIAL REPORT FOR EXECUTIVE VIEW
          </h3>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-gray-900 leading-tight">
            {activeClient.name}
          </h1>
          <p className="text-[9px] font-sans italic text-gray-400 mt-2">
            Subject: {reportName}
          </p>
          <div className="w-12 h-0.5 bg-gray-900 mx-auto mt-2" />
        </div>

        {/* Narrative / Executive summary */}
        <div className="mb-6">
          <h4 className="text-[9px] font-sans font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
            I. Narrative Executive Summary
          </h4>
          <p className="text-xs text-gray-800 leading-relaxed font-serif italic text-justify">
            {commentary || "No manual executive summary logged for this report run."}
          </p>
        </div>

        {/* Included Metrics Section */}
        <div className="mb-6 flex-1">
          <h4 className="text-[9px] font-sans font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-3">
            II. Quantitative KPIs Summary Table
          </h4>

          {selectedMetrics.length === 0 ? (
            <div className="py-8 text-center text-gray-400 font-serif italic text-xs border border-dashed border-gray-200">
              No performance indices selected for print preview.
            </div>
          ) : (
            <div className="space-y-3">
              <table className="w-full text-left text-[11px] font-sans">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[8px] pb-1.5">
                    <th className="py-1">Metric Index</th>
                    <th className="py-1 text-right">Current Value</th>
                    <th className="py-1 text-right">MoM Growth</th>
                    <th className="py-1 text-right">YoY Rate</th>
                    <th className="py-1 text-right">Goal Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {selectedMetrics.map(id => {
                    const metric = activeClient.metrics[id as keyof typeof activeClient.metrics];
                    if (!metric) return null;
                    const lastPt = metric.data[metric.data.length - 1] || { value: 0, target: 0 };
                    const prevPt = metric.data[metric.data.length - 2];
                    const change = prevPt && prevPt.value !== 0
                      ? +(((lastPt.value - prevPt.value) / prevPt.value) * 100).toFixed(1)
                      : 0;
                    const firstPt = metric.data[0];
                    const yoyVal = firstPt && firstPt.value !== 0
                      ? +(((lastPt.value - firstPt.value) / firstPt.value) * 100).toFixed(1)
                      : 0;
                    const formattedCurrent = formatMetricValue(lastPt.value, metric.unit);
                    const formattedTarget = formatMetricValue(lastPt.target, metric.unit);

                    return (
                      <tr key={metric.id} className="text-gray-800">
                        <td className="py-2 font-serif font-bold text-xs text-gray-900">{metric.name}</td>
                        <td className="py-2 text-right font-serif text-xs font-bold">{formattedCurrent}</td>
                        <td className={`py-2 text-right font-semibold ${change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {change >= 0 ? '+' : ''}{change}%
                        </td>
                        <td className="py-2 text-right text-gray-400">{yoyVal >= 0 ? '+' : ''}{yoyVal}%</td>
                        <td className="py-2 text-right font-medium text-gray-600">
                          {formattedTarget}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signature Box & Sign-off footer */}
        <div className="border-t border-gray-300 pt-4 flex flex-col sm:flex-row justify-between items-end gap-3 text-[9px] font-sans text-gray-500">
          <div>
            <p className="font-bold text-gray-800 uppercase tracking-widest mb-0.5">
              REPORT AUDIT ASSURANCE
            </p>
            <p className="italic">
              Approved and certified by Agency Reporting Partner.
            </p>
          </div>
          <div className="w-36 border-b border-gray-400 pb-0.5 text-center font-serif text-xs italic text-gray-700">
            /s/ Sterling Editorial Board
          </div>
        </div>

        {/* Editorial Page Number */}
        <div className="text-center text-[8px] font-sans text-gray-400 mt-6 pt-2 border-t border-gray-150 flex justify-between items-center">
          <span>CLASSIFICATION: CONFIDENTIAL</span>
          <span>PAGE 1 OF 1</span>
          <span>SYSTEM ID: S-{activeClient.id.toUpperCase()}</span>
        </div>

      </div>

      {/* Print PDF Prompt Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-ink/60 dark:bg-ink-dark/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none no-print">
          <div className="bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
              Report Compiled & Downloaded!
            </h3>
            <p className="text-xs font-sans text-ink-light/80 dark:text-ink-darkLight/90 leading-relaxed">
              We have generated and downloaded your premium standalone report file (HTML format) to your local drive.
            </p>
            <p className="text-xs font-sans text-ink-light/80 dark:text-ink-darkLight/90 leading-relaxed">
              Would you like to open the browser's print engine layout now? You can select **"Save as PDF"** as the printer destination to store a PDF version of the report locally.
            </p>
            <div className="flex gap-3 pt-2 border-t border-paper-border dark:border-paper-borderDark">
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => {
                    const style = document.createElement('style');
                    style.innerHTML = `
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #report-print-area, #report-print-area * {
                          visibility: visible !important;
                        }
                        #report-print-area {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          border: none !important;
                          box-shadow: none !important;
                          padding: 0 !important;
                          margin: 0 !important;
                        }
                      }
                    `;
                    document.head.appendChild(style);
                    window.print();
                    document.head.removeChild(style);
                  }, 200);
                }}
                className="flex-1 py-2 bg-editorial-ochre text-paper font-sans font-bold text-xs uppercase tracking-wider hover:bg-ink dark:hover:bg-ink-dark transition-all duration-150"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2 border border-paper-border dark:border-paper-borderDark font-sans font-bold text-xs uppercase tracking-wider text-ink-light/80 dark:text-ink-darkLight/85 hover:bg-paper-card dark:hover:bg-paper-cardDark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
