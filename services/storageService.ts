import { User, ChartDefinition, SavedChartGeneration, SavedSlide, SavedReport } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = (): string | null => localStorage.getItem('doku_token');

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
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

// --- User Management ---

export const signUp = async (username: string, password: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem('doku_token', data.token);
  localStorage.setItem('doku_user', JSON.stringify(data.user));
  return data.user;
};

export const login = async (username: string, password: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem('doku_token', data.token);
  localStorage.setItem('doku_user', JSON.stringify(data.user));
  return data.user;
};

export const logout = () => {
  localStorage.removeItem('doku_token');
  localStorage.removeItem('doku_user');
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('doku_user');
  const token = getToken();
  if (!userJson || !token) return null;
  return JSON.parse(userJson);
};

export const verifySession = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logout();
      return null;
    }
    const data = await res.json();
    localStorage.setItem('doku_user', JSON.stringify(data.user));
    return data.user;
  } catch {
    logout();
    return null;
  }
};

// --- Chart Generations ---

export const getSavedChartGenerations = async (): Promise<SavedChartGeneration[]> => {
  const res = await fetch(`${API_BASE}/content/chartGeneration`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const saveChartGeneration = async (charts: ChartDefinition[], name: string): Promise<SavedChartGeneration> => {
  const res = await fetch(`${API_BASE}/content/chartGeneration`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, charts }),
  });
  return handleResponse(res);
};

export const deleteChartGeneration = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/content/chartGeneration/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(res);
};

// --- Slides ---

export const getSavedSlides = async (): Promise<SavedSlide[]> => {
  const res = await fetch(`${API_BASE}/content/slide`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const saveSlide = async (slideData: Omit<SavedSlide, 'id' | 'name' | 'createdAt'>): Promise<SavedSlide> => {
  const res = await fetch(`${API_BASE}/content/slide`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      name: slideData.slideData?.title || 'Untitled Slide',
      slideData: slideData.slideData,
    }),
  });
  return handleResponse(res);
};

export const deleteSlide = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/content/slide/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(res);
};

// --- Reports ---

export const getSavedReports = async (): Promise<SavedReport[]> => {
  const res = await fetch(`${API_BASE}/content/report`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const saveReport = async (reportData: Omit<SavedReport, 'id' | 'name' | 'createdAt'>): Promise<SavedReport> => {
  // Extract title from HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = reportData.reportHtml;
  const title = tempDiv.querySelector('h1')?.textContent || 'Untitled Report';

  const res = await fetch(`${API_BASE}/content/report`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: title,
      reportHtml: reportData.reportHtml,
    }),
  });
  return handleResponse(res);
};

export const deleteReport = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/content/report/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(res);
};