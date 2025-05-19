import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Users, 
  Building2,
  Loader2,
  Filter,
  ArrowRight,
  MessageSquare,
  BarChart2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AIAgentList from './AIAgentList';

export default function AIAgents() {
  const navigate = useNavigate();
  
  return <AIAgentList />;
}