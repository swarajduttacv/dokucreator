
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, ResponsiveContainer
} from 'recharts';
import { toPng } from 'html-to-image';
import { SelectedChart, ChartDefinition, SavedSlide, SLIDE_TEMPLATES } from '../types';
import { createSlide } from '../services/presentationService';
import { generateFullSlideDefinition } from '../services/geminiService';
import { SaveIcon, FolderOpenIcon, DownloadIcon } from './Icons';
import { colorPalettes, getPalette, ColorPalette } from '../utils/colorPalettes';

declare const PptxGenJS: any;

// A simplified, non-interactive chart renderer for image generation
const ChartRenderer: React.FC<{ chart: ChartDefinition; width: number; height: number }> = ({ chart, width, height }) => {
    const palette = getPalette(undefined, chart.customTheme);
    const tooltipStyle = { backgroundColor: '#ffffff', border: '1px solid #d7ccc8', color: '#3e2723' };
    const axisStroke = palette.text;
    const gridStroke = '#e0e0e0';
    const legendColor = palette.text;

    switch (chart.chartType) {
        case 'bar': return <BarChart width={width} height={height} data={chart.data} margin={{ top: 25, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Bar key={key} dataKey={key} fill={palette.colors[i % palette.colors.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />)}</BarChart>;
        case 'line': return <LineChart width={width} height={height} data={chart.data} margin={{ top: 25, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={palette.colors[i % palette.colors.length]} strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />)}</LineChart>;
        case 'pie': return <PieChart width={width} height={height} data={chart.data} margin={{ top: 25, right: 30, bottom: 25, left: 30 }}><Pie data={chart.data} dataKey={chart.dataKeys[0]} nameKey={chart.labelKey} cx="50%" cy="50%" outerRadius="80%" innerRadius="30%" fill="#8884d8" label={{ fill: legendColor, fontSize: 12 }} isAnimationActive={false}>{chart.data.map((e, i) => <Cell key={`cell-${i}`} fill={palette.colors[i % palette.colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor, fontSize: 14 }}/></PieChart>;
        case 'area': return <AreaChart width={width} height={height} data={chart.data} margin={{ top: 25, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys.map((key, i) => <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={palette.colors[i % palette.colors.length]} fill={palette.colors[i % palette.colors.length]} fillOpacity={0.5} isAnimationActive={false} />)}</AreaChart>;
        case 'composed': return <ComposedChart width={width} height={height} data={chart.data} margin={{ top: 25, right: 30, bottom: 70, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/><XAxis dataKey={chart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 10 }} angle={-45} textAnchor="end" height={80} interval={0} /><YAxis stroke={axisStroke} tick={{ fill: axisStroke }}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{ color: legendColor }}/>{chart.dataKeys[0] && <Bar dataKey={chart.dataKeys[0]} fill={palette.colors[0]} radius={[4,4,0,0]} isAnimationActive={false} />}{chart.dataKeys[1] && <Line type="monotone" dataKey={chart.dataKeys[1]} stroke={palette.colors[1]} strokeWidth={2.5} isAnimationActive={false} />}</ComposedChart>;
        default: return null;
    }
};

// Component to render a live preview of the slide
const SlidePreview: React.FC<{ slide: SavedSlide['slideData'] }> = ({ slide }) => {
    const { title, content, font, color, backgroundColor, chart } = slide;
    return (
        <div 
            className="w-full aspect-video shadow-lg rounded-lg p-[4%] flex flex-col"
            style={{ fontFamily: font, color, backgroundColor }}
        >
            <h1 className="text-4xl font-bold text-center mb-4 flex-shrink-0" style={{ color }}>{title}</h1>
            <div className="flex-grow flex items-start gap-4 overflow-hidden">
                {chart && (
                    <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ChartRenderer chart={chart} width={500} height={300} />
                        </ResponsiveContainer>
                    </div>
                )}
                <ul className={`text-lg space-y-2 ${chart ? 'w-1/2' : 'w-full mx-auto'}`}>
                    {content.map((point, index) => (
                        <li key={index} style={{ color }}>
                            <span className="mr-2">&bull;</span>{point}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

interface SlideGeneratorProps {
  selectedChart: SelectedChart | null;
  loadedSlide: SavedSlide | null;
  onSave: (slideData: Omit<SavedSlide, 'id' | 'name' | 'createdAt'>) => void;
  onOpenView: () => void;
  onDeselectChart: () => void;
}

type GeneratedSlideData = SavedSlide['slideData'];

const SlideGenerator: React.FC<SlideGeneratorProps> = ({ selectedChart, loadedSlide, onSave, onOpenView, onDeselectChart }) => {
  const [slideDescription, setSlideDescription] = useState('');
  const [font, setFont] = useState('Arial');
  const [colorPaletteName, setColorPaletteName] = useState('default');
  
  // New controls
  const [slideTemplate, setSlideTemplate] = useState('data-deep-dive');
  const [bulletCount, setBulletCount] = useState(5);
  const [analysisDepth, setAnalysisDepth] = useState('Detailed');
  const [tone, setTone] = useState('Professional');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPptxgenLoaded, setIsPptxgenLoaded] = useState(typeof PptxGenJS !== 'undefined');
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [generatedSlide, setGeneratedSlide] = useState<GeneratedSlideData | null>(null);
  const [themedChartForGen, setThemedChartForGen] = useState<ChartDefinition | null>(null);
  const downloadQueueItem = useRef<GeneratedSlideData | null>(null);

  const hiddenChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPptxgenLoaded) return;
    let timeoutId: number;
    const intervalId = setInterval(() => {
      if (typeof PptxGenJS !== 'undefined') {
        setIsPptxgenLoaded(true);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      }
    }, 200);
    timeoutId = window.setTimeout(() => {
      clearInterval(intervalId);
      if (typeof PptxGenJS === 'undefined') {
          setLibraryError("Failed to load presentation library. Please check your internet connection and refresh the page.");
      }
    }, 15000);
    return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
  }, [isPptxgenLoaded]);

  useEffect(() => {
    if (loadedSlide) {
      setGeneratedSlide(loadedSlide.slideData);
      setColorPaletteName(loadedSlide.slideData.colorPaletteName || 'default');
      setSlideDescription('');
    }
  }, [loadedSlide]);
  
  useEffect(() => {
    if (generatedSlide && generatedSlide.colorPaletteName !== colorPaletteName) {
        setGeneratedSlide(prevSlide => {
            if (!prevSlide) return null;
            return { ...prevSlide, colorPaletteName };
        });
    }
  }, [colorPaletteName, generatedSlide]);

  useEffect(() => {
    if (selectedChart) {
      setGeneratedSlide(null);
      setSlideDescription(`Create a slide for the chart titled "${selectedChart.chart.title}". Analyze the chart and generate a title and key insights as bullet points.`);
    }
  }, [selectedChart]);

  const handleGeneratePreview = useCallback(async () => {
    if (!slideDescription.trim() && !selectedChart) {
      setError('Please describe the slide or select a chart.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedSlide(null);

    try {
      const result = await generateFullSlideDefinition(slideDescription, selectedChart, colorPaletteName, {
        template: slideTemplate,
        bulletCount,
        analysisDepth,
        tone,
      });
      
      const fallbackPalette = getPalette(colorPaletteName);
      
      const finalStyle = {
        font: result.style?.font || 'Arial',
        color: result.style?.color || fallbackPalette.text,
        backgroundColor: result.style?.backgroundColor || fallbackPalette.background,
        colorPaletteName: result.style?.colorPaletteName || colorPaletteName,
      };

      const chartToUse = result.chart || selectedChart?.chart;
      
      const sanitizedContent = Array.isArray(result.content) 
        ? result.content.flatMap(item => item.split('\n')).filter(Boolean) 
        : [];
      
      setGeneratedSlide({
          title: result.title,
          content: sanitizedContent,
          chart: chartToUse,
          ...finalStyle
      });

    } catch (error: any) {
      console.error('Failed to generate slide:', error);
      setError(error.message || 'An error occurred while generating the slide.');
    } finally {
        setIsGenerating(false);
    }
  }, [slideDescription, selectedChart, colorPaletteName, slideTemplate, bulletCount, analysisDepth, tone]);
  
  const handleDownloadPptx = useCallback(() => {
    if (!generatedSlide) {
      alert("Please generate a preview first.");
      return;
    }
    setIsDownloading(true);

    const chartToRender = generatedSlide.chart;

    if (chartToRender) {
        const downloadPalette = getPalette(colorPaletteName);
        const chartForDownload: ChartDefinition = {
            ...chartToRender,
            customTheme: {
                background: generatedSlide.backgroundColor,
                colors: downloadPalette.colors,
            },
        };
        downloadQueueItem.current = generatedSlide;
        setThemedChartForGen(chartForDownload);
    } else {
        createSlide({
            title: generatedSlide.title,
            content: generatedSlide.content,
            style: {
                font: generatedSlide.font,
                color: generatedSlide.color,
                backgroundColor: generatedSlide.backgroundColor,
            },
        }).catch(e => {
            console.error("Failed to download presentation:", e);
            alert((e as Error).message);
        }).finally(() => {
            setIsDownloading(false);
        });
    }
  }, [generatedSlide, colorPaletteName]);
  
  useEffect(() => {
      if (themedChartForGen && hiddenChartRef.current && downloadQueueItem.current) {
          const slideDataForDownload = downloadQueueItem.current;

          toPng(hiddenChartRef.current, { quality: 0.95, backgroundColor: themedChartForGen.customTheme!.background })
              .then(dataUrl => {
                  const imageBase64 = dataUrl.split(',')[1];
                  return createSlide({
                      title: slideDataForDownload.title,
                      content: slideDataForDownload.content,
                      chartImageBase64: imageBase64,
                      style: {
                          font: slideDataForDownload.font,
                          color: slideDataForDownload.color,
                          backgroundColor: slideDataForDownload.backgroundColor,
                      },
                  });
              })
              .catch(e => {
                  console.error("Failed to download presentation:", e);
                  alert((e as Error).message);
              })
              .finally(() => {
                  setIsDownloading(false);
                  setThemedChartForGen(null);
                  downloadQueueItem.current = null;
              });
      }
  }, [themedChartForGen]);


  const handleSaveClick = () => {
    if (!generatedSlide) {
      alert("Please generate a preview before saving.");
      return;
    }
    onSave({ slideData: generatedSlide });
  };
  
  const getLiveThemedChartForPreview = (): ChartDefinition | undefined => {
      const chartToTheme = generatedSlide?.chart;
      if (!chartToTheme || !generatedSlide) return undefined;
      
      const livePalette = getPalette(colorPaletteName);
      return {
          ...chartToTheme,
          customTheme: {
              background: generatedSlide.backgroundColor,
              colors: livePalette.colors,
          },
      };
  };

  const currentPalette = getPalette(colorPaletteName);

  return (
    <div className="bg-brand-surface dark:bg-dark-surface p-6 rounded-xl border border-brand-subtle dark:border-dark-subtle shadow-md animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brand-secondary dark:text-dark-secondary">Create Your Slide Intelligently</h2>
            <div className="flex space-x-2">
                <button onClick={handleSaveClick} disabled={!generatedSlide} className="flex items-center px-4 py-2 bg-brand-secondary dark:bg-dark-subtle text-white dark:text-dark-text text-sm font-semibold rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary transition-colors disabled:opacity-50">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Slide
                </button>
                <button onClick={onOpenView} className="flex items-center px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-colors">
                    <FolderOpenIcon className="h-4 w-4 mr-2" />
                    View Saved
                </button>
            </div>
        </div>
        
        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Description + Template */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="slideContent" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                        Describe the slide you want
                    </label>
                    <textarea
                    id="slideContent"
                    value={slideDescription}
                    onChange={(e) => setSlideDescription(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md p-3 resize-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary text-brand-text dark:text-dark-text"
                    placeholder="e.g., Summarize Q3 revenue performance with key growth drivers and recommendations..."
                    />
                     {selectedChart && (
                        <div className="mt-2 p-2 bg-brand-background/50 dark:bg-dark-background/50 rounded-lg text-xs flex justify-between items-center">
                            <span>Using chart: <span className="font-semibold">{selectedChart.chart.title}</span></span>
                            <button onClick={onDeselectChart} title="Deselect chart" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-lg px-2 rounded-full leading-none">&times;</button>
                        </div>
                     )}
                </div>
                
                {/* Slide Template Selector */}
                <div>
                    <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80 mb-2">Slide Template</label>
                    <div className="grid grid-cols-2 gap-2">
                        {SLIDE_TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setSlideTemplate(t.id)}
                                className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                                    slideTemplate === t.id
                                        ? 'border-brand-primary dark:border-dark-primary bg-brand-primary/10 dark:bg-dark-primary/20 shadow-sm'
                                        : 'border-brand-subtle dark:border-dark-subtle hover:border-brand-primary/50 dark:hover:border-dark-primary/50'
                                }`}
                            >
                                <span className="text-base mr-1">{t.icon}</span>
                                <span className="font-semibold text-brand-text dark:text-dark-text">{t.name}</span>
                                <p className="text-brand-text/60 dark:text-dark-text/60 mt-0.5 leading-tight">{t.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Column 2: Styling + Controls */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-secondary">Styling & Analysis</h3>
                
                {/* Color Palette */}
                <div className="flex flex-wrap items-end gap-4">
                     <div className="flex-grow min-w-[200px]">
                         <label htmlFor="color-palette-slide" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Color Palette</label>
                         <select id="color-palette-slide" value={colorPaletteName} onChange={(e) => setColorPaletteName(e.target.value)} className="mt-1 block w-full bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md p-2 focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary text-brand-text dark:text-dark-text">
                            {Object.values(colorPalettes).map(p => <option key={p.name} value={p.name}>{p.displayName}</option>)}
                        </select>
                     </div>
                     <div className="flex items-center space-x-1 p-2 rounded border border-brand-subtle dark:border-dark-subtle" style={{backgroundColor: currentPalette.background}}>
                         {currentPalette.colors.slice(0, 4).map(c => <div key={c} className="w-5 h-5 rounded-full" style={{backgroundColor: c}}></div>)}
                     </div>
                </div>

                {/* Bullet Count */}
                <div>
                    <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                        Bullet Points: <span className="font-bold text-brand-primary dark:text-dark-primary">{bulletCount}</span>
                    </label>
                    <input type="range" value={bulletCount} onChange={e => setBulletCount(parseInt(e.target.value))} min="3" max="8" className="w-full h-2 bg-brand-subtle dark:bg-dark-subtle rounded-lg appearance-none cursor-pointer mt-1" />
                </div>

                {/* Analysis Depth + Tone */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Analysis Depth</label>
                        <select value={analysisDepth} onChange={e => setAnalysisDepth(e.target.value)} className="mt-1 block w-full bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md p-2 text-brand-text dark:text-dark-text">
                            <option value="Summary">Summary</option>
                            <option value="Detailed">Detailed</option>
                            <option value="Executive">Executive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Tone</label>
                        <select value={tone} onChange={e => setTone(e.target.value)} className="mt-1 block w-full bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md p-2 text-brand-text dark:text-dark-text">
                            <option value="Professional">Professional</option>
                            <option value="Academic">Academic</option>
                            <option value="Executive Brief">Executive Brief</option>
                        </select>
                    </div>
                </div>
                
                {/* Font (AI suggested) */}
                <div>
                    <label htmlFor="font" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Font</label>
                    <select id="font" value={generatedSlide?.font || font} onChange={(e) => setFont(e.target.value)} disabled className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 dark:text-gray-300 border border-brand-subtle dark:border-dark-subtle rounded-md p-2">
                        <option>Arial</option><option>Calibri</option><option>Times New Roman</option><option>Verdana</option>
                    </select>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Font is intelligently selected by the AI based on the theme.</p>
                </div>
            </div>
        </div>

        {/* Generate Button */}
        <button
            onClick={handleGeneratePreview}
            disabled={isGenerating || !isPptxgenLoaded || !!libraryError}
            className="mt-8 w-full flex items-center justify-center px-6 py-3 bg-brand-primary dark:bg-dark-primary text-white dark:text-dark-text font-semibold rounded-lg shadow-md hover:bg-brand-secondary dark:hover:bg-dark-subtle transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {isGenerating ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Generating...</>
            ) : libraryError ? 'Library Error' : !isPptxgenLoaded ? (
                 <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Loading...</>
            ) : (
                'Generate Preview'
            )}
        </button>
         {(error || libraryError) && <p className="mt-2 text-center text-red-600 dark:text-red-400 text-sm">{error || libraryError}</p>}


        {/* Preview Section */}
        <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-secondary">Preview</h3>
                 {generatedSlide && (
                     <button
                        onClick={handleDownloadPptx}
                        disabled={isDownloading || !generatedSlide}
                        className="flex items-center justify-center px-4 py-2 bg-green-700 text-white font-semibold rounded-lg shadow-md hover:bg-green-800 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <DownloadIcon className="h-5 w-5 mr-2" />}
                        {isDownloading ? 'Downloading...' : 'Download .pptx'}
                    </button>
                 )}
            </div>
            <div className="relative w-full aspect-video bg-brand-background/50 dark:bg-dark-background/50 border-2 border-dashed border-brand-subtle dark:border-dark-subtle rounded-lg flex items-center justify-center">
                {generatedSlide ? (
                    <SlidePreview slide={{ ...generatedSlide, chart: getLiveThemedChartForPreview() }} />
                ) : (
                     <p className="text-brand-text/60 dark:text-dark-text/60">Your generated slide will appear here</p>
                )}
            </div>
        </div>

        {/* Hidden renderer for generating chart images */}
        {themedChartForGen && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={hiddenChartRef} style={{ width: '960px', height: '540px' }}>
                    <ChartRenderer chart={themedChartForGen} width={960} height={540} />
                </div>
            </div>
        )}
    </div>
  );
};

export default SlideGenerator;
