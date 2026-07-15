import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Check, 
  Sparkles, 
  Sliders,
  DollarSign,
  ClipboardList,
  Wrench,
  Info
} from 'lucide-react';
import { ServiceTemplate } from '../types';
import { formatBRL } from '../utils';

interface ServicesCatalogViewProps {
  serviceTemplates: ServiceTemplate[];
  setServiceTemplates: React.Dispatch<React.SetStateAction<ServiceTemplate[]>>;
  onTriggerNotification: (title: string, body: string, type: 'status_update' | 'billing' | 'payment_pending' | 'reconciliation') => void;
}

export default function ServicesCatalogView({
  serviceTemplates,
  setServiceTemplates,
  onTriggerNotification
}: ServicesCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Add/Edit Service
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('0');

  const filteredServices = useMemo(() => {
    return serviceTemplates.filter(s => {
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             s.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [serviceTemplates, searchQuery]);

  // Overall Stats
  const serviceStats = useMemo(() => {
    const totalCount = serviceTemplates.length;
    const avgPrice = totalCount > 0 ? (serviceTemplates.reduce((sum, s) => sum + s.standardPrice, 0) / totalCount) : 0;
    const highestPrice = totalCount > 0 ? Math.max(...serviceTemplates.map(s => s.standardPrice)) : 0;
    const lowestPrice = totalCount > 0 ? Math.min(...serviceTemplates.map(s => s.standardPrice)) : 0;

    return {
      totalCount,
      avgPrice,
      highestPrice,
      lowestPrice
    };
  }, [serviceTemplates]);

  // Handle Form Submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) {
      alert('O nome do serviço é obrigatório');
      return;
    }

    const price = parseFloat(servicePrice) || 0;

    if (editingId) {
      // Edit
      setServiceTemplates(prev => prev.map(s => {
        if (s.id === editingId) {
          return {
            ...s,
            name: serviceName,
            description: serviceDesc,
            standardPrice: price
          };
        }
        return s;
      }));
      onTriggerNotification(
        'Serviço Editado',
        `Serviço "${serviceName}" atualizado no catálogo técnico com valor padrão de ${formatBRL(price)}.`,
        'status_update'
      );
    } else {
      // Add New
      const newService: ServiceTemplate = {
        id: 'SERV_' + Date.now(),
        name: serviceName,
        description: serviceDesc,
        standardPrice: price,
        createdAt: new Date().toISOString()
      };
      setServiceTemplates(prev => [newService, ...prev]);
      onTriggerNotification(
        'Novo Serviço Cadastrado',
        `Serviço "${serviceName}" adicionado ao catálogo com valor padrão de ${formatBRL(price)}.`,
        'status_update'
      );
    }

    // Reset and close
    setServiceName('');
    setServiceDesc('');
    setServicePrice('0');
    setEditingId(null);
    setShowFormModal(false);
  };

  const handleEditClick = (s: ServiceTemplate) => {
    setEditingId(s.id);
    setServiceName(s.name);
    setServiceDesc(s.description);
    setServicePrice(String(s.standardPrice));
    setShowFormModal(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o serviço "${name}" do catálogo?`)) {
      setServiceTemplates(prev => prev.filter(s => s.id !== id));
      onTriggerNotification(
        'Serviço Removido',
        `Serviço "${name}" foi excluído do catálogo.`,
        'status_update'
      );
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen space-y-6">
      
      {/* HEADER SECTION WITH STATS */}
      <div className="bg-white border-b border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Catálogo Laboratorial
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
              <Sparkles className="text-indigo-600 animate-pulse" size={20} /> Cadastro de Serviços Técnicos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Defina previamente o valor de mão de obra de reparos e laudos frequentes para agilizar o preenchimento de orçamentos e Ordens de Serviço.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setServiceName('');
              setServiceDesc('');
              setServicePrice('0');
              setShowFormModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={14} /> Novo Serviço Técnico
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Serviços Catalogados</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">{serviceStats.totalCount}</p>
            <span className="text-[10px] text-indigo-600 font-semibold">Modelos de mão de obra prontos</span>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mão de Obra Média</p>
            <p className="text-2xl font-black text-indigo-600 font-mono mt-1">{formatBRL(serviceStats.avgPrice)}</p>
            <span className="text-[10px] text-slate-500 font-medium">Ticket médio de serviços</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Maior Mão de Obra</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{formatBRL(serviceStats.highestPrice)}</p>
            <span className="text-[10px] text-slate-500 font-medium">Serviços complexos (BGA/Telas)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Menor Mão de Obra</p>
            <p className="text-2xl font-black text-slate-800 font-mono mt-1">{formatBRL(serviceStats.lowestPrice)}</p>
            <span className="text-[10px] text-slate-500 font-medium">Diagnósticos e limpezas simples</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND DIRECTORY CARDS */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar por nome do serviço ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Grid Directory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400 italic text-xs bg-white border border-slate-200 rounded-2xl">
              Nenhum serviço técnico cadastrado no momento.
            </div>
          ) : (
            filteredServices.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-200 transition-colors flex flex-col justify-between space-y-4">
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
                        <Wrench size={14} className="text-indigo-600" /> {s.name}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block mt-1">ID: {s.id}</span>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(s.id, s.name)}
                        className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {s.description || 'Nenhuma descrição técnica fornecida para este serviço.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Preço Padrão Mão de Obra</span>
                  <span className="font-mono font-black text-indigo-700 text-sm">{formatBRL(s.standardPrice)}</span>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* FORM MODAL (ADD OR EDIT) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-1.5">
                <ClipboardList className="text-indigo-600" size={16} /> {editingId ? 'Editar Serviço Técnico' : 'Cadastrar Novo Serviço Técnico'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600">Título / Nome do Serviço:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de Conector de Carga Tipo C"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600">Laudo Técnico Padrão / Descrição do Processo:</label>
                <textarea
                  placeholder="Ex: Desmontagem do aparelho, medição de barramento de dados/energia, dessoldagem do conector danificado, limpeza do PCB com álcool isopropílico, soldagem do novo componente OEM e testes de carga."
                  rows={4}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600">Valor Padrão Mão de Obra (R$):</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full border border-indigo-200 text-indigo-700 font-black rounded-lg p-2.5 pl-6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="absolute left-2.5 top-3 text-[10px] text-slate-400 font-black">R$</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-tight">Esse valor será carregado por padrão na criação do orçamento da OS, mas poderá ser alterado livremente na tela de ordens de serviço.</p>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold cursor-pointer text-xs"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
