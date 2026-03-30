
import { ChartDefinition, SelectedChart } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('doku_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('doku_token');
    localStorage.removeItem('doku_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Server error.' }));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
};

// ========== CHART GENERATION ==========

export interface ChartGenerationResult {
  charts: ChartDefinition[];
  analysis?: any;
  recommendations?: Array<{ type: string; score: number; reason: string }>;
}

export const generateChartSuggestions = async (input: {
  textData: string;
  fileData: { base64: string; mimeType: string } | null;
  chartPreferences: string;
  preferredChartType?: string;
  chartVariants?: number;
}): Promise<ChartGenerationResult> => {
  const res = await fetch(`${API_BASE}/generate/charts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse(res);
};

// ========== SLIDE GENERATION ==========

export const generateFullSlideDefinition = async (
  description: string,
  selectedChart: SelectedChart | null,
  themeHint: string,
  options?: {
    template?: string;
    bulletCount?: number;
    analysisDepth?: string;
    tone?: string;
  }
): Promise<{
  title: string;
  content: string[];
  chart?: ChartDefinition;
  style?: { font: string; color: string; backgroundColor: string; colorPaletteName?: string };
}> => {
  const res = await fetch(`${API_BASE}/generate/slides`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      description,
      selectedChart,
      themeHint,
      ...options,
    }),
  });
  return handleResponse(res);
};

// ========== COLOR PALETTE GENERATION ==========

export const generateColorPalette = async (
  description: string,
  backgroundColor: string
): Promise<{ colors: string[] }> => {
  const res = await fetch(`${API_BASE}/generate/color-palette`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ description, backgroundColor }),
  });
  return handleResponse(res);
};

// ========== REPORT GENERATION ==========

export const generateReportContent = async (
  details: string,
  components: string[],
  pageCount: number,
  reportStyle?: string
): Promise<string> => {
  const res = await fetch(`${API_BASE}/generate/reports`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ details, components, pageCount, reportStyle }),
  });
  const data = await handleResponse(res);
  return data.html;
};
