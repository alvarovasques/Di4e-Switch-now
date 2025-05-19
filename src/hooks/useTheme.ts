import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CompanySettings {
  theme: 'light' | 'dark' | 'system';
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

const defaultSettings: CompanySettings = {
  theme: 'light',
  primary_color: '#4F46E5',
  secondary_color: '#6366F1',
  font_family: 'Inter'
};

export function useTheme() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings?.theme === 'system') {
        applyTheme(settings);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (settings) {
      applyTheme(settings);
    }
  }, [settings]);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('theme, primary_color, secondary_color, font_family')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no settings found, use defaults
      setSettings(data || defaultSettings);
    } catch (err) {
      console.error('Error fetching theme settings:', err);
      // Use default settings if fetch fails
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }

  function applyTheme(settings: CompanySettings) {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine theme
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && prefersDark);

    // Apply theme
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply colors with proper contrast
    const primaryColor = settings.primary_color;
    const secondaryColor = settings.secondary_color;
    
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    
    // Apply font
    root.style.setProperty('--font-family', settings.font_family);
    document.body.style.fontFamily = `var(--font-family), system-ui, sans-serif`;
  }

  return { loading };
}