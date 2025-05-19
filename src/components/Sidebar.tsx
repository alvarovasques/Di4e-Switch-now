import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface CompanySettings {
  name: string;
  logo_url: string | null;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  category: string;
}

interface Category {
  label: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  categories: Record<string, Category>;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, categories, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
    
    // Initialize expanded categories based on current path
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(categories).forEach(category => {
      const categoryItems = menuItems.filter(item => item.category === category);
      const isActive = categoryItems.some(item => location.pathname === item.path);
      initialExpanded[category] = isActive;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('name, logo_url')
        .single();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching company settings:', err);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Group menu items by category
  const menuItemsByCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="h-full bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)]">
        <Link 
          to="/" 
          onClick={handleNavClick}
          className="block w-48 h-16 flex items-center justify-center" 
        >
          {settings?.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.name || 'Company Logo'} 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <Building2 className="w-12 h-12 text-primary" />
          )}
        </Link>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {Object.entries(categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="mb-4">
            {/* Category heading - only show if it's not the principal category */}
            {categoryKey !== 'principal' && (
              <div 
                className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                onClick={() => toggleCategory(categoryKey)}
              >
                <span>{category.label}</span>
                {expandedCategories[categoryKey] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
            
            {/* Category items */}
            <div className={`space-y-1 ${categoryKey !== 'principal' && !expandedCategories[categoryKey] ? 'hidden' : ''}`}>
              {menuItemsByCategory[categoryKey]?.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-primary/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 w-full p-3 rounded-lg text-gray-700 hover:bg-primary/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;