import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface DataInputProps {
  onSubmit: (data: {
    textData: string;
    fileData: { base64: string; mimeType: string } | null;
    chartPreferences: string;
    preferredChartType: string;
    chartVariants: number;
  }) => void;
  isLoading: boolean;
}

const CHART_TYPES = [
  { value: 'auto', label: '🤖 Auto (System Decides Best)' },
  { value: 'bar', label: '📊 Bar Chart' },
  { value: 'line', label: '📈 Line Chart' },
  { value: 'pie', label: '🥧 Pie Chart' },
  { value: 'area', label: '📉 Area Chart' },
  { value: 'composed', label: '🔀 Composed Chart' },
];

const DataInput: React.FC<DataInputProps> = ({ onSubmit, isLoading }) => {
  const [textData, setTextData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [chartPreferences, setChartPreferences] = useState<string>('');
  const [preferredChartType, setPreferredChartType] = useState<string>('auto');
  const [chartVariants, setChartVariants] = useState<number>(3);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          setFileData({ base64, mimeType: file.type });
        }
      };
      reader.onerror = () => alert('Failed to read file.');
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ textData, fileData, chartPreferences, preferredChartType, chartVariants });
  }, [onSubmit, textData, fileData, chartPreferences, preferredChartType, chartVariants]);

  return (
    <div className="bg-brand-surface dark:bg-dark-surface p-6 rounded-xl border border-brand-subtle dark:border-dark-subtle shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-brand-secondary dark:text-dark-secondary">Provide Your Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Row 1: Text data + File upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="text-data" className="mb-2 block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                Paste Text or Data
              </label>
              <textarea
                id="text-data"
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                placeholder={"e.g., Year,Sales,Expenses\n2020,100,60\n2021,120,70"}
                className="h-48 w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary transition-colors text-brand-text dark:text-dark-text resize-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                Or Upload a File
              </label>
              <label
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-48 w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border-2 border-dashed border-brand-subtle dark:border-dark-subtle rounded-md cursor-pointer hover:border-brand-primary dark:hover:border-dark-primary hover:bg-brand-background dark:hover:bg-dark-background transition-colors"
              >
                <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="font-semibold text-brand-primary dark:text-dark-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">CSV, Excel, Word, or PDF files</p>
              </label>
              {fileName && (
                  <div className="flex items-center justify-between mt-2 text-sm bg-green-100/50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 rounded-md px-3 py-1.5 animate-fade-in">
                    <span className="truncate" title={fileName}>{fileName}</span>
                    <button type="button" onClick={handleRemoveFile} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xl leading-none flex-shrink-0" title="Remove file">&times;</button>
                  </div>
              )}
              <input id="file-upload" ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.doc,.docx,.pdf" onChange={handleFileChange} className="hidden" disabled={isLoading} />
            </div>
          </div>

          {/* Row 2: Chart type + variants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="chart-type" className="mb-2 block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                Preferred Chart Type
              </label>
              <select
                id="chart-type"
                value={preferredChartType}
                onChange={(e) => setPreferredChartType(e.target.value)}
                className="w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary text-brand-text dark:text-dark-text"
                disabled={isLoading}
              >
                {CHART_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
              <p className="text-xs text-brand-text/60 dark:text-dark-text/60 mt-1">
                {preferredChartType === 'auto' 
                  ? 'System analyzes your data and picks the best chart types' 
                  : `All generated charts will be ${preferredChartType} type`}
              </p>
            </div>
            <div>
              <label htmlFor="chart-variants" className="mb-2 block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
                Number of Chart Variants: <span className="font-bold text-brand-primary dark:text-dark-primary">{chartVariants}</span>
              </label>
              <input
                type="range"
                id="chart-variants"
                value={chartVariants}
                onChange={(e) => setChartVariants(parseInt(e.target.value, 10))}
                min="1"
                max="4"
                className="w-full h-2 bg-brand-subtle dark:bg-dark-subtle rounded-lg appearance-none cursor-pointer mt-3"
                disabled={isLoading || preferredChartType !== 'auto'}
              />
              <p className="text-xs text-brand-text/60 dark:text-dark-text/60 mt-1">
                {preferredChartType !== 'auto' 
                  ? 'Fixed to user-specified type — variants show different data perspectives' 
                  : 'How many different chart types to generate'}
              </p>
            </div>
          </div>

          {/* Row 3: Additional preferences */}
          <div>
            <label htmlFor="chart-prefs" className="mb-2 block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
              Additional Preferences (Optional)
            </label>
            <textarea
              id="chart-prefs"
              value={chartPreferences}
              onChange={(e) => setChartPreferences(e.target.value)}
              placeholder="e.g., Focus on comparing Q3 vs Q4. Use warm colors. Highlight growth trends."
              rows={2}
              className="w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary transition-colors text-brand-text dark:text-dark-text resize-none"
              disabled={isLoading}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || (!textData && !fileData)}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-brand-primary text-white dark:bg-dark-primary dark:text-dark-text font-semibold rounded-lg shadow-md hover:bg-brand-secondary dark:hover:bg-dark-subtle transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            'Generate Charts'
          )}
        </button>
      </form>
    </div>
  );
};

export default DataInput;