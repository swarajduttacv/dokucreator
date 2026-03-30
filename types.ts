
export interface ChartDataItem {
  [key: string]: string | number;
}

export interface ChartDefinition {
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'composed';
  data: ChartDataItem[];
  labelKey: string;
  dataKeys: string[];
  customTheme?: {
    background: string;
    colors: string[];
  };
}

export interface SelectedChart {
  chart: ChartDefinition;
  imageBase64: string;
}

// --- Auth & Storage ---

export interface User {
  id?: string;
  username: string;
  password?: string;
}

export interface SavedItem {
  id: string;
  name: string;
  createdAt: string;
}

export interface SavedChartGeneration extends SavedItem {
  charts: ChartDefinition[];
}

export interface SavedSlide extends SavedItem {
  slideData: {
    title: string;
    content: string[];
    font: string;
    color: string;
    backgroundColor: string;
    colorPaletteName?: string;
    chart?: ChartDefinition;
  };
}

export interface SavedReport extends SavedItem {
  reportHtml: string;
}

// --- Slide Templates ---

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  { id: 'executive-summary', name: 'Executive Summary', description: 'Key metrics with strategic takeaways', icon: '📊' },
  { id: 'data-deep-dive', name: 'Data Deep Dive', description: 'Chart + detailed analytical insights', icon: '🔍' },
  { id: 'comparison', name: 'Comparison', description: 'Side-by-side A vs B analysis', icon: '⚖️' },
  { id: 'title-slide', name: 'Title Slide', description: 'Full-screen title with subtitle', icon: '🎯' },
  { id: 'key-findings', name: 'Key Findings', description: 'Numbered insights and discoveries', icon: '💡' },
  { id: 'dashboard', name: 'Dashboard', description: 'Multiple KPIs in grid layout', icon: '📈' },
  { id: 'conclusion', name: 'Conclusion', description: 'Summary with calls-to-action', icon: '✅' },
];