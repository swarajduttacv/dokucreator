import React, { useState, useEffect } from 'react';
import { SavedSlide, ChartDefinition } from '../types';
import { createMultiSlidePresentation } from '../services/presentationService';
import { toPng } from 'html-to-image';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { getPalette } from '../utils/colorPalettes';
import { DownloadIcon } from './Icons';

interface SavedContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'chartGenerations' | 'slides' | 'reports';
    content: any[];
    onLoad: (type: 'chartGenerations' | 'slides' | 'reports', data: any) => void;
    onDelete: (type: 'chartGenerations' | 'slides' | 'reports', id: string) => void;
}

// A simplified, non-interactive chart renderer for image generation, copied from SlideGenerator
const ChartRenderer: React.FC<{ chart: ChartDefinition; width: number; height: number }> = ({ chart, width, height }) => {
    const palette = getPalette(undefined, chart.customTheme);
    const tooltipStyle = { backgroundColor: '#ffffff', border: '1px solid #d7ccc8', color: '#3e2723' };
    const axisStroke = palette.text;
    const gridStroke = '#e0e0e0';
    const legendColor = palette.text;
    switch (chart.chartType) {
        case 'bar': return <BarChart width={width} height={height} data={chart.data} margin={{ top: 5, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Bar key={key} dataKey={key} fill={palette.colors[i % palette.colors.length]} isAnimationActive={false} />)}</BarChart>;
        case 'line': return <LineChart width={width} height={height} data={chart.data} margin={{ top: 5, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={palette.colors[i % palette.colors.length]} isAnimationActive={false} />)}</LineChart>;
        case 'pie': return <PieChart width={width} height={height} data={chart.data} margin={{ top: 5, right: 30, bottom: 25, left: 30 }}><Pie data={chart.data} dataKey={chart.dataKeys[0]} nameKey={chart.labelKey} cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" label={{ fill: legendColor, fontSize: 12 }} isAnimationActive={false}>{chart.data.map((e, i) => <Cell key={`cell-${i}`} fill={palette.colors[i % palette.colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor, fontSize: 14 }}/></PieChart>;
        case 'area': return <AreaChart width={width} height={height} data={chart.data} margin={{ top: 5, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={palette.colors[i % palette.colors.length]} fill={palette.colors[i % palette.colors.length]} isAnimationActive={false} />)}</AreaChart>;
        case 'composed': return <ComposedChart width={width} height={height} data={chart.data} margin={{ top: 5, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys[0] && <Bar dataKey={chart.dataKeys[0]} fill={palette.colors[0]} isAnimationActive={false} />}{chart.dataKeys[1] && <Line type="monotone" dataKey={chart.dataKeys[1]} stroke={palette.colors[1]} isAnimationActive={false} />}</ComposedChart>;
        default: return null;
    }
};

const SavedContentModal: React.FC<SavedContentModalProps> = ({ isOpen, onClose, type, content, onLoad, onDelete }) => {
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [chartsToRender, setChartsToRender] = useState<SavedSlide[]>([]);

    useEffect(() => {
        // Reset state when modal is opened or content changes
        if (isOpen) {
            setSelectedIds([]);
            setIsDownloading(false);
            setChartsToRender([]);
        }
    }, [isOpen, content]);

    useEffect(() => {
        if (chartsToRender.length === 0 && !isDownloading) return; // Only run if initiated
        if (chartsToRender.length === 0 && isDownloading) { // Handle case with no charts to render
             const downloadSlidesWithoutCharts = async () => {
                const selectedSlides = content.filter(item => selectedIds.includes(item.id) && !item.slideData.chart) as SavedSlide[];
                if (selectedSlides.length === 0) {
                     setIsDownloading(false);
                     return;
                }
                const slidesWithOptions = selectedSlides.map(slide => ({
                    title: slide.slideData.title,
                    content: slide.slideData.content,
                    style: {
                        font: slide.slideData.font,
                        color: slide.slideData.color,
                        backgroundColor: slide.slideData.backgroundColor,
                    }
                }));
                try {
                     await createMultiSlidePresentation(slidesWithOptions);
                } catch(e) {
                     console.error("Multi-download failed", e);
                     alert("Failed to download presentation.");
                } finally {
                     setIsDownloading(false);
                     setSelectedIds([]);
                }
            };
            downloadSlidesWithoutCharts();
            return;
        }

        const generateImagesAndDownload = async () => {
            try {
                const selectedSlides = content.filter(item => selectedIds.includes(item.id)) as SavedSlide[];
                const imagePromises = selectedSlides.map(slide => {
                    if (!slide.slideData.chart) {
                        return Promise.resolve(null);
                    }
                    const node = document.getElementById(`hidden-chart-render-${slide.id}`);
                    if (!node) {
                        return Promise.reject(new Error(`Render node for chart ${slide.id} not found.`));
                    }
                    return toPng(node, { quality: 0.95, backgroundColor: slide.slideData.backgroundColor });
                });
                const imagesDataUrls = await Promise.all(imagePromises);
                const slidesWithOptions = selectedSlides.map((slide, index) => ({
                    title: slide.slideData.title,
                    content: slide.slideData.content,
                    chartImageBase64: imagesDataUrls[index] ? (imagesDataUrls[index] as string).split(',')[1] : undefined,
                    style: {
                        font: slide.slideData.font,
                        color: slide.slideData.color,
                        backgroundColor: slide.slideData.backgroundColor,
                    }
                }));
                await createMultiSlidePresentation(slidesWithOptions);
            } catch(e) {
                console.error("Multi-download failed", e);
                alert("Failed to download presentation. One or more chart images could not be generated.");
            } finally {
                setIsDownloading(false);
                setChartsToRender([]);
                setSelectedIds([]);
            }
        };
        const timeoutId = setTimeout(generateImagesAndDownload, 100);
        return () => clearTimeout(timeoutId);
    }, [chartsToRender, isDownloading, content, selectedIds]);


    const handleClose = () => {
        setConfirmingDeleteId(null);
        onClose();
    };

    const getTitle = () => {
        switch (type) {
            case 'slides': return 'Saved Slides';
            case 'reports': return 'Saved Reports';
            case 'chartGenerations': return 'Saved Chart Generations';
            default: return 'Saved Content';
        }
    };
    
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleMultiDownload = () => {
        if (selectedIds.length === 0) return;
        setIsDownloading(true);
        const slides = content.filter(item => selectedIds.includes(item.id));
        const slidesWithCharts = slides.filter(s => !!s.slideData.chart);
        setChartsToRender(slidesWithCharts);
        if (slidesWithCharts.length === 0) {
             // If no charts, still trigger the useEffect to handle non-chart slides
             setChartsToRender([]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
            <div className="bg-brand-surface dark:bg-dark-surface rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-brand-subtle dark:border-dark-subtle">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-secondary">{getTitle()}</h2>
                </header>
                <main className="p-6 overflow-y-auto flex-grow">
                    {content.length === 0 ? (
                        <p className="text-brand-text/70 dark:text-dark-text/70 text-center">You have no saved {type.replace(/([A-Z])/g, ' $1')}.</p>
                    ) : (
                        <ul className="space-y-3">
                            {content.map((item) => (
                                <li key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-background/50 dark:bg-dark-background/50 p-3 rounded-md border border-brand-subtle dark:border-dark-subtle">
                                    <div className="flex items-center space-x-3">
                                        {type === 'slides' && (
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-brand-primary dark:text-dark-primary focus:ring-brand-primary dark:focus:ring-dark-primary bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => handleToggleSelect(item.id)}
                                                disabled={isDownloading}
                                            />
                                        )}
                                        <div>
                                            <p className="font-semibold text-brand-text dark:text-dark-text">{item.name}</p>
                                            <p className="text-xs text-brand-text/60 dark:text-dark-text/60">
                                                Saved on: {new Date(item.createdAt).toLocaleString()}
                                                {type === 'chartGenerations' && ` (${item.charts?.length || 0} charts)`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 self-end sm:self-center flex-shrink-0">
                                        {confirmingDeleteId === item.id ? (
                                            <>
                                                <span className="text-sm self-center text-red-700 font-medium">Are you sure?</span>
                                                <button onClick={() => { onDelete(type, item.id); setConfirmingDeleteId(null); }} className="px-3 py-1 text-sm bg-red-700 text-white rounded-md hover:bg-red-800">Yes</button>
                                                <button onClick={() => setConfirmingDeleteId(null)} className="px-3 py-1 text-sm bg-gray-300 rounded-md hover:bg-gray-400">No</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => onLoad(type, item)} className="px-3 py-1 text-sm bg-brand-secondary text-white dark:text-dark-text dark:bg-dark-subtle rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary">
                                                    Load
                                                </button>
                                                <button onClick={() => setConfirmingDeleteId(item.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
                 <footer className="p-4 border-t border-brand-subtle dark:border-dark-subtle flex justify-between items-center">
                    {type === 'slides' && (
                        <button 
                            onClick={handleMultiDownload} 
                            disabled={selectedIds.length === 0 || isDownloading}
                            className="flex items-center px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-md hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <DownloadIcon className="h-4 w-4 mr-2" />}
                            {isDownloading ? 'Downloading...' : `Download Selected (${selectedIds.length})`}
                        </button>
                    )}
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 ml-auto">
                        Close
                    </button>
                </footer>
                 {chartsToRender.length > 0 && (
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', display: 'flex', flexDirection: 'column' }}>
                        {chartsToRender.map(slide => (
                            <div key={slide.id} id={`hidden-chart-render-${slide.id}`} style={{ width: '960px', height: '540px', backgroundColor: slide.slideData.backgroundColor }}>
                                <ChartRenderer chart={{...slide.slideData.chart, customTheme: { background: slide.slideData.backgroundColor, colors: getPalette(slide.slideData.colorPaletteName).colors }}} width={960} height={540} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedContentModal;