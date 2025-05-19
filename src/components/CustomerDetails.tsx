import React from 'react';
import { X, Tag as TagIcon, MessageSquare, Paperclip, Clock, Bell } from 'lucide-react';
import type { Customer, Tag } from '../types/customer';

interface CustomerDetailsProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerDetails({ customer, onClose }: CustomerDetailsProps) {
  const channelIcons = {
    whatsapp: '💬',
    telegram: '📱',
    email: '📧',
    webchat: '🌐',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold">Detalhes do Cliente</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-medium mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome</label>
                <p className="mt-1">{customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{customer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Canal</label>
                <p className="mt-1 flex items-center gap-2">
                  {channelIcons[customer.channel_type]} {customer.channel_type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Último Contato</label>
                <p className="mt-1">{new Date(customer.last_seen).toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Tags</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">
                Adicionar Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customer.tags?.map((tag: Tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  <TagIcon className="w-4 h-4" />
                  {tag.name}
                </span>
              ))}
            </div>
          </section>

          {/* Communication History */}
          <section>
            <h3 className="text-lg font-medium mb-4">Histórico de Comunicação</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Última Conversa</span>
                    <span className="text-sm text-gray-500">há 2 horas</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Atendimento sobre dúvida no produto XYZ
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Files & Attachments */}
          <section>
            <h3 className="text-lg font-medium mb-4">Arquivos e Anexos</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Paperclip className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">documento.pdf</p>
                  <p className="text-xs text-gray-500">PDF • 2.4 MB</p>
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-700">
                  Download
                </button>
              </div>
            </div>
          </section>

          {/* Internal Notes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Notas Internas</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">
                Adicionar Nota
              </button>
            </div>
            <div className="space-y-4">
              {customer.notes?.map((note) => (
                <div key={note.id} className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Agente: {note.created_by}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Tarefas</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">
                Nova Tarefa
              </button>
            </div>
            <div className="space-y-3">
              {customer.tasks?.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className="w-4 h-4" />
                      Atribuído para: {task.assigned_to}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interaction Log */}
          <section>
            <h3 className="text-lg font-medium mb-4">Log de Interações</h3>
            <div className="border rounded-lg divide-y">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Transferência de Atendimento</span>
                  <span className="text-sm text-gray-500">10:30</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Transferido de João para Maria
                </p>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">SLA Atualizado</span>
                  <span className="text-sm text-gray-500">09:15</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Prioridade alterada para Alta
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}