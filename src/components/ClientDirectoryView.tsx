import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Fingerprint, 
  Wallet, 
  ChevronRight, 
  History,
  CheckCircle,
  Plus,
  Tag,
  Edit
} from 'lucide-react';
import { Client, ServiceOrder } from '../types';
import { formatBRL } from '../utils';

interface ClientDirectoryViewProps {
  clients: Client[];
  orders: ServiceOrder[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (id: string, fields: Partial<Client>) => void;
  onUpdateClientWallet: (id: string, amount: number) => void;
  onSelectOrder: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function ClientDirectoryView({
  clients,
  orders,
  onAddClient,
  onUpdateClient,
  onUpdateClientWallet,
  onSelectOrder,
  onNavigateToTab
}: ClientDirectoryViewProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [hasBalanceFilter, setHasBalanceFilter] = useState<boolean>(false);
  const [hasActiveOSFilter, setHasActiveOSFilter] = useState<boolean>(false);

  // New Client Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');

  // Edit Client Form states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCpf, setEditCpf] = useState('');

  // Selected client for history inspect
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.cpf.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBalance = !hasBalanceFilter || c.walletBalance > 0;
      
      const clientOrders = orders.filter(o => o.clientId === c.id);
      const hasActive = clientOrders.some(o => o.status !== 'entregue' && o.status !== 'orcamento_rejeitado');
      const matchesActiveOS = !hasActiveOSFilter || hasActive;

      return matchesSearch && matchesBalance && matchesActiveOS;
    });
  }, [clients, orders, searchQuery, hasBalanceFilter, hasActiveOSFilter]);

  // Selected Client Data
  const activeClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const handleOpenEdit = () => {
    if (!activeClient) return;
    setEditName(activeClient.name);
    setEditPhone(activeClient.phone);
    setEditEmail(activeClient.email || '');
    setEditCpf(activeClient.cpf);
    setIsEditOpen(true);
  };

  const handleEditClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !editName || !editPhone || !editCpf) {
      alert('Por favor, preencha Nome, Celular e CPF do cliente.');
      return;
    }
    onUpdateClient(activeClient.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      cpf: editCpf
    });
    setIsEditOpen(false);
  };

  // Selected Client past/current repair orders list
  const activeClientOrders = useMemo(() => {
    if (!selectedClientId) return [];
    return orders.filter(o => o.clientId === selectedClientId);
  }, [orders, selectedClientId]);

  // Submit Handler: Add Client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !cpf) {
      alert('Por favor, preencha Nome, Celular e CPF do cliente.');
      return;
    }

    onAddClient({
      name,
      phone,
      email,
      cpf,
      walletBalance: parseFloat(initialBalance) || 0
    });

    // Reset
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setCpf('');
    setInitialBalance('0');
  };

  return (
    <div className="space-y-6">
      
      {/* Search, Filter & Action Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por Nome, Celular, CPF ou Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasBalanceFilter}
              onChange={(e) => setHasBalanceFilter(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Com Saldo em Carteira
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasActiveOSFilter}
              onChange={(e) => setHasActiveOSFilter(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Com Ordem Ativa
          </label>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full lg:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <UserPlus size={15} /> Cadastrar Cliente
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Clients Directory List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Diretório de Clientes ({filteredClients.length})</h3>
            <span className="text-[10px] text-slate-400">Clique em um cliente para ver o histórico</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                Nenhum cliente atende aos filtros de busca especificados.
              </div>
            ) : (
              filteredClients.map((c) => {
                const isActive = c.id === selectedClientId;
                const clientOSCount = orders.filter(o => o.clientId === c.id).length;
                const activeOSList = orders.filter(o => o.clientId === c.id && o.status !== 'entregue' && o.status !== 'orcamento_rejeitado');

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all ${
                      isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                    id={`client-${c.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs">{c.name}</h4>
                        <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${isActive ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {c.id}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] opacity-80">
                        <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>
                        <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>
                        <span className="flex items-center gap-1"><Fingerprint size={10} /> {c.cpf}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                      <div className="text-right text-[10px]">
                        <p className={`font-semibold flex items-center gap-1 justify-end ${c.walletBalance < 0 ? 'text-rose-600 font-bold' : ''}`}>
                          <Wallet size={11} className={c.walletBalance < 0 ? 'text-rose-500' : c.walletBalance > 0 ? 'text-amber-500' : 'text-slate-400'} />
                          {c.walletBalance < 0 ? `Débito: ${formatBRL(c.walletBalance)}` : formatBRL(c.walletBalance)}
                        </p>
                        <p className="opacity-75">{clientOSCount} reparo(s) total</p>
                        {activeOSList.length > 0 && (
                          <span className="inline-block mt-0.5 px-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-[8px] rounded uppercase">
                            {activeOSList.length} Ativo(s)
                          </span>
                        )}
                      </div>
                      <ChevronRight size={14} className="opacity-40" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Client Complete Repair History Ledger (5 cols) */}
        <div className="lg:col-span-5">
          {!activeClient ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-16 text-center flex flex-col items-center justify-center text-slate-400 h-full">
              <History size={36} className="mb-2 text-slate-300 animate-pulse" />
              <p className="font-semibold text-slate-500">Histórico de Reparos do Cliente</p>
              <p className="text-xs max-w-xs mt-1">Selecione um cliente no diretório à esquerda para carregar a ficha cadastral completa e toda sua retrospectiva de consertos.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="historico-completo-cliente">
              
              {/* Header with quick Wallet Credit tool */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">Dossiê do Cliente</h4>
                    <button
                      onClick={handleOpenEdit}
                      className="p-1 bg-slate-850 hover:bg-slate-800 text-indigo-300 hover:text-white rounded transition-colors cursor-pointer"
                      title="Editar dados cadastrais"
                    >
                      <Edit size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-black mt-0.5 truncate max-w-[200px]">{activeClient.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase">
                    {activeClient.walletBalance < 0 ? 'Débito Carteira' : 'Saldo Carteira'}
                  </span>
                  <p className={`font-black text-sm ${activeClient.walletBalance < 0 ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                    {formatBRL(activeClient.walletBalance)}
                  </p>
                </div>
              </div>

              {/* Repair list */}
              <div className="p-4 space-y-4">
                <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} className="text-indigo-500" /> Registro Completo de Serviços ({activeClientOrders.length})
                </h5>

                {activeClientOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">Este cliente ainda não deu entrada com aparelhos para manutenção.</p>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {activeClientOrders.map((os) => {
                      let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                      if (os.status === 'entregue') statusBadge = "bg-blue-100 text-blue-800 border-blue-200";
                      if (os.status === 'pronto') statusBadge = "bg-green-100 text-green-800 border-green-200";
                      if (os.status === 'em_reparo') statusBadge = "bg-indigo-100 text-indigo-800 border-indigo-200";

                      return (
                        <div 
                          key={os.id}
                          className="p-3 border border-slate-100 bg-slate-50/50 rounded-lg space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => {
                                onSelectOrder(os.id);
                                onNavigateToTab('orders');
                              }}
                              className="font-bold text-indigo-600 hover:underline cursor-pointer text-xs"
                            >
                              {os.id}
                            </button>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-slate-800">{os.equipment}</p>
                            <p className="text-[10px] text-slate-500">{os.brand} • {os.model}</p>
                          </div>

                          {os.technicalReport && (
                            <p className="text-[10px] bg-white border border-slate-100 p-2 rounded text-slate-600 leading-relaxed italic">
                              "{os.technicalReport}"
                            </p>
                          )}

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100/50">
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${statusBadge}`}>
                              {os.status.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-slate-900">{formatBRL(os.totalCost)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add dynamic wallet balance simulation */}
                <div className="pt-4 border-t border-slate-100 bg-amber-50/30 p-3 rounded-lg border border-amber-100/50 text-xs space-y-2">
                  <p className="font-bold text-slate-700 flex items-center gap-1">
                    <Wallet size={12} className="text-amber-600" /> Simular Adição de Crédito (Carteira Própria)
                  </p>
                  <p className="text-[10px] text-slate-500">Adicione saldo pré-pago ou crédito de troca para o cliente abater nas ordens de serviço futuras.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateClientWallet(activeClient.id, 50)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      + R$ 50,00
                    </button>
                    <button
                      onClick={() => onUpdateClientWallet(activeClient.id, 100)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      + R$ 100,00
                    </button>
                    <button
                      onClick={() => onUpdateClientWallet(activeClient.id, 200)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      + R$ 200,00
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>

      {/* Add Client Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <UserPlus size={16} className="text-indigo-400" /> Cadastrar Novo Cliente
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Celular / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    placeholder="Apenas números (Ex: 11999998888)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">CPF / CNPJ:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 123.456.789-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">E-mail (Opcional):</label>
                <input
                  type="email"
                  placeholder="Ex: cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Saldo Inicial em Carteira (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Edit size={16} className="text-indigo-400" /> Editar Dados do Cliente
              </h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditClientSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Celular / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999998888"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">CPF / CNPJ:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 123.456.789-00"
                    value={editCpf}
                    onChange={(e) => setEditCpf(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">E-mail (Opcional):</label>
                <input
                  type="email"
                  placeholder="Ex: cliente@email.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
