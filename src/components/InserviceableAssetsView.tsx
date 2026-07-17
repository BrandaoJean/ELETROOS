import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Coins, 
  User, 
  Layers, 
  Filter,
  FileText,
  Building,
  Info
} from 'lucide-react';
import { InserviceableAsset, Client, FinancialAccountItem } from '../types';
import { formatBRL } from '../utils';

interface InserviceableAssetsViewProps {
  assets: InserviceableAsset[];
  setAssets: React.Dispatch<React.SetStateAction<InserviceableAsset[]>>;
  clients: Client[];
  onAddManualAccount: (account: Omit<FinancialAccountItem, 'id'>) => void;
}

export default function InserviceableAssetsView({
  assets,
  setAssets,
  clients,
  onAddManualAccount
}: InserviceableAssetsViewProps) {
  // Search & Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');

  // Form states for manual registration
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientPhone, setCustomClientPhone] = useState('');
  
  const [equipment, setEquipment] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [remunerated, setRemunerated] = useState(false);
  const [valuePaid, setValuePaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira'>('dinheiro');

  // Selected asset details modal state
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        asset.id.toLowerCase().includes(query) ||
        asset.clientName.toLowerCase().includes(query) ||
        asset.equipment.toLowerCase().includes(query) ||
        (asset.brand && asset.brand.toLowerCase().includes(query)) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'todos' || asset.status === statusFilter;
      const matchesOrigin = originFilter === 'todos' || asset.origin === originFilter;

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [assets, searchQuery, statusFilter, originFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = assets.length;
    const pendingDisposal = assets.filter(a => a.status === 'recebido').length;
    const discardedCount = assets.filter(a => a.status === 'descartado').length;
    const soldScrapCount = assets.filter(a => a.status === 'vendido_como_sucata').length;
    const totalScrapExpenses = assets.reduce((sum, a) => sum + (a.remunerated ? a.valuePaid : 0), 0);

    return {
      totalCount,
      pendingDisposal,
      discardedCount,
      soldScrapCount,
      totalScrapExpenses
    };
  }, [assets]);

  // Handle direct registration submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let clientName = customClientName;
    let clientPhone = customClientPhone;
    let clientId = undefined;

    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        clientName = client.name;
        clientPhone = client.phone;
        clientId = client.id;
      }
    }

    if (!clientName || !equipment) {
      alert('Por favor, preencha o nome do proprietário e o tipo de aparelho.');
      return;
    }

    const value = remunerated ? parseFloat(valuePaid) || 0 : 0;
    const newAssetId = `ATV-${1000 + assets.length + 1}`;
    
    const newAsset: InserviceableAsset = {
      id: newAssetId,
      clientId,
      clientName,
      clientPhone,
      equipment,
      brand,
      model,
      serialNumber,
      entryDate: new Date().toISOString().split('T')[0],
      origin: 'direto',
      remunerated,
      valuePaid: value,
      status: 'recebido',
      notes
    };

    setAssets(prev => [newAsset, ...prev]);

    // If remunerated, send the transaction to financial system
    if (remunerated && value > 0) {
      onAddManualAccount({
        type: 'pagar',
        description: `Compra de Sucata p/ Descarte - ${equipment} (${clientName})`,
        category: 'Compra de Ativos para Sucata',
        amount: value,
        dueDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'pago',
        paymentMethod: paymentMethod,
        clientOrSupplierName: clientName,
        originId: newAssetId
      });
    }

    // Reset Form
    setSelectedClientId('');
    setCustomClientName('');
    setCustomClientPhone('');
    setEquipment('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setNotes('');
    setRemunerated(false);
    setValuePaid('0');
    setPaymentMethod('dinheiro');
    setIsCreateOpen(false);

    alert(`Ativo inservível ${newAssetId} cadastrado com sucesso!${remunerated && value > 0 ? ' Despesa registrada no financeiro sob a categoria "Compra de Ativos para Sucata".' : ''}`);
  };

  // Change asset status (e.g. mark as fully discarded or sold)
  const handleUpdateStatus = (id: string, newStatus: 'recebido' | 'descartado' | 'vendido_como_sucata') => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        let updateNotes = a.notes || '';
        if (newStatus === 'descartado') {
          updateNotes += `\n[Descarte ecológico efetuado em ${new Date().toLocaleDateString('pt-BR')}]`;
        } else if (newStatus === 'vendido_como_sucata') {
          updateNotes += `\n[Vendido/Aproveitado como sucata em ${new Date().toLocaleDateString('pt-BR')}]`;
        }
        return {
          ...a,
          status: newStatus,
          notes: updateNotes.trim()
        };
      }
      return a;
    }));
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Tem certeza de que deseja remover este registro? Esta operação não pode ser desfeita.')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const activeAsset = assets.find(a => a.id === selectedAssetId);

  // Extract unique equipment models of a selected client to suggest
  const selectedClientEquipments = useMemo(() => {
    if (!selectedClientId) return [];
    // We can lookup past assets or look up from standard list.
    // For direct addition, let the user type, but we can list options.
    return [];
  }, [selectedClientId]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-rose-600 animate-pulse" size={24} />
            Módulo de Ativos Inservíveis & Sucata
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de aparelhos descartados por clientes ou adquiridos para reaproveitamento de componentes.
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={15} /> Registrar Ativo Direto
        </button>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total de Ativos</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.totalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Dispositivos recolhidos</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Aguardando Descarte</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.pendingDisposal}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Armazenados temporariamente</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Descartados / Sucateados</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.discardedCount + stats.soldScrapCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.discardedCount} descarte ecol. • {stats.soldScrapCount} reaproveitados</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Investimento em Sucata</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{formatBRL(stats.totalScrapExpenses)}</h3>
            <p className="text-[10px] text-rose-600 font-bold mt-0.5">Registrado como despesa</p>
          </div>
        </div>

      </div>

      {/* FILTER & DATA ROW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Search & Filter Header */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por ID, equipamento, marca, serial, proprietário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500">
              <Filter size={12} />
              <span className="font-bold">Filtros:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos Status</option>
              <option value="recebido">Aguardando Descarte</option>
              <option value="descartado">Descartado Ecológico</option>
              <option value="vendido_como_sucata">Reaproveitado / Sucateado</option>
            </select>

            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todas Origens</option>
              <option value="ordem_servico">Ordem de Serviço (OS)</option>
              <option value="direto">Coleta Direta / Sucata</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {filteredAssets.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <Info size={36} className="text-slate-300 mb-2 animate-bounce" />
            <p className="font-semibold text-slate-500 text-sm">Nenhum Ativo Registrado</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">Use os filtros ou registre um novo aparelho inservível diretamente para iniciar seu controle de sucata.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Cód ID</th>
                  <th className="p-4">Aparelho / Série</th>
                  <th className="p-4">Proprietário</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4">Data Entrada</th>
                  <th className="p-4">Custo Aquisição</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  let statusBadge = '';
                  if (asset.status === 'recebido') {
                    statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                  } else if (asset.status === 'descartado') {
                    statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                  } else {
                    statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  }

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600 text-[11px]">{asset.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{asset.equipment}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {asset.brand} {asset.model ? `• ${asset.model}` : ''} {asset.serialNumber ? `• S/N: ${asset.serialNumber}` : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{asset.clientName}</div>
                        {asset.clientPhone && <div className="text-[10px] text-slate-500">{asset.clientPhone}</div>}
                      </td>
                      <td className="p-4">
                        {asset.origin === 'ordem_servico' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                            OS: {asset.originId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            Coleta Direta
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(asset.entryDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        {asset.remunerated ? (
                          <div className="font-mono font-bold text-rose-600">-{formatBRL(asset.valuePaid)}</div>
                        ) : (
                          <div className="text-slate-400 italic font-semibold">Sem Custo</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {asset.status === 'recebido' ? 'Aguardando Descarte' : asset.status === 'descartado' ? 'Descartado' : 'Reaproveitado'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {asset.status === 'recebido' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(asset.id, 'descartado')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                                title="Confirmar descarte ecológico"
                              >
                                Descartar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(asset.id, 'vendido_como_sucata')}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[10px] transition-colors border border-emerald-100 cursor-pointer"
                                title="Reaproveitar peças / vender como sucata"
                              >
                                Reaproveitar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedAssetId(asset.id)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] transition-colors border border-indigo-100 cursor-pointer"
                            title="Ver detalhes"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Excluir Registro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CREATE DIRECT DISPOSAL ASSET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-indigo-400" /> Registrar Ativo Direto para Descarte
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Proprietário (Cliente Cadastrado):</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    if (e.target.value === '') {
                      setCustomClientName('');
                      setCustomClientPhone('');
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                >
                  <option value="">Cliente Avulso (Não cadastrado na base) ...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {!selectedClientId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Nome Completo do Proprietário:</label>
                    <input
                      type="text"
                      required={!selectedClientId}
                      placeholder="Ex: Carlos Eduardo de Souza"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Telefone do Proprietário:</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98888-7777"
                      value={customClientPhone}
                      onChange={(e) => setCustomClientPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Aparelho / Equipamento (Ex: Micro-ondas):</label>
                  <input
                    type="text"
                    required
                    placeholder="Tipo de equipamento"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Marca (Ex: Consul, Brastemp):</label>
                  <input
                    type="text"
                    placeholder="Marca do fabricante"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Modelo:</label>
                  <input
                    type="text"
                    placeholder="Ex: MC42L"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Número de Série:</label>
                  <input
                    type="text"
                    placeholder="Código identificador de série"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Parecer Técnico / Motivo do Descarte:</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Placa principal carbonizada, tela trincada sem reposição de mercado, inservível..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Remuneration Setup */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">Dispositivo Adquirido / Remunerado?</span>
                    <span className="text-[10px] text-slate-400">Marque se pagou algum valor ao cliente para ficar com a sucata</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={remunerated}
                    onChange={(e) => setRemunerated(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {remunerated && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Valor Pago (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required={remunerated}
                        placeholder="Ex: 50.00"
                        value={valuePaid}
                        onChange={(e) => setValuePaid(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Forma de Pagamento:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro em Espécie</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="carteira">Crédito em Conta do Cliente</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  Registrar Ativo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW ASSET DETAILS MODAL */}
      {activeAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Info size={16} className="text-indigo-400" /> Detalhes do Ativo Inservível
              </h3>
              <button 
                onClick={() => setSelectedAssetId(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">ID do Registro</span>
                  <p className="font-mono text-sm font-black text-indigo-600">{activeAsset.id}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Origem</span>
                  <p className="font-bold text-slate-700 text-xs">
                    {activeAsset.origin === 'ordem_servico' ? `Ordem de Serviço ${activeAsset.originId}` : 'Coleta Direta'}
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Equipamento</span>
                <p className="font-bold text-slate-800 text-sm">{activeAsset.equipment}</p>
                <p className="text-slate-500 mt-0.5">
                  Marca: <span className="font-semibold text-slate-700">{activeAsset.brand || 'Não especificada'}</span>
                  {activeAsset.model && <span className="mx-1">•</span>}
                  {activeAsset.model && <>Modelo: <span className="font-semibold text-slate-700">{activeAsset.model}</span></>}
                </p>
                {activeAsset.serialNumber && (
                  <p className="text-slate-500 mt-0.5">
                    Número de Série: <span className="font-mono font-semibold text-slate-700 bg-slate-50 px-1 py-0.5 rounded border border-slate-100">{activeAsset.serialNumber}</span>
                  </p>
                )}
              </div>

              <hr className="border-slate-100" />

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Proprietário / Doador</span>
                <p className="font-bold text-slate-800">{activeAsset.clientName}</p>
                {activeAsset.clientPhone && <p className="text-slate-500">{activeAsset.clientPhone}</p>}
              </div>

              <hr className="border-slate-100" />

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Aspectos de Aquisição & Financeiro</span>
                {activeAsset.remunerated ? (
                  <div className="mt-1 p-2.5 bg-rose-50 rounded-lg border border-rose-100 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-rose-800">Sucata Adquirida (Valor Pago)</p>
                      <p className="text-[10px] text-rose-600">Categoria: Compra de Ativos para Sucata</p>
                    </div>
                    <span className="font-mono font-bold text-rose-700 text-sm">{formatBRL(activeAsset.valuePaid)}</span>
                  </div>
                ) : (
                  <p className="text-slate-500 font-semibold italic mt-0.5">Recebido como doação / descarte voluntário sem custo.</p>
                )}
              </div>

              {activeAsset.notes && (
                <>
                  <hr className="border-slate-100" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Parecer Técnico / Notas do Processo</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mt-1 whitespace-pre-line">
                      {activeAsset.notes}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAssetId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
