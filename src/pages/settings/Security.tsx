import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  User, 
  Clock, 
  Eye, 
  EyeOff, 
  Save, 
  AlertCircle, 
  Check,
  RefreshCw,
  Loader2,
  UserX,
  LogOut,
  FileText,
  HelpCircle,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SessionLog {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active_at: string;
  is_active: boolean;
}

interface SecuritySettings {
  password_expiry_days: number;
  min_password_length: number;
  require_special_chars: boolean;
  require_numbers: boolean;
  require_uppercase: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  enforce_mfa: boolean;
  ip_restriction_enabled: boolean;
  allowed_ips: string[];
}

export default function Security() {
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    password_expiry_days: 90,
    min_password_length: 8,
    require_special_chars: true,
    require_numbers: true,
    require_uppercase: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 60,
    enforce_mfa: false,
    ip_restriction_enabled: false,
    allowed_ips: []
  });
  
  const [newIp, setNewIp] = useState('');

  useEffect(() => {
    fetchSessionLogs();
    fetchSecuritySettings();
  }, []);

  useEffect(() => {
    // Calcular score da senha
    let score = 0;
    
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    
    setPasswordScore(score);
  }, [newPassword]);

  async function fetchSessionLogs() {
    try {
      setLoading(true);
      
      // Em uma implementação real, isso buscaria do banco de dados
      // Para este exemplo, vamos gerar dados fictícios
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados fictícios
      const mockSessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: '123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2',
          user_id: '123',
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: false
        },
        {
          id: '3',
          user_id: '123',
          ip_address: '192.168.1.3',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          last_active_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: false
        }
      ];
      
      setSessionLogs(mockSessionLogs);
    } catch (err) {
      console.error('Error fetching session logs:', err);
      setError('Falha ao carregar logs de sessão');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSecuritySettings() {
    try {
      // Em uma implementação real, isso buscaria do banco de dados
      // Para este exemplo, vamos usar os valores padrão definidos no estado
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Error fetching security settings:', err);
      setError('Falha ao carregar configurações de segurança');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }
      
      if (passwordScore < 3) {
        throw new Error('A senha não atende aos requisitos mínimos de segurança');
      }
      
      // Em uma implementação real, isso enviaria para o Supabase Auth
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Falha ao alterar senha');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSaveSecuritySettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Configurações de segurança salvas com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving security settings:', err);
      setError('Falha ao salvar configurações de segurança');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleTerminateSession(sessionId: string) {
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Atualizar estado local
      setSessionLogs(sessionLogs.map(session => 
        session.id === sessionId 
          ? { ...session, is_active: false, last_active_at: new Date().toISOString() }
          : session
      ));
      
      setSuccess('Sessão encerrada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error terminating session:', err);
      setError('Falha ao encerrar sessão');
    }
  }

  function handleAddIp() {
    if (!newIp) return;
    
    // Validação simples de IP
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIp)) {
      setError('Formato de IP inválido');
      return;
    }
    
    setSecuritySettings({
      ...securitySettings,
      allowed_ips: [...securitySettings.allowed_ips, newIp]
    });
    
    setNewIp('');
  }

  function handleRemoveIp(ip: string) {
    setSecuritySettings({
      ...securitySettings,
      allowed_ips: securitySettings.allowed_ips.filter(item => item !== ip)
    });
  }

  function getPasswordStrengthColor() {
    if (passwordScore >= 4) return 'bg-green-500';
    if (passwordScore >= 3) return 'bg-yellow-500';
    if (passwordScore >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function getPasswordStrengthText() {
    if (passwordScore >= 4) return 'Forte';
    if (passwordScore >= 3) return 'Boa';
    if (passwordScore >= 2) return 'Média';
    if (passwordScore >= 1) return 'Fraca';
    return 'Muito fraca';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getBrowserIcon(userAgent: string) {
    if (userAgent.includes('Chrome')) return '🌐';
    if (userAgent.includes('Firefox')) return '🦊';
    if (userAgent.includes('Safari')) return '🧭';
    if (userAgent.includes('Edge')) return '📱';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return '🔵';
    return '🌐';
  }

  function getDeviceType(userAgent: string) {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('Android')) return 'Móvel';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Desconhecido';
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-medium">Configurações de Segurança</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie as configurações de segurança e acesso ao sistema
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Alterar Senha */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Alterar Senha</h3>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Força da senha:</span>
                      <span className="text-xs font-medium">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()}`} 
                        style={{ width: `${(passwordScore / 5) * 100}%` }}
                      ></div>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                        {newPassword.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Mínimo de 8 caracteres
                      </li>
                      <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/[A-Z]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Pelo menos uma letra maiúscula
                      </li>
                      <li className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/[0-9]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Pelo menos um número
                      </li>
                      <li className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Pelo menos um caractere especial
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : ''
                  }`}
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Alterando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Alterar Senha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Configurações de Segurança */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Políticas de Segurança</h3>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSaveSecuritySettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiração de Senha (dias)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="365"
                    value={securitySettings.password_expiry_days}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      password_expiry_days: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    0 = sem expiração
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho Mínimo da Senha
                  </label>
                  <input 
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.min_password_length}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      min_password_length: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tentativas de Login Máximas
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      max_login_attempts: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração do Bloqueio (minutos)
                  </label>
                  <input 
                    type="number"
                    min="5"
                    max="1440"
                    value={securitySettings.lockout_duration_minutes}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      lockout_duration_minutes: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo Limite da Sessão (minutos)
                  </label>
                  <input 
                    type="number"
                    min="5"
                    max="1440"
                    value={securitySettings.session_timeout_minutes}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      session_timeout_minutes: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exigir Caracteres Especiais
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Exige que as senhas contenham pelo menos um caractere especial
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.require_special_chars}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        require_special_chars: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                     after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exigir Números
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Exige que as senhas contenham pelo menos um número
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.require_numbers}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        require_numbers: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                     after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exigir Letras Maiúsculas
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Exige que as senhas contenham pelo menos uma letra maiúscula
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.require_uppercase}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        require_uppercase: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                     after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exigir Autenticação de Dois Fatores (MFA)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Exige que todos os usuários configurem a autenticação de dois fatores
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.enforce_mfa}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        enforce_mfa: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                     after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Restrição de IP
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Limitar o acesso ao sistema apenas a IPs específicos
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.ip_restriction_enabled}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        ip_restriction_enabled: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                     after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                     after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                {securitySettings.ip_restriction_enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        placeholder="Ex: 192.168.1.1"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddIp}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                      >
                        Adicionar IP
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {securitySettings.allowed_ips.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Nenhum IP adicionado. Adicione pelo menos um IP para ativar a restrição.
                        </p>
                      ) : (
                        securitySettings.allowed_ips.map((ip, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm">{ip}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIp(ip)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Sessões Ativas */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium">Sessões Ativas</h3>
              </div>
              <button
                onClick={fetchSessionLogs}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sessionLogs.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma sessão encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessionLogs.map((session) => (
                  <div 
                    key={session.id} 
                    className={`border rounded-lg p-4 ${session.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{getBrowserIcon(session.user_agent)}</span>
                          <span className="font-medium">{getDeviceType(session.user_agent)}</span>
                          {session.is_active && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                              Ativa
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          IP: {session.ip_address}
                        </p>
                        
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Iniciada em: {formatDate(session.created_at)}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Última atividade: {formatDate(session.last_active_at)}
                          </span>
                        </div>
                      </div>
                      
                      {session.is_active && (
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Encerrar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Dicas de Segurança */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-700">Dicas de Segurança</h3>
              <ul className="mt-2 space-y-2 text-sm text-blue-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Use senhas fortes e únicas para cada serviço</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Ative a autenticação de dois fatores sempre que possível</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Não compartilhe suas credenciais com outras pessoas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Verifique regularmente as sessões ativas e encerre as que não reconhecer</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Mantenha seu sistema operacional e navegador atualizados</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Logs de Auditoria */}
        <div className="flex justify-end">
          <button
            onClick={() => alert('Esta funcionalidade será implementada em breve')}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <FileText className="w-4 h-4" />
            <span>Ver Logs de Auditoria</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { X } from 'lucide-react';