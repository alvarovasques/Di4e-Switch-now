import React, { useState, useEffect } from 'react';
import { Building2, Image, Sun, Moon, Upload, AlertCircle, Check, X, Clock, Globe, Facebook, Instagram, Twitter, Linkedin as LinkedIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CompanySettings {
  id: string;
  name: string;
  logo_url: string | null;
  theme: 'light' | 'dark' | 'system';
  primary_color: '#70BDA7';
  secondary_color: '#6366F1';
  font_family: string;
  email: string;
  phone: string;
  tagline: string;
  address: string;
  website: string;
  business_hours: {
    [key: string]: { open: string; close: string };
  };
  social_media: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  billing: {
    company_name: string;
    tax_id: string;
    billing_email: string;
    billing_address: string;
  };
  created_at: string;
  updated_at: string;
}

const defaultSettings: CompanySettings = {
  id: '',
  name: '',
  logo_url: null,
  theme: 'light',
  primary_color: '#70BDA7', // Updated brand color
  secondary_color: '#6366F1', // Updated accent color
  font_family: 'Inter',
  email: '',
  phone: '',
  tagline: '',
  address: '',
  website: '',
  business_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '', close: '' },
    sunday: { open: '', close: '' }
  },
  social_media: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: ''
  },
  billing: {
    company_name: '',
    tax_id: '',
    billing_email: '',
    billing_address: '',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const STORAGE_BUCKET = 'company-logos';

export default function CompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoFile]);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase.from('company_settings').select('*').single();
      if (error) throw error;
      if (data) {
        // Ensure business_hours object exists with default values
        const defaultBusinessHours = {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '', close: '' },
          sunday: { open: '', close: '' }
        };

        const settingsWithDefaults = {
          ...defaultSettings,
          ...data,
          business_hours: {
            ...defaultBusinessHours,
            ...data.business_hours
          },
          social_media: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
            ...data.social_media
          }
        };
        setSettings(settingsWithDefaults);
        if (settingsWithDefaults.logo_url) setPreviewUrl(settingsWithDefaults.logo_url);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }
    setLogoFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let logoUrl = settings.logo_url;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = fileName;

        if (settings.logo_url) {
          try {
            const oldPath = settings.logo_url.split('/').pop();
            if (oldPath) {
              await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
            }
          } catch (err) {
            console.error('Error deleting old logo:', err);
          }
        }

        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, logoFile);
        if (uploadError) throw new Error(`Failed to upload logo: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
        logoUrl = publicUrl;
      }

      const { data: existingSettings } = await supabase.from('company_settings').select('id').single();
      let error;

      if (existingSettings) {
        const { error: updateError } = await supabase
          .from('company_settings')
          .update({
            ...settings,
            logo_url: logoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('company_settings')
          .insert({
            ...settings,
            logo_url: logoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) throw error;

      setSuccess('Settings saved successfully');
      fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-medium">Configurações da Empresa</h2>
        <p className="text-sm text-gray-500">Gerencie as informações e aparência da sua empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">Logo da Empresa</label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center relative bg-gray-50 hover:bg-gray-100 transition-colors">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Company logo"
                      className="w-full h-full object-contain rounded-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setPreviewUrl(null);
                        setSettings(prev => ({ ...prev, logo_url: null }));
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <Image className="w-8 h-8 mx-auto text-gray-400" />
                    <label
                      htmlFor="logo-upload"
                      className="mt-2 cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-700 bg-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <span>Upload</span>
                      <input
                        id="logo-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Logo da empresa</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Recomendado: PNG, JPG ou GIF com fundo transparente, máximo 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Nome da Empresa</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Telefone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Endereço</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow resize-none"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">Aparência</h3>
            <p className="mt-1 text-sm text-gray-500">Personalize as cores e o tema do sistema</p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Tema</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Fonte</label>
                <select
                  value={settings.font_family}
                  onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Cor Primária</label>
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Cor Secundária</label>
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Slogan/Tagline</label>
            <input
              type="text"
              value={settings.tagline || ''}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="Ex: Transformando ideias em realidade"
              className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Horário de Funcionamento</h3>
            <div className="grid gap-4">
              {weekDays.map(day => (
                <div key={day.key} className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-700">{day.label}</label>
                  <input
                    type="time"
                    value={settings.business_hours?.[day.key]?.open || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        business_hours: {
                          ...settings.business_hours,
                          [day.key]: {
                            ...settings.business_hours[day.key],
                            open: e.target.value
                          }
                        }
                      };
                      setSettings(newSettings);
                    }}
                    className="rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                  />
                  <input
                    type="time"
                    value={settings.business_hours?.[day.key]?.close || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        business_hours: {
                          ...settings.business_hours,
                          [day.key]: {
                            ...settings.business_hours[day.key],
                            close: e.target.value
                          }
                        }
                      };
                      setSettings(newSettings);
                    }}
                    className="rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">Redes Sociais</h3>
            <p className="mt-1 text-sm text-gray-500">Links para suas redes sociais</p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                <input
                  type="url"
                  value={settings.social_media?.facebook || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    social_media: { ...settings.social_media, facebook: e.target.value }
                  })}
                  placeholder="URL do Facebook"
                  className="flex-1 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" />
                <input
                  type="url"
                  value={settings.social_media?.instagram || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    social_media: { ...settings.social_media, instagram: e.target.value }
                  })}
                  placeholder="URL do Instagram"
                  className="flex-1 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div className="flex items-center gap-2">
                <Twitter className="w-5 h-5 text-blue-400" />
                <input
                  type="url"
                  value={settings.social_media?.twitter || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    social_media: { ...settings.social_media, twitter: e.target.value }
                  })}
                  placeholder="URL do Twitter"
                  className="flex-1 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div className="flex items-center gap-2">
                <LinkedIn className="w-5 h-5 text-blue-700" />
                <input
                  type="url"
                  value={settings.social_media?.linkedin || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    social_media: { ...settings.social_media, linkedin: e.target.value }
                  })}
                  placeholder="URL do LinkedIn"
                  className="flex-1 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">Informações de Faturamento</h3>
            <p className="mt-1 text-sm text-gray-500">Dados para emissão de notas fiscais</p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Razão Social</label>
                <input
                  type="text"
                  value={settings.billing.company_name}
                  onChange={(e) => setSettings({
                    ...settings,
                    billing: { ...settings.billing, company_name: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">CNPJ</label>
                <input
                  type="text"
                  value={settings.billing.tax_id}
                  onChange={(e) => setSettings({
                    ...settings,
                    billing: { ...settings.billing, tax_id: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Email Financeiro</label>
                <input
                  type="email"
                  value={settings.billing.billing_email}
                  onChange={(e) => setSettings({
                    ...settings,
                    billing: { ...settings.billing, billing_email: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Endereço de Faturamento</label>
                <textarea
                  value={settings.billing.billing_address}
                  onChange={(e) => setSettings({
                    ...settings,
                    billing: { ...settings.billing, billing_address: e.target.value }
                  })}
                  rows={3}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-shadow resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => fetchSettings()}
            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Salvando...</span>
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}