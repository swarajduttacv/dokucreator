
import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, ReferenceLine
} from 'recharts';
import { toPng } from 'html-to-image';
import { ChartDefinition } from '../types';
import { DownloadIcon, SlideIcon } from './Icons';
import { getPalette } from '../utils/colorPalettes';
import { generateColorPalette } from '../services/geminiService';


interface ChartCardProps {
  chart: ChartDefinition;
  index: number;
  onSelectForSlide: (chart: ChartDefinition, imageBase64: string) => void;
  onChartUpdate: (index: number, updatedChart: ChartDefinition) => void;
}

const ChartColorCustomizer: React.FC<{
  initialTheme: { background: string; colors: string[] };
  onApply: (theme: { background: string; colors: string[] }) => void;
  onClose: () => void;
}> = ({ initialTheme, onApply, onClose }) => {
    const [background, setBackground] = useState(initialTheme.background);
    const [description, setDescription] = useState('shades of brown and beige');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleApply = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generateColorPalette(description, background);
            onApply({ background, colors: result.colors });
            onClose();
        } catch (e: any) {
            setError('Failed to generate palette. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 border-t border-brand-subtle dark:border-dark-subtle space-y-3">
            <div className="flex items-center space-x-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Background</label>
                    <input type="color" value={background} onChange={e => setBackground(e.target.value)} className="mt-1 w-16 h-8 bg-brand-surface dark:bg-dark-surface border border-brand-subtle dark:border-dark-subtle rounded-md p-0.5" />
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">Describe Colors</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., shades of green" className="mt-1 w-full p-2 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md text-brand-text dark:text-dark-text"/>
                </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end space-x-2">
                <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                <button onClick={handleApply} disabled={isLoading} className="px-3 py-1 text-sm bg-brand-primary dark:bg-dark-primary text-white dark:text-dark-text rounded-md hover:bg-brand-secondary dark:hover:bg-dark-subtle disabled:bg-gray-400">
                    {isLoading ? 'Applying...' : 'Apply'}
                </button>
            </div>
        </div>
    );
};

// Custom tooltip for professional look
const CustomTooltip = ({ active, payload, label, palette }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg p-3 border" style={{ backgroundColor: palette.background, borderColor: palette.text + '33', color: palette.text }}>
      <p className="font-semibold text-sm mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
          <span className="opacity-80">{entry.name}:</span>
          <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </p>
      ))}
    </div>
  );
};


const ChartCard: React.FC<ChartCardProps> = ({ chart, index, onSelectForSlide, onChartUpdate }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editableChart, setEditableChart] = useState<ChartDefinition>(chart);
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const palette = getPalette(undefined, editableChart.customTheme);

  useEffect(() => {
    setEditableChart(chart);
  }, [chart]);

  const handleThemeUpdate = useCallback((newTheme: { background: string; colors: string[] }) => {
    const updatedChart = { ...editableChart, customTheme: newTheme };
    setEditableChart(updatedChart);
    onChartUpdate(index, updatedChart);
  }, [editableChart, index, onChartUpdate]);

  const downloadChart = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { cacheBust: true, backgroundColor: palette.background });
      const link = document.createElement('a');
      link.download = `${editableChart.title.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download chart:', err);
      alert('Could not download the chart. Please try again.');
    }
  }, [editableChart.title, palette.background]);
  
  const handleSelect = useCallback(async () => {
    if (!chartRef.current) return;
    setIsProcessing(true);
    try {
        const dataUrl = await toPng(chartRef.current, { quality: 0.95, backgroundColor: palette.background });
        const base64 = dataUrl.split(',')[1];
        onSelectForSlide(editableChart, base64);
    } catch (err) {
        console.error('Failed to process chart for slide:', err);
        alert('Could not process chart. Please try again.');
    } finally {
        setIsProcessing(false);
    }
  }, [editableChart, onSelectForSlide, palette.background]);

  // Compute average for reference line
  const averageValue = editableChart.dataKeys.length === 1 
    ? editableChart.data.reduce((sum, row) => sum + (Number(row[editableChart.dataKeys[0]]) || 0), 0) / editableChart.data.length 
    : null;

  const renderChart = () => {
    const axisStroke = palette.text;
    const gridStroke = palette.text + '22';
    const legendColor = palette.text;

    const gradientDefs = (
      <defs>
        {editableChart.dataKeys.map((key, i) => (
          <linearGradient key={`grad-${key}`} id={`gradient-${index}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.colors[i % palette.colors.length]} stopOpacity={0.9} />
            <stop offset="100%" stopColor={palette.colors[i % palette.colors.length]} stopOpacity={0.4} />
          </linearGradient>
        ))}
      </defs>
    );

    switch (editableChart.chartType) {
      case 'bar':
        return (
          <BarChart data={editableChart.data} margin={{ top: 20, right: 20, bottom: 60, left: 5 }}>
            {gradientDefs}
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey={editableChart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
            <Tooltip content={<CustomTooltip palette={palette} />} />
            <Legend wrapperStyle={{ color: legendColor }} />
            {averageValue && <ReferenceLine y={Math.round(averageValue)} stroke={palette.text + '66'} strokeDasharray="5 5" label={{ value: `Avg: ${Math.round(averageValue).toLocaleString()}`, fill: palette.text + '99', fontSize: 11, position: 'right' }} />}
            {editableChart.dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={`url(#gradient-${index}-${i})`} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={editableChart.data} margin={{ top: 20, right: 20, bottom: 60, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey={editableChart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
            <Tooltip content={<CustomTooltip palette={palette} />} />
            <Legend wrapperStyle={{ color: legendColor }} />
            {editableChart.dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={palette.colors[i % palette.colors.length]} strokeWidth={2.5} dot={{ r: 4, fill: palette.colors[i % palette.colors.length], stroke: palette.background, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
            ))}
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie data={editableChart.data} dataKey={editableChart.dataKeys[0]} nameKey={editableChart.labelKey} cx="50%" cy="50%" outerRadius={100} innerRadius={40} fill="#8884d8" label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`} labelLine={{ stroke: palette.text + '66' }} isAnimationActive={false}>
              {editableChart.data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={palette.colors[i % palette.colors.length]} stroke={palette.background} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip palette={palette} />} />
            <Legend wrapperStyle={{ color: legendColor }}/>
          </PieChart>
        );
       case 'area':
        return (
            <AreaChart data={editableChart.data} margin={{ top: 20, right: 20, bottom: 60, left: 5 }}>
                {gradientDefs}
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/>
                <XAxis dataKey={editableChart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
                <Tooltip content={<CustomTooltip palette={palette} />}/>
                <Legend wrapperStyle={{ color: legendColor }}/>
                {editableChart.dataKeys.map((key, i) => (
                    <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={palette.colors[i % palette.colors.length]} fill={`url(#gradient-${index}-${i})`} isAnimationActive={false}/>
                ))}
            </AreaChart>
        );
      case 'composed':
          return (
            <ComposedChart data={editableChart.data} margin={{ top: 20, right: 20, bottom: 60, left: 5 }}>
              {gradientDefs}
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey={editableChart.labelKey} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis stroke={axisStroke} tick={{ fill: axisStroke }} />
              <Tooltip content={<CustomTooltip palette={palette} />} />
              <Legend wrapperStyle={{ color: legendColor }} />
              {editableChart.dataKeys[0] && <Bar dataKey={editableChart.dataKeys[0]} fill={`url(#gradient-${index}-0)`} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
              {editableChart.dataKeys[1] && <Line type="monotone" dataKey={editableChart.dataKeys[1]} stroke={palette.colors[1]} strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />}
              {editableChart.dataKeys[2] && <Area type="monotone" dataKey={editableChart.dataKeys[2]} fill={palette.colors[2] + '44'} stroke={palette.colors[2]} isAnimationActive={false} />}
            </ComposedChart>
          );
      default:
        return <div className="text-center text-gray-500">Chart type '{editableChart.chartType}' not supported yet.</div>;
    }
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-surface p-4 rounded-lg shadow-lg flex flex-col animate-slide-in-up border border-brand-subtle dark:border-dark-subtle">
      <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-secondary mb-4 text-center">{editableChart.title}</h3>
      <div className="flex-grow w-full h-80" ref={chartRef} style={{ backgroundColor: palette.background }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
       {isCustomizing && (
          <ChartColorCustomizer
              initialTheme={palette}
              onApply={handleThemeUpdate}
              onClose={() => setIsCustomizing(false)}
          />
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
         <button onClick={() => setIsCustomizing(!isCustomizing)} className="flex items-center justify-center px-4 py-2 bg-brand-secondary text-white dark:bg-dark-subtle dark:text-dark-text font-semibold rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary transition-colors col-span-1">
            Customize
        </button>
        <button onClick={handleSelect} disabled={isProcessing} className="flex items-center justify-center px-4 py-2 bg-brand-secondary text-white dark:bg-dark-subtle dark:text-dark-text font-semibold rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary transition-colors disabled:bg-gray-500 col-span-1">
            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SlideIcon className="h-5 w-5" />}
            <span className="ml-2">For Slide</span>
        </button>
        <button onClick={downloadChart} className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors col-span-1">
            <DownloadIcon className="h-5 w-5" />
            <span className="ml-2">PNG</span>
        </button>
      </div>
    </div>
  );
};

export default ChartCard;
