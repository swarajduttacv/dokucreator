
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateReportContent } from '../services/geminiService';
import { DownloadIcon, SaveIcon, FolderOpenIcon } from './Icons';
import { SavedReport } from '../types';

declare const jspdf: any;

const initialComponents = {
    title: true,
    abstract: true,
    contents: true,
    introduction: true,
    acknowledgement: false,
    body: true,
    conclusion: true,
    references: false,
};

const componentLabels: { [key in keyof typeof initialComponents]: string } = {
    title: 'Project Title',
    abstract: 'Abstract',
    contents: 'Table of Contents',
    introduction: 'Introduction',
    acknowledgement: 'Acknowledgement',
    body: 'Body',
    conclusion: 'Conclusion',
    references: 'References',
};

const REPORT_STYLES = [
  { value: 'Business Executive', label: '💼 Business Executive' },
  { value: 'Academic', label: '🎓 Academic' },
  { value: 'Technical', label: '⚙️ Technical' },
];

interface ReportGeneratorProps {
  loadedReport: SavedReport | null;
  onSave: (reportData: Omit<SavedReport, 'id' | 'name' | 'createdAt'>) => void;
  onOpenView: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ loadedReport, onSave, onOpenView }) => {
    const [reportDetails, setReportDetails] = useState('');
    const [pageCount, setPageCount] = useState<number>(5);
    const [selectedComponents, setSelectedComponents] = useState(initialComponents);
    const [reportStyle, setReportStyle] = useState('Business Executive');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const reportPreviewRef = useRef<HTMLDivElement>(null);
    const [isJsPdfLoaded, setIsJsPdfLoaded] = useState(typeof jspdf !== 'undefined');
    
    useEffect(() => {
        if(loadedReport) {
            setGeneratedHtml(loadedReport.reportHtml);
            setReportDetails('');
            setSelectedComponents(initialComponents);
            setPageCount(5);
            setError(null);
        }
    }, [loadedReport]);

    useEffect(() => {
        if (isJsPdfLoaded) return;
        const interval = setInterval(() => {
            if (typeof jspdf !== 'undefined') {
                setIsJsPdfLoaded(true);
                clearInterval(interval);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [isJsPdfLoaded]);


    const handleComponentChange = (component: keyof typeof initialComponents) => {
        setSelectedComponents(prev => ({ ...prev, [component]: !prev[component] }));
    };

    const handleGenerate = useCallback(async () => {
        if (!reportDetails.trim()) {
            setError('Please provide details for the report body.');
            return;
        }
        const componentsToGenerate = Object.entries(selectedComponents).filter(([, s]) => s).map(([k]) => k);
        if (componentsToGenerate.length === 0) {
            setError('Please select at least one component to generate.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedHtml(null);
        try {
            const result = await generateReportContent(reportDetails, componentsToGenerate, pageCount, reportStyle);
            setGeneratedHtml(result);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to generate the report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [reportDetails, selectedComponents, pageCount, reportStyle]);

    const handleSaveClick = () => {
        if (!generatedHtml) {
            alert("Please generate a report before saving.");
            return;
        }
        onSave({ reportHtml: generatedHtml });
    };

    const handleDownloadWord = () => {
        if (!generatedHtml) return;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + generatedHtml + footer;
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'report.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const handleDownloadPdf = async () => {
        if (!reportPreviewRef.current) return;
        
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = jspdf;
        
        const element = reportPreviewRef.current;
        const canvas = await html2canvas(element, {
            scale: 2, // 2x resolution for sharp zoom
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 30;
        const contentWidth = pdfWidth - margin * 2;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = margin;
        
        // First page
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
        
        // Additional pages
        while (heightLeft > 0) {
            position = position - (pdfHeight - margin * 2);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
            heightLeft -= (pdfHeight - margin * 2);
        }
        
        pdf.save('report.pdf');
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-brand-surface dark:bg-dark-surface p-6 rounded-xl border border-brand-subtle dark:border-dark-subtle shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-secondary dark:text-dark-secondary">Create Your Report</h2>
                    <div className="flex space-x-2">
                        <button onClick={handleSaveClick} className="flex items-center px-4 py-2 bg-brand-secondary dark:bg-dark-subtle text-white dark:text-dark-text text-sm font-semibold rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary transition-colors">
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Save Report
                        </button>
                        <button onClick={onOpenView} className="flex items-center px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-colors">
                            <FolderOpenIcon className="h-4 w-4 mr-2" />
                            View Saved
                        </button>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {/* Report Structure */}
                    <div>
                        <h3 className="text-xl font-semibold text-brand-secondary dark:text-dark-secondary mb-3">Report Structure</h3>
                        <p className="text-sm text-brand-text/70 dark:text-dark-text/70 mb-4 -mt-2">Select the components you want in your report.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Object.entries(componentLabels).map(([key, label]) => (
                                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedComponents[key as keyof typeof initialComponents]}
                                        onChange={() => handleComponentChange(key as keyof typeof initialComponents)}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary dark:text-dark-primary focus:ring-brand-primary dark:focus:ring-dark-primary bg-gray-100 dark:bg-gray-700"
                                    />
                                    <span className="text-sm text-brand-text/90 dark:text-dark-text/90">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Page Count + Report Style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="page-count" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80 mb-2">
                                Target Page Count: <span className="font-bold text-brand-primary dark:text-dark-primary">{pageCount}</span>
                            </label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="range"
                                    id="page-count-slider"
                                    value={pageCount}
                                    onChange={(e) => setPageCount(parseInt(e.target.value, 10))}
                                    min="1"
                                    max="50"
                                    className="w-full h-2 bg-brand-subtle dark:bg-dark-subtle rounded-lg appearance-none cursor-pointer"
                                    disabled={isLoading}
                                />
                                <input
                                    type="number"
                                    id="page-count"
                                    value={pageCount}
                                    onChange={(e) => setPageCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                                    min="1"
                                    max="50"
                                    className="w-20 p-2 text-center bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary text-brand-text dark:text-dark-text"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-xs text-brand-text/60 dark:text-dark-text/60 mt-1">
                                Content will intelligently expand or compress to fit this target.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="report-style" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80 mb-2">
                                Report Style
                            </label>
                            <select
                                id="report-style"
                                value={reportStyle}
                                onChange={(e) => setReportStyle(e.target.value)}
                                className="w-full p-2.5 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary text-brand-text dark:text-dark-text"
                                disabled={isLoading}
                            >
                                {REPORT_STYLES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-brand-text/60 dark:text-dark-text/60 mt-1">
                                Changes tone, formatting, and level of detail.
                            </p>
                        </div>
                    </div>

                    {/* Report Details */}
                    <div>
                        <label htmlFor="report-details" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80 mb-2">Body Specifications & Main Content</label>
                        <p className="text-sm text-brand-text/70 dark:text-dark-text/70 mb-2">Provide detailed information for the report's body. Include data, topics, and any specific requirements.</p>
                        <textarea
                            id="report-details"
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            rows={10}
                            className="w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary transition-colors text-brand-text dark:text-dark-text resize-y"
                            placeholder="e.g., Topic: Q3 Financial Summary. Include revenue breakdown by region, profit margins, YoY comparison. Highlight top-performing and underperforming segments..."
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {error && <div className="mt-4 p-4 bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300 border border-red-500 rounded-lg">{error}</div>}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !reportDetails.trim()}
                    className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-brand-primary dark:bg-dark-primary text-white dark:text-dark-text font-semibold rounded-lg shadow-md hover:bg-brand-secondary dark:hover:bg-dark-subtle transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Generating Report...</>
                    ) : (
                        'Generate Report'
                    )}
                </button>
            </div>

            {generatedHtml && (
                <div className="mt-8 bg-brand-surface dark:bg-dark-surface p-6 rounded-xl border border-brand-subtle dark:border-dark-subtle shadow-md animate-slide-in-up">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-2xl font-bold text-brand-secondary dark:text-dark-secondary">Generated Report Preview</h2>
                         <div className="flex space-x-2">
                            <button onClick={handleDownloadWord} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"><DownloadIcon className="h-4 w-4 mr-2" />Word</button>
                            <button onClick={handleDownloadPdf} disabled={!isJsPdfLoaded} className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                {isJsPdfLoaded ? 'PDF' : 'Loading...'}
                            </button>
                         </div>
                    </div>
                    <div className="p-8 border border-brand-subtle dark:border-dark-subtle rounded-md bg-white shadow-inner overflow-auto max-h-[70vh]">
                         <div ref={reportPreviewRef} className="text-black" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;
