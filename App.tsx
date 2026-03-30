
import React, { useState, useCallback, useEffect } from 'react';
import { ChartDefinition, SelectedChart, User, SavedChartGeneration, SavedSlide, SavedReport } from './types';
import { generateChartSuggestions, ChartGenerationResult } from './services/geminiService';
import * as storage from './services/storageService';

import Auth from './components/Auth';
import Header from './components/Header';
import DataInput from './components/DataInput';
import ChartCard from './components/ChartCard';
import SlideGenerator from './components/SlideGenerator';
import ReportGenerator from './components/ReportGenerator';
import SavedContentModal from './components/SavedContentModal';
import { ChartIcon, SlideIcon, ReportIcon, SaveIcon, FolderOpenIcon, LogoIcon } from './components/Icons';

type Tab = 'charts' | 'slide' | 'report';
type ModalType = 'chartGenerations' | 'slides' | 'reports';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('charts');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('doku_theme') as Theme) || 'light');
  
  // Generator State
  const [charts, setCharts] = useState<ChartDefinition[]>([]);
  const [chartAnalysis, setChartAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<SelectedChart | null>(null);
  
  // Loaded Data State
  const [loadedSlide, setLoadedSlide] = useState<SavedSlide | null>(null);
  const [loadedReport, setLoadedReport] = useState<SavedReport | null>(null);
  
  // Saved Data State
  const [savedChartGenerations, setSavedChartGenerations] = useState<SavedChartGeneration[]>([]);
  const [savedSlides, setSavedSlides] = useState<SavedSlide[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // UI State
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  
  // Verify session on mount
  useEffect(() => {
    const verify = async () => {
      try {
        const user = await storage.verifySession();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsVerifyingSession(false);
      }
    };
    verify();
  }, []);

  // Listen for auth:logout events (from 401 responses)
  useEffect(() => {
    const handleLogout = () => {
      setCurrentUser(null);
      setActiveTab('charts');
      setCharts([]);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('doku_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Load saved content when user logs in
  useEffect(() => {
    if (currentUser) {
      const loadData = async () => {
        try {
          const [gens, slides, reports] = await Promise.all([
            storage.getSavedChartGenerations(),
            storage.getSavedSlides(),
            storage.getSavedReports(),
          ]);
          setSavedChartGenerations(gens);
          setSavedSlides(slides);
          setSavedReports(reports);
        } catch (e) {
          console.error('Failed to load saved content:', e);
        }
      };
      loadData();
    } else {
      setSavedChartGenerations([]);
      setSavedSlides([]);
      setSavedReports([]);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setActiveTab('charts');
    setCharts([]);
  };

  const handleDataSubmit = useCallback(async (input: { 
    textData: string; 
    fileData: { base64: string; mimeType: string; } | null; 
    chartPreferences: string;
    preferredChartType?: string;
    chartVariants?: number;
  }) => {
    if (!input.textData.trim() && !input.fileData) {
      setError('Please provide some data to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCharts([]);
    setChartAnalysis(null);
    try {
      const result: ChartGenerationResult = await generateChartSuggestions(input);
      setCharts(result.charts);
      setChartAnalysis(result.analysis);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate charts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleSaveGeneration = async () => {
    if (charts.length === 0) {
      alert("No charts to save.");
      return;
    }
    
    const name = `Generation from ${new Date().toLocaleString()}`;
    
    try {
      const chartsToSave: ChartDefinition[] = charts.map(chart => {
        const cleanChart: ChartDefinition = {
          title: chart.title,
          chartType: chart.chartType,
          data: JSON.parse(JSON.stringify(chart.data)),
          labelKey: chart.labelKey,
          dataKeys: [...chart.dataKeys],
        };
        if (chart.customTheme) {
          cleanChart.customTheme = JSON.parse(JSON.stringify(chart.customTheme));
        }
        return cleanChart;
      });

      const newGeneration = await storage.saveChartGeneration(chartsToSave, name);
      setSavedChartGenerations(prev => [newGeneration, ...prev]);
      alert(`Generation "${name}" saved successfully!`);
    } catch (e) {
      console.error("Save error:", e);
      alert(`Save Failed: ${(e as Error).message}`);
    }
  };


  const handleSaveSlide = async (slideData: Omit<SavedSlide, 'id' | 'name' | 'createdAt'>) => {
    try {
      const newSlide = await storage.saveSlide(slideData);
      setSavedSlides(prev => [newSlide, ...prev]);
      alert(`Slide saved successfully!`);
    } catch(e) {
      alert((e as Error).message);
    }
  };

  const handleSaveReport = async (reportData: Omit<SavedReport, 'id' | 'name' | 'createdAt'>) => {
    try {
      const newReport = await storage.saveReport(reportData);
      setSavedReports(prev => [newReport, ...prev]);
      alert(`Report saved successfully!`);
    } catch(e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteSavedContent = async (type: ModalType, id: string) => {
    try {
      if (type === 'slides') {
        await storage.deleteSlide(id);
        setSavedSlides(prev => prev.filter(s => s.id !== id));
      } else if (type === 'reports') {
        await storage.deleteReport(id);
        setSavedReports(prev => prev.filter(r => r.id !== id));
      } else if (type === 'chartGenerations') {
        await storage.deleteChartGeneration(id);
        setSavedChartGenerations(prev => prev.filter(g => g.id !== id));
      }
    } catch (e) {
       console.error("Deletion failed:", e);
       alert(`Failed to delete item: ${ (e as Error).message }`);
    }
  };

  const handleChartUpdate = (index: number, updatedChart: ChartDefinition) => {
    setCharts(prevCharts => {
      const newCharts = [...prevCharts];
      newCharts[index] = updatedChart;
      return newCharts;
    });
  };

  const handleSelectChartForSlide = useCallback((chart: ChartDefinition, imageBase64: string) => {
    setSelectedChart({ chart, imageBase64 });
    setLoadedSlide(null);
    setActiveTab('slide');
  }, []);
  
  const handleDeselectChart = () => {
    setSelectedChart(null);
  };

  const handleLoadContent = (type: ModalType, data: any) => {
    if (type === 'slides') {
        setLoadedReport(null);
        setLoadedSlide(data);
        setSelectedChart(null);
        setActiveTab('slide');
    } else if (type === 'reports') {
        setLoadedSlide(null);
        setLoadedReport(data);
        setActiveTab('report');
    } else if (type === 'chartGenerations') {
        setLoadedReport(null);
        setLoadedSlide(null);
        setCharts(data.charts);
        setActiveTab('charts');
    }
    setActiveModal(null);
  };

  if (isVerifyingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-background dark:bg-dark-background">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header user={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />

        <nav className="mt-6">
          <div className="flex flex-wrap gap-2 bg-brand-background dark:bg-dark-surface p-1.5 rounded-lg max-w-md border border-brand-subtle dark:border-dark-subtle shadow-sm">
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'charts' ? 'bg-brand-primary text-white shadow-md dark:bg-dark-primary dark:text-dark-text' : 'text-brand-secondary dark:text-dark-secondary hover:bg-brand-primary/10 dark:hover:bg-dark-primary/20'
              }`}
            >
              <ChartIcon className="h-5 w-5" />
              <span>Chart Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('slide')}
              className={`flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'slide' ? 'bg-brand-primary text-white shadow-md dark:bg-dark-primary dark:text-dark-text' : 'text-brand-secondary dark:text-dark-secondary hover:bg-brand-primary/10 dark:hover:bg-dark-primary/20'
              }`}
            >
              <SlideIcon className="h-5 w-5" />
              <span>Slide Creator</span>
            </button>
             <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 min-w-[150px] flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'report' ? 'bg-brand-primary text-white shadow-md dark:bg-dark-primary dark:text-dark-text' : 'text-brand-secondary dark:text-dark-secondary hover:bg-brand-primary/10 dark:hover:bg-dark-primary/20'
              }`}
            >
              <ReportIcon className="h-5 w-5" />
              <span>Report Creator</span>
            </button>
          </div>
        </nav>

        <main className="mt-8">
          <div className={activeTab === 'charts' ? 'animate-fade-in' : 'hidden'}>
            <DataInput onSubmit={handleDataSubmit} isLoading={isLoading} />
            {error && <div className="mt-4 p-4 bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300 border border-red-500 rounded-lg">{error}</div>}
            
            <div className="mt-8 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-secondary dark:text-dark-secondary">
                    {charts.length > 0 ? "Generated Visualizations" : "Chart Actions"}
                </h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleSaveGeneration} 
                        disabled={charts.length === 0}
                        className="flex items-center px-4 py-2 bg-brand-secondary dark:bg-dark-subtle text-white dark:text-dark-text text-sm font-semibold rounded-md hover:bg-brand-primary dark:hover:bg-dark-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Save Generation
                    </button>
                    <button 
                        onClick={() => setActiveModal('chartGenerations')} 
                        className="flex items-center px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-colors">
                        <FolderOpenIcon className="h-4 w-4 mr-2" />
                        View Saved
                    </button>
                </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center mt-10">
                <div className="w-16 h-16 border-4 border-brand-primary dark:border-dark-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-brand-text/80 dark:text-dark-text/80">Intelligently analyzing your data...</p>
              </div>
            ) : charts.length > 0 && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart, index) => (
                  <ChartCard 
                    key={index} 
                    chart={chart} 
                    index={index}
                    onSelectForSlide={handleSelectChartForSlide}
                    onChartUpdate={handleChartUpdate}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={activeTab === 'slide' ? 'animate-fade-in' : 'hidden'}>
            <SlideGenerator 
                selectedChart={selectedChart} 
                loadedSlide={loadedSlide} 
                onSave={handleSaveSlide} 
                onOpenView={() => setActiveModal('slides')} 
                onDeselectChart={handleDeselectChart}
            />
          </div>

          <div className={activeTab === 'report' ? 'animate-fade-in' : 'hidden'}>
            <ReportGenerator 
                loadedReport={loadedReport} 
                onSave={handleSaveReport} 
                onOpenView={() => setActiveModal('reports')} 
            />
          </div>
        </main>

        {activeModal && (
            <SavedContentModal 
                isOpen={!!activeModal}
                onClose={() => setActiveModal(null)}
                type={activeModal}
                content={
                    activeModal === 'chartGenerations' ? savedChartGenerations :
                    activeModal === 'slides' ? savedSlides :
                    activeModal === 'reports' ? savedReports :
                    []
                }
                onDelete={handleDeleteSavedContent}
                onLoad={handleLoadContent}
            />
        )}
      </div>
    </div>
  );
};

export default App;
