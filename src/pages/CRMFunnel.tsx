import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter,
  Calendar,
  Download,
  ArrowRight,
  Users,
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  X,
  CheckCircle2,
  Clock,
  Ticket,
  AlertCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  LayoutGrid,
  Bot,
  Pencil
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import EditableTitle from '../components/EditableTitle';

interface Customer {
  id: string;
  name: string;
  email: string;
  funnel_stage: string;
  status: string;
  last_seen: string;
  channel_type: string;
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
  }[];
}

interface FunnelStage {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

interface SortableCustomerCardProps {
  customer: Customer;
  canDrag: boolean;
}

interface Board {
  id: string;
  name: string;
  type: 'sales' | 'support' | 'ai' | 'custom';
  stages: FunnelStage[];
  isActive: boolean;
}

const DEFAULT_BOARDS: Board[] = [
  {
    id: 'sales',
    name: 'Funil de Vendas',
    type: 'sales',
    stages: [
      {
        id: 'lead',
        name: 'Leads',
        icon: Users,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      {
        id: 'contact',
        name: 'Primeiro Contato',
        icon: MessageSquare,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
      },
      {
        id: 'qualification',
        name: 'Qualificação',
        icon: Phone,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      },
      {
        id: 'proposal',
        name: 'Proposta',
        icon: Mail,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      {
        id: 'negotiation',
        name: 'Negociação',
        icon: DollarSign,
        color: 'bg-orange-100 text-orange-700 border-orange-200',
      },
      {
        id: 'closed_won',
        name: 'Ganhos',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-700 border-green-200',
      },
      {
        id: 'closed_lost',
        name: 'Perdidos',
        icon: X,
        color: 'bg-red-100 text-red-700 border-red-200',
      },
    ],
    isActive: true,
  },
  {
    id: 'support',
    name: 'Fluxo de Tickets',
    type: 'support',
    stages: [
      {
        id: 'new',
        name: 'Novos',
        icon: Ticket,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      {
        id: 'assigned',
        name: 'Atribuídos',
        icon: Users,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
      },
      {
        id: 'in_progress',
        name: 'Em Andamento',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      {
        id: 'waiting',
        name: 'Aguardando',
        icon: Clock,
        color: 'bg-orange-100 text-orange-700 border-orange-200',
      },
      {
        id: 'resolved',
        name: 'Resolvidos',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-700 border-green-200',
      },
      {
        id: 'closed',
        name: 'Fechados',
        icon: X,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
      },
    ],
    isActive: true,
  },
  {
    id: 'ai_support',
    name: 'Atendimento IA',
    type: 'ai',
    stages: [
      {
        id: 'new',
        name: 'Novos',
        icon: Bot,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      {
        id: 'ai_handling',
        name: 'Em Atendimento IA',
        icon: Bot,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
      },
      {
        id: 'human_needed',
        name: 'Requer Humano',
        icon: Users,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      {
        id: 'resolved',
        name: 'Resolvidos',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-700 border-green-200',
      },
    ],
    isActive: true,
  },
];

function SortableCustomerCard({ customer, canDrag }: SortableCustomerCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
      onClick={() => navigate(`/customers?id=${customer.id}`)}
    >
      <div className="flex items-start gap-3">
        {canDrag && (
          <button
            className="mt-1 p-1 hover:bg-gray-100 rounded cursor-grab"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{customer.name}</h4>
              <p className="text-sm text-gray-500 truncate">{customer.email}</p>
            </div>
            <span className="flex-shrink-0 text-xs bg-gray-100 px-2 py-1 rounded-full">
              {customer.channel_type}
            </span>
          </div>
          {customer.tasks && customer.tasks.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">
                {customer.tasks.length} tasks
              </span>
              {customer.tasks.some(t => t.priority === 'urgent') && (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {new Date(customer.last_seen).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMFunnel() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('last30days');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [canDrag, setCanDrag] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [boards, setBoards] = useState<Board[]>(DEFAULT_BOARDS);
  const [selectedBoard, setSelectedBoard] = useState<Board>(DEFAULT_BOARDS[0]);
  const [showBoardModal, setShowBoardModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const checkMobileView = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agent } = await supabase
        .from('agents')
        .select('role, permissions')
        .eq('auth_id', user.id)
        .single();

      if (agent) {
        setCanDrag(['admin', 'manager', 'supervisor'].includes(agent.role));
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          funnel_stage,
          status,
          last_seen,
          channel_type,
          tasks (
            id,
            title,
            status,
            priority,
            created_at
          )
        `);

      // Add period filter
      if (period === 'today') {
        query = query.gte('last_seen', new Date().toISOString().split('T')[0]);
      } else if (period === 'last7days') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        query = query.gte('last_seen', date.toISOString());
      } else if (period === 'last30days') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        query = query.gte('last_seen', date.toISOString());
      }

      // Filter by board type
      if (selectedBoard.type === 'sales') {
        query = query.not('funnel_stage', 'is', null);
      } else if (selectedBoard.type === 'support') {
        query = query.not('status', 'is', null);
      }
      // For AI board type, we'll filter the results after fetching since the column doesn't exist

      const { data, error } = await query;

      if (error) throw error;

      // For AI board, we'll consider customers in specific stages as AI-handled
      let filteredData = data || [];
      if (selectedBoard.type === 'ai') {
        filteredData = filteredData.filter(customer => 
          ['ai_handling', 'human_needed'].includes(customer.status)
        );
      }

      setCustomers(filteredData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
    checkMobileView();
    fetchData();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, [period, selectedBoard]);

  const handleBoardNameChange = (boardId: string, newName: string) => {
    const updatedBoards = boards.map(board => 
      board.id === boardId ? { ...board, name: newName } : board
    );
    setBoards(updatedBoards);
    localStorage.setItem('crm_boards', JSON.stringify(updatedBoards));
    
    if (selectedBoard.id === boardId) {
      setSelectedBoard({ ...selectedBoard, name: newName });
      document.title = newName;
    }
  };

  const handleStageNameChange = (stageId: string, newName: string) => {
    const updatedBoard = {
      ...selectedBoard,
      stages: selectedBoard.stages.map(stage =>
        stage.id === stageId ? { ...stage, name: newName } : stage
      )
    };
    
    setSelectedBoard(updatedBoard);
    setBoards(boards.map(board =>
      board.id === selectedBoard.id ? updatedBoard : board
    ));
  };

  const handleBoardSelect = (board: Board) => {
    setSelectedBoard(board);
    setCurrentStageIndex(0);
    document.title = board.name;
  };

  const getCustomersInStage = (stageId: string) => {
    return customers.filter(customer => {
      if (selectedBoard.type === 'sales') {
        return customer.funnel_stage === stageId;
      } else if (selectedBoard.type === 'support' || selectedBoard.type === 'ai') {
        return customer.status === stageId;
      }
      return false;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeCustomer = customers.find(c => c.id === active.id);
    const newStage = selectedBoard.stages.find(s => s.id === over.id);

    if (!activeCustomer || !newStage) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          [selectedBoard.type === 'sales' ? 'funnel_stage' : 'status']: newStage.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCustomer.id);

      if (error) throw error;

      fetchData();
    } catch (err) {
      console.error('Error updating customer stage:', err);
    }

    setActiveId(null);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{selectedBoard.name}</h1>
          <p className="text-gray-600">Gerencie seu fluxo de {selectedBoard.type === 'sales' ? 'vendas' : 'atendimento'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Hoje</option>
            <option value="last7days">Últimos 7 dias</option>
            <option value="last30days">Últimos 30 dias</option>
          </select>

          <button
            onClick={() => setShowBoardModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Board</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4 overflow-x-auto pb-2">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => handleBoardSelect(board)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedBoard.id === board.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {board.type === 'sales' ? (
              <DollarSign className="w-5 h-5" />
            ) : board.type === 'support' ? (
              <MessageSquare className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
            {board.name}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedBoard.stages.map((stage) => {
            const stageCustomers = getCustomersInStage(stage.id);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${stage.color}`}>
                      <StageIcon className="w-5 h-5" />
                    </div>
                    <EditableTitle
                      value={stage.name}
                      onSave={(newName) => handleStageNameChange(stage.id, newName)}
                      className="font-medium"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      {stageCustomers.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <SortableContext
                    items={stageCustomers.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageCustomers.map((customer) => (
                      <SortableCustomerCard
                        key={customer.id}
                        customer={customer}
                        canDrag={canDrag}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <SortableCustomerCard
              customer={customers.find(c => c.id === activeId)!}
              canDrag={false}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}