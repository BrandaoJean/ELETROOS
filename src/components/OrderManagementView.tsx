import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  FileText, 
  Printer, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  Coins, 
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { ServiceOrder, PartItem, OSStatus, Client, Product, ServiceTemplate } from '../types';
import { formatBRL, getWhatsAppLink } from '../utils';
import BudgetPrintModal from './BudgetPrintModal';

interface OrderManagementViewProps {
  orders: ServiceOrder[];
  clients: Client[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
  onAddOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'payments' | 'isPaid'>) => void;
  onUpdateOrder: (id: string, updatedFields: Partial<ServiceOrder>) => void;
  onPayOrder: (id: string) => void; // Trigger payment modal
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  serviceTemplates?: ServiceTemplate[];
  onDiscardAsset?: (asset: {
    clientId?: string;
    clientName: string;
    clientPhone?: string;
    equipment: string;
    brand: string;
    model: string;
    serialNumber: string;
    notes: string;
    remunerated: boolean;
    valuePaid: number;
    paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira';
    originId?: string;
  }) => void;
  onAddClient?: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
}

export default function OrderManagementView({
  orders,
  clients,
  selectedOrderId,
  onSelectOrder,
  onAddOrder,
  onUpdateOrder,
  onPayOrder,
  products = [],
  setProducts,
  serviceTemplates = [],
  onDiscardAsset,
  onAddClient
}: OrderManagementViewProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Disposal form states for active OS
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [disposalNotes, setDisposalNotes] = useState('');
  const [disposalRemunerated, setDisposalRemunerated] = useState(false);
  const [disposalValue, setDisposalValue] = useState('0');
  const [disposalPaymentMethod, setDisposalPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira'>('dinheiro');

  // New OS form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);

  // Quick Client registration states
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientEmail, setQuickClientEmail] = useState('');
  const [quickClientCpf, setQuickClientCpf] = useState('');
  const [quickClientCep, setQuickClientCep] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');
  const [quickClientNumber, setQuickClientNumber] = useState('');
  const [quickClientComplement, setQuickClientComplement] = useState('');
  const [quickClientNeighborhood, setQuickClientNeighborhood] = useState('');
  const [quickClientCity, setQuickClientCity] = useState('');
  const [quickClientState, setQuickClientState] = useState('');
  const [isFetchingQuickCep, setIsFetchingQuickCep] = useState(false);

  const fetchQuickAddressByCep = async (zipCode: string) => {
    const cleanCep = zipCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsFetchingQuickCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data && !data.erro) {
        setQuickClientAddress(data.logradouro || '');
        setQuickClientNeighborhood(data.bairro || '');
        setQuickClientCity(data.localidade || '');
        setQuickClientState(data.uf || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingQuickCep(false);
    }
  };

  const handleOpenQuickAddClient = (initialName: string) => {
    setQuickClientName(initialName);
    setQuickClientPhone('');
    setQuickClientEmail('');
    setQuickClientCpf('');
    setQuickClientCep('');
    setQuickClientAddress('');
    setQuickClientNumber('');
    setQuickClientComplement('');
    setQuickClientNeighborhood('');
    setQuickClientCity('');
    setQuickClientState('');
    setIsQuickAddClientOpen(true);
  };

  const handleSaveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;

    if (onAddClient) {
      const createdClient = onAddClient({
        name: quickClientName,
        phone: quickClientPhone,
        email: quickClientEmail,
        cpf: quickClientCpf,
        walletBalance: 0,
        cep: quickClientCep,
        address: quickClientAddress,
        number: quickClientNumber,
        complement: quickClientComplement,
        neighborhood: quickClientNeighborhood,
        city: quickClientCity,
        state: quickClientState
      });

      if (createdClient && createdClient.id) {
        setNewClientId(createdClient.id);
        setClientSearchText(createdClient.name);
      }
    }
    setIsQuickAddClientOpen(false);
  };

  const filteredClientsForOS = useMemo(() => {
    if (!clientSearchText.trim()) return clients;
    const q = clientSearchText.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.toLowerCase().includes(q)) || 
      (c.cpf && c.cpf.toLowerCase().includes(q))
    );
  }, [clients, clientSearchText]);

  const [newEquipment, setNewEquipment] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newPhysicalCondition, setNewPhysicalCondition] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [newLaborCost, setNewLaborCost] = useState('0');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Diagnostics and parts editor states (for selected OS)
  const [tempReport, setTempReport] = useState('');
  const [tempLabor, setTempLabor] = useState('0');
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState('0');
  const [statusError, setStatusError] = useState('');

  // WhatsApp notification states
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgModalTitle, setMsgModalTitle] = useState('');
  const [msgModalBody, setMsgModalBody] = useState('');
  const [msgModalPhone, setMsgModalPhone] = useState('');

  // Active Selected OS
  const activeOS = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Set local state when active OS changes
  useMemo(() => {
    if (activeOS) {
      setTempReport(activeOS.technicalReport || '');
      setTempLabor(String(activeOS.laborCost));
      setStatusError('');
    }
  }, [activeOS]);

  const handlePrepareMessage = (type: 'orcamento' | 'reparo_iniciado' | 'pronto' | 'entregue' | 'cobranca' | 'abandono') => {
    if (!activeOS) return;
    
    setMsgModalPhone(activeOS.clientPhone);
    const clientName = activeOS.clientName;
    const equip = activeOS.equipment;
    const brand = activeOS.brand || '';
    const model = activeOS.model || '';
    const sn = activeOS.serialNumber || 'N/A';
    const osId = activeOS.id;
    const totalCostStr = formatBRL(activeOS.totalCost);
    const laborCostStr = formatBRL(activeOS.laborCost);
    const partsCostStr = formatBRL(activeOS.parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0));
    const technicalReport = activeOS.technicalReport || 'Diagnóstico em andamento';
    const updatedAtStr = activeOS.updatedAt ? new Date(activeOS.updatedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    let title = '';
    let body = '';

    if (type === 'orcamento') {
      title = 'Enviar Orçamento para Aprovação';
      body = `Olá, *${clientName}*! Informamos que o orçamento para o seu aparelho *${equip}* (${brand} ${model}) ficou pronto.\n\n*Laudo Técnico:* ${technicalReport}\n*Valor da Mão de Obra:* ${laborCostStr}\n*Peças:* ${partsCostStr}\n*Valor Total:* ${totalCostStr}\n\nPor favor, responda a esta mensagem aprovando ou recusando o orçamento. Obrigado!\n_Eletro OS_`;
    } else if (type === 'reparo_iniciado') {
      title = 'Avisar Início do Reparo';
      body = `Olá, *${clientName}*! Seu equipamento *${equip}* (${brand} ${model}) já foi aprovado e o processo de manutenção/reparo já foi iniciado por nossos técnicos. Avisaremos assim que estiver pronto para retirada.\n_Eletro OS_`;
    } else if (type === 'pronto') {
      title = 'Avisar Equipamento Pronto';
      body = `Olá, *${clientName}*! Temos ótimas notícias! O seu aparelho *${equip}* (${brand} ${model}) está pronto, testado e disponível para retirada na nossa assistência.\n\n*Valor Total a Pagar:* ${totalCostStr}\n\nAgradecemos a preferência!\n_Eletro OS_`;
    } else if (type === 'entregue') {
      title = 'Notificação de Saída / Recibo';
      body = `Olá, *${clientName}*! Confirmamos a retirada e entrega do seu equipamento *${equip}* (${brand} ${model}) em perfeitas condições. O pagamento correspondente foi devidamente liquidado. Obrigado pela confiança!\n_Eletro OS_`;
    } else if (type === 'cobranca') {
      title = 'Mensagem de Cobrança de OS';
      body = `Olá, *${clientName}*! Consta em nosso sistema uma pendência de pagamento referente à Ordem de Serviço *${osId}* para o equipamento *${equip}*. Solicitamos que entre em contato para regularização.\n_Eletro OS_`;
    } else if (type === 'abandono') {
      title = 'Notificação Formal de Abandono de Bem';
      body = `Olá, *${clientName}*!\n\n*NOTIFICAÇÃO FORMAL DE ABANDONO DE BEM*\n\nReferente à Ordem de Serviço *${osId}* do aparelho *${equip}* (${brand} ${model} S/N: *${sn}*), informamos que o equipamento encontra-se pronto ou com orçamento finalizado em nossa oficina desde *${updatedAtStr}*, totalizando mais de *90 dias* sem retirada ou retorno de sua parte.\n\nNos termos do *Artigo 1.275, inciso III do Código Civil Brasileiro* (Lei nº 10.406/2002), o não comparecimento ou falta de retirada caracteriza abandono de propriedade, autorizando esta assistência técnica a dar destinação legal ao bem (doação, descarte ou alienação para cobrir custos de armazenamento, peças e mão de obra despendidos).\n\nSolicitamos seu comparecimento urgente no prazo improrrogável de *10 dias corridos* a contar do recebimento desta notificação para retirada do equipamento mediante quitação do valor pendente de *${totalCostStr}*, sob pena de perda definitiva do bem.\n\nAtenciosamente,\n*Eletro OS*`;
    }

    setMsgModalTitle(title);
    setMsgModalBody(body);
    setIsMsgModalOpen(true);
  };

  // Unique list of past equipments of the selected client (for suggestion on new OS)
  const clientEquipments = useMemo(() => {
    if (!newClientId) return [];
    const uniqueEquips: { equipment: string; brand: string; model: string; serialNumber: string }[] = [];
    const seenKeys = new Set<string>();
    
    orders.forEach(o => {
      if (o.clientId === newClientId) {
        const key = `${o.equipment}-${o.brand}-${o.model}-${o.serialNumber}`.toLowerCase().trim();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueEquips.push({
            equipment: o.equipment,
            brand: o.brand || '',
            model: o.model || '',
            serialNumber: o.serialNumber || ''
          });
        }
      }
    });
    return uniqueEquips;
  }, [newClientId, orders]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.brand && o.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
      const matchesPayment = 
        paymentFilter === 'todos' || 
        (paymentFilter === 'pago' && o.isPaid) || 
        (paymentFilter === 'pendente' && !o.isPaid);

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Handler: Add Part
  const handleAddPart = () => {
    if (!activeOS || !partName || partQty <= 0) return;
    
    setStatusError('');
    // Check stock if product is from catalog
    const matchedProduct = products.find(p => p.name === partName);
    if (matchedProduct && setProducts) {
      if (matchedProduct.stock < partQty) {
        alert(`Atenção: Estoque insuficiente para "${partName}". Estoque atual: ${matchedProduct.stock} unidades.`);
      }
      setProducts(prev => prev.map(p => {
        if (p.id === matchedProduct.id) {
          return { ...p, stock: Math.max(0, p.stock - partQty) };
        }
        return p;
      }));
    }

    const newPart: PartItem = {
      id: 'p_' + Date.now(),
      name: partName,
      quantity: partQty,
      unitPrice: parseFloat(partPrice) || 0
    };

    const updatedParts = [...activeOS.parts, newPart];
    const totalParts = updatedParts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const updatedTotalCost = totalParts + activeOS.laborCost;

    // Automate status transition: if 'orcamento_aprovado', move to 'em_reparo'
    let newStatus = activeOS.status;
    let statusTransitionNote = '';
    if (activeOS.status === 'orcamento_aprovado') {
      newStatus = 'em_reparo';
      statusTransitionNote = `Peça "${partName}" adicionada ao reparo. Status alterado automaticamente para EM REPARO.`;
    }

    const newHistoryEvent = statusTransitionNote ? {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: statusTransitionNote
    } : null;

    onUpdateOrder(activeOS.id, {
      parts: updatedParts,
      totalCost: updatedTotalCost,
      status: newStatus,
      ...(newHistoryEvent ? { history: [...activeOS.history, newHistoryEvent] } : {}),
      updatedAt: new Date().toISOString()
    });

    setPartName('');
    setPartQty(1);
    setPartPrice('0');
  };

  // Handler: Remove Part
  const handleRemovePart = (partId: string) => {
    if (!activeOS) return;
    const removedPart = activeOS.parts.find(p => p.id === partId);
    
    // Restore stock if product is from catalog
    if (removedPart && setProducts) {
      const matchedProduct = products.find(p => p.name === removedPart.name);
      if (matchedProduct) {
        setProducts(prev => prev.map(p => {
          if (p.id === matchedProduct.id) {
            return { ...p, stock: p.stock + removedPart.quantity };
          }
          return p;
        }));
      }
    }

    const updatedParts = activeOS.parts.filter(p => p.id !== partId);
    const totalParts = updatedParts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const updatedTotalCost = totalParts + activeOS.laborCost;

    onUpdateOrder(activeOS.id, {
      parts: updatedParts,
      totalCost: updatedTotalCost
    });
  };

  // Handler: Confirm disposal and send to scrap assets
  const handleConfirmDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOS) return;

    const value = disposalRemunerated ? parseFloat(disposalValue) || 0 : 0;
    
    if (onDiscardAsset) {
      onDiscardAsset({
        clientId: activeOS.clientId,
        clientName: activeOS.clientName,
        clientPhone: activeOS.clientPhone,
        equipment: activeOS.equipment,
        brand: activeOS.brand,
        model: activeOS.model,
        serialNumber: activeOS.serialNumber,
        notes: disposalNotes || `Encaminhado para descarte ecológico a partir da OS ${activeOS.id}.`,
        remunerated: disposalRemunerated,
        valuePaid: value,
        paymentMethod: disposalPaymentMethod,
        originId: activeOS.id
      });
    }

    // Add event log and technical note to the order
    const updatedHistory = [
      ...activeOS.history,
      {
        timestamp: new Date().toISOString(),
        status: activeOS.status,
        note: `Aparelho enviado para o Módulo de Ativos Inservíveis para descarte.${disposalRemunerated ? ` Reembolso de ${formatBRL(value)} pago ao cliente.` : ''}`
      }
    ];

    onUpdateOrder(activeOS.id, {
      history: updatedHistory,
      technicalReport: `${activeOS.technicalReport || ''}\n[Descarte Solicitado] Equipamento inservível encaminhado para sucata.`.trim(),
      observations: `${activeOS.observations || ''}\n[Descarte] Equipamento enviado para descarte em ${new Date().toLocaleDateString('pt-BR')}.`.trim()
    });

    setIsDisposalModalOpen(false);
    alert(`Equipamento da OS ${activeOS.id} enviado para o Módulo de Ativos Inservíveis com sucesso!`);
  };

  // Handler: Update Diagnostic / Labor
  const handleSaveDiagnostic = () => {
    if (!activeOS) return;
    const labor = parseFloat(tempLabor) || 0;
    
    if (labor > 0) {
      setStatusError('');
    }

    const totalParts = activeOS.parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const updatedTotalCost = totalParts + labor;

    let newStatus = activeOS.status;
    let statusTransitionNote = '';

    // Automate status transition:
    if (activeOS.status === 'orcamento_aprovado') {
      newStatus = 'em_reparo';
      statusTransitionNote = 'Laudo técnico preenchido. Ordem de Serviço atualizada automaticamente para EM REPARO.';
    } else if (activeOS.status === 'em_reparo' && tempReport.trim().length > 8) {
      newStatus = 'pronto';
      statusTransitionNote = 'Serviço e laudo concluídos pelo técnico. Ordem de Serviço atualizada automaticamente para PRONTO PARA RETIRADA.';
    } else if (activeOS.status === 'aguardando_orcamento' && tempReport.trim().length > 5) {
      statusTransitionNote = 'Laudo de diagnóstico técnico preenchido. Orçamento completo aguardando aprovação do cliente.';
    }

    // Auto-advance to delivered if marked ready and already paid
    if (newStatus === 'pronto' && activeOS.isPaid) {
      newStatus = 'entregue';
      statusTransitionNote = 'Laudo técnico preenchido. Como a OS já está paga, foi atualizada automaticamente para ENTREGUE (FINALIZADO).';
    }

    const newHistoryEvent = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: statusTransitionNote || 'Diagnóstico técnico e laudo de mão de obra atualizados.'
    };

    onUpdateOrder(activeOS.id, {
      technicalReport: tempReport,
      laborCost: labor,
      totalCost: updatedTotalCost,
      status: newStatus,
      history: [...activeOS.history, newHistoryEvent],
      updatedAt: new Date().toISOString()
    });

    alert(statusTransitionNote || 'Diagnóstico técnico e mão de obra atualizados com sucesso!');
  };

  // Handler: Status change
  const handleStatusChange = (newStatus: OSStatus) => {
    if (!activeOS) return;
    
    setStatusError('');
    if (newStatus === 'orcamento_aprovado') {
      const partsCost = activeOS.parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
      const totalEstimatedCost = activeOS.laborCost + partsCost;
      if (totalEstimatedCost <= 0) {
        setStatusError('O orçamento não pode ser aprovado/finalizado com valor total zerado. Por favor, adicione o valor da mão de obra ou peças.');
        return;
      }
    }

    let finalStatus = newStatus;
    let statusNote = `Status da Ordem de Serviço atualizado para: ${newStatus.replace('_', ' ').toUpperCase()}`;

    // Auto-advance to delivered if marked ready and already paid
    if (newStatus === 'pronto' && activeOS.isPaid) {
      finalStatus = 'entregue';
      statusNote = `Serviço marcado como PRONTO e já está PAGO. Status atualizado automaticamente para ENTREGUE (FINALIZADO).`;
    }

    const newHistoryEvent = {
      timestamp: new Date().toISOString(),
      status: finalStatus,
      note: statusNote
    };

    const updatedHistory = [...activeOS.history, newHistoryEvent];

    onUpdateOrder(activeOS.id, {
      status: finalStatus,
      history: updatedHistory,
      updatedAt: new Date().toISOString()
    });
  };

  // Handler: Create new OS
  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId || !newEquipment || !newProblem) {
      alert('Por favor, preencha o Cliente, o Equipamento e o Problema Relatado.');
      return;
    }

    const selectedClient = clients.find(c => c.id === newClientId);
    if (!selectedClient) return;

    onAddOrder({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      equipment: newEquipment,
      brand: newBrand,
      model: newModel,
      serialNumber: newSerial,
      reportedProblem: newProblem,
      physicalCondition: newPhysicalCondition,
      observations: newObservations,
      technicalReport: '',
      parts: [],
      laborCost: parseFloat(newLaborCost) || 0,
      totalCost: parseFloat(newLaborCost) || 0,
      status: 'aguardando_orcamento',
      dueDate: dueDate
    });

    // Reset fields & close
    setIsCreateOpen(false);
    setNewClientId('');
    setNewEquipment('');
    setNewBrand('');
    setNewModel('');
    setNewSerial('');
    setNewProblem('');
    setNewPhysicalCondition('');
    setNewObservations('');
    setNewLaborCost('0');
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por OS, cliente, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="todos">Status: Todos</option>
            <option value="aguardando_orcamento">Aguardando Orçamento</option>
            <option value="orcamento_aprovado">Orçamento Aprovado</option>
            <option value="orcamento_rejeitado">Orçamento Rejeitado</option>
            <option value="em_reparo">Em Reparo</option>
            <option value="pronto">Pronto para Retirada</option>
            <option value="entregue">Finalizado / Entregue</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="todos">Pagamento: Todos</option>
            <option value="pago">Pago / Quitado</option>
            <option value="pendente">Pendente / Aberto</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={15} /> Nova Ordem de Serviço
        </button>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: OS List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider px-1">Ordens de Serviço ({filteredOrders.length})</h3>
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-500 border border-slate-200 rounded-xl">
              Nenhuma OS encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredOrders.map((os) => {
              const isSelected = os.id === selectedOrderId;
              let statusBadge = "bg-amber-100 text-amber-800";
              if (os.status === 'pronto') statusBadge = "bg-emerald-100 text-emerald-800";
              if (os.status === 'entregue') statusBadge = "bg-blue-100 text-blue-800";
              if (os.status === 'em_reparo') statusBadge = "bg-indigo-100 text-indigo-800";
              if (os.status === 'orcamento_rejeitado') statusBadge = "bg-rose-100 text-rose-800";

              return (
                <div
                  key={os.id}
                  onClick={() => onSelectOrder(os.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10' 
                      : 'bg-white hover:border-slate-300 border-slate-200 text-slate-800'
                  }`}
                  id={`item-${os.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge}`}>
                        {os.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {os.id}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold truncate">{os.equipment} {os.brand} {os.model}</p>
                    <p className={isSelected ? "text-slate-300" : "text-slate-500"}>Cliente: <strong className="font-medium text-slate-900 dark:text-inherit">{os.clientName}</strong></p>
                    <p className="text-[10px] opacity-75">Entrada: {new Date(os.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>

                  <hr className={`my-2.5 ${isSelected ? 'border-slate-800' : 'border-slate-100'}`} />

                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      os.isPaid 
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' 
                        : 'bg-amber-500/15 text-amber-600 border border-amber-500/20'
                    }`}>
                      {os.isPaid ? 'Pago' : 'Pendente'}
                    </span>
                    <strong className="text-sm font-extrabold">{formatBRL(os.totalCost)}</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column: OS Detail & Operations (7 cols) */}
        <div className="lg:col-span-7">
          {!activeOS ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-16 text-center flex flex-col items-center justify-center text-slate-400 h-full">
              <ClipboardList size={40} className="mb-3 text-slate-300 animate-pulse" />
              <p className="font-semibold text-slate-500">Nenhuma Ordem de Serviço Selecionada</p>
              <p className="text-xs max-w-xs mt-1">Selecione uma ordem de serviço na lista à esquerda para detalhar orçamentos, lançar peças, emitir recibos ou liquidar o pagamento.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="detalhes-os-selecionada">
              
              {/* Header Details */}
              <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{activeOS.id}</h2>
                    <span className="text-slate-400">|</span>
                    <span className="text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                      Ficha de Diagnóstico
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{activeOS.equipment} • {activeOS.brand} • {activeOS.model}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={activeOS.status}
                    onChange={(e) => handleStatusChange(e.target.value as OSStatus)}
                    className="bg-slate-800 text-white text-xs rounded border border-slate-700 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="aguardando_orcamento">Aguardando Orçamento</option>
                    <option value="orcamento_aprovado">Orçamento Aprovado</option>
                    <option value="orcamento_rejeitado">Orçamento Rejeitado</option>
                    <option value="em_reparo">Em Reparo</option>
                    <option value="pronto">Pronto para Retirada</option>
                    <option value="entregue">Finalizado / Entregue</option>
                  </select>
                </div>
              </div>

              {statusError && (
                <div className="bg-rose-50 border-b border-rose-150 px-5 py-3 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-pulse" id="status-error-msg">
                  <span>⚠️</span>
                  <span>{statusError}</span>
                </div>
              )}

              {/* Client Info Banner */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{activeOS.clientName}</p>
                  <p className="text-slate-500">{activeOS.clientPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Série / Identificação</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeOS.serialNumber || 'N/A'}</p>
                  <p className="text-slate-500">Previsão: {activeOS.dueDate ? new Date(activeOS.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</p>
                </div>
              </div>

              {/* Technical problem reported */}
              <div className="p-5 border-b border-slate-100 text-xs space-y-1">
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <XCircle size={12} className="text-slate-400" /> Problema Relatado (Cliente)
                </h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic text-xs">
                  "{activeOS.reportedProblem}"
                </p>
              </div>

              {/* Physical Condition & General Observations (Intake) */}
              {(activeOS.physicalCondition || activeOS.observations) && (
                <div className="p-5 border-b border-slate-100 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/30">
                  {activeOS.physicalCondition ? (
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider flex items-center gap-1">
                        🔍 Estado Físico / Danos / Arranhões
                      </h4>
                      <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-250 leading-relaxed">
                        {activeOS.physicalCondition}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider flex items-center gap-1">
                        🔍 Estado Físico / Danos / Arranhões
                      </h4>
                      <p className="text-slate-400 italic bg-white p-2.5 rounded-lg border border-slate-250 leading-relaxed">
                        Nenhum dano ou risco físico relatado.
                      </p>
                    </div>
                  )}
                  {activeOS.observations && (
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider flex items-center gap-1">
                        📝 Observações Gerais da Entrada
                      </h4>
                      <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-250 leading-relaxed">
                        {activeOS.observations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Diagnostic and Labor input (Technician) */}
              <div className="p-5 border-b border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Wrench size={12} className="text-slate-400" /> Parecer Técnico & Mão de Obra
                </h4>

                {serviceTemplates && serviceTemplates.length > 0 && (
                  <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60 text-xs">
                    <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1">Carregar Modelo de Serviço Técnico:</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const s = serviceTemplates.find(template => template.id === val);
                          if (s) {
                            setTempLabor(String(s.standardPrice));
                            // Append or replace description
                            const separator = tempReport ? '\n' : '';
                            setTempReport(prev => `${prev}${separator}${s.name}: ${s.description}`);
                          }
                        }
                      }}
                      className="w-full text-xs border border-indigo-200 rounded p-1 bg-white font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="">-- Selecionar modelo de serviço... --</option>
                      {serviceTemplates.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} - Mão de Obra: {formatBRL(s.standardPrice)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500">Parecer Técnico / Reparos Executados:</label>
                  <textarea
                    rows={2}
                    value={tempReport}
                    onChange={(e) => setTempReport(e.target.value)}
                    placeholder="Descreva o defeito diagnosticado e a solução técnica..."
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">Valor da Mão de Obra (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempLabor}
                      onChange={(e) => setTempLabor(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSaveDiagnostic}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={13} /> Salvar Laudo
                    </button>
                  </div>
                </div>
              </div>

              {/* Parts and budget table builder */}
              <div className="p-5 border-b border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Coins size={12} className="text-slate-400" /> Peças & Materiais Aplicados
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Soma de Peças + Mão de Obra</span>
                </div>

                {/* Part addition form */}
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {products && products.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selecionar do Estoque:</label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const p = products.find(prod => prod.id === val);
                            if (p) {
                              setPartName(p.name);
                              setPartPrice(String(p.sellingPrice));
                            }
                          } else {
                            setPartName('');
                            setPartPrice('0');
                          }
                        }}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="">-- Inserir peça avulsa manualmente --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.name} (SKU: {p.sku}) - {formatBRL(p.sellingPrice)} | Estoque: {p.stock} un {p.stock <= 0 ? '(ESGOTADO)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Nome da peça"
                        value={partName}
                        onChange={(e) => setPartName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={partQty}
                        onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Preço Unit (R$)"
                        step="0.01"
                        value={partPrice}
                        onChange={(e) => setPartPrice(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={12} /> Adicionar Peça
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parts list */}
                {activeOS.parts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">Nenhuma peça adicionada a este orçamento ainda.</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="pb-2">Peça / Insumo</th>
                          <th className="pb-2 text-center">Qtd</th>
                          <th className="pb-2 text-right">Unitário</th>
                          <th className="pb-2 text-right">Subtotal</th>
                          <th className="pb-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeOS.parts.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-medium text-slate-800">{p.name}</td>
                            <td className="py-2.5 text-center text-slate-600">{p.quantity}</td>
                            <td className="py-2.5 text-right text-slate-600">{formatBRL(p.unitPrice)}</td>
                            <td className="py-2.5 text-right font-semibold text-slate-800">{formatBRL(p.quantity * p.unitPrice)}</td>
                            <td className="py-2.5 text-center">
                              <button
                                onClick={() => handleRemovePart(p.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total summary and Quick printable trigger */}
              <div className="p-5 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-slate-500 font-semibold">Total Orçado (Mão de Obra + Peças)</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{formatBRL(activeOS.totalCost)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer size={13} /> Imprimir Orçamento
                  </button>

                  <button
                    onClick={() => {
                      setDisposalNotes('');
                      setDisposalRemunerated(false);
                      setDisposalValue('0');
                      setDisposalPaymentMethod('dinheiro');
                      setIsDisposalModalOpen(true);
                    }}
                    className="px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} /> Descartar Aparelho
                  </button>

                  {activeOS.isPaid ? (
                    <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={14} /> Pago e Quitado
                    </span>
                  ) : (
                    <button
                      onClick={() => onPayOrder(activeOS.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <Coins size={14} /> Receber e Liquidar
                    </button>
                  )}
                </div>
              </div>

              {/* Status Event Timeline History */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/20">
                <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-3">Histórico de Reparo e Eventos</h5>
                <div className="space-y-3">
                  {activeOS.history.map((ev, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">
                        {new Date(ev.timestamp).toLocaleDateString('pt-BR')} {new Date(ev.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="text-slate-400 shrink-0">•</span>
                      <p>
                        <strong className="text-slate-800 text-[11px] font-semibold uppercase">{ev.status.replace('_', ' ')}: </strong>
                        {ev.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Communication Panel */}
              <div className="p-5 border-t border-slate-100 bg-white space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Disparos e Alertas de WhatsApp</h5>
                    <p className="text-[9px] text-slate-400">Notifique seu cliente sobre cada etapa do reparo</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePrepareMessage('orcamento')}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all"
                  >
                    <span className="text-[14px]">📝</span>
                    <span>Enviar Orçamento</span>
                  </button>

                  <button
                    onClick={() => handlePrepareMessage('reparo_iniciado')}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all"
                  >
                    <span className="text-[14px]">⚡</span>
                    <span>Avisar Início</span>
                  </button>

                  <button
                    onClick={() => handlePrepareMessage('pronto')}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all"
                  >
                    <span className="text-[14px]">🎁</span>
                    <span>Avisar Pronto</span>
                  </button>

                  <button
                    onClick={() => handlePrepareMessage('entregue')}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all"
                  >
                    <span className="text-[14px]">✅</span>
                    <span>Avisar Entrega</span>
                  </button>

                  <button
                    onClick={() => handlePrepareMessage('cobranca')}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 col-span-2 cursor-pointer text-center transition-all"
                  >
                    <span className="text-[14px]">💵</span>
                    <span>Lembrete de Cobrança / Pendência</span>
                  </button>
                </div>

                {/* Abandono de Bem Legal Notice */}
                {(() => {
                  const lastUpdate = activeOS.updatedAt || activeOS.createdAt;
                  const elapsedDays = Math.floor((new Date().getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
                  const isAbandoned = elapsedDays >= 90;
                  const remainingDays = 90 - elapsedDays;

                  return (
                    <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="pr-1">
                          <p className="text-[9px] font-bold text-amber-800 uppercase flex items-center gap-1">
                            ⚠️ Notificação de Abandono de Bem
                          </p>
                          <p className="text-[8px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            <strong>Base Legal:</strong> Art. 1.275, III do Código Civil Brasileiro (perda de propriedade por abandono). Liberado apenas após o prazo de 90 dias corridos de abandono do equipamento sem retirada.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-100/80 text-amber-800 rounded shrink-0">
                          {elapsedDays} dias
                        </span>
                      </div>

                      {isAbandoned ? (
                        <button
                          onClick={() => handlePrepareMessage('abandono')}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          📢 Disparar Aviso de Abandono (90+ Dias)
                        </button>
                      ) : (
                        <div className="space-y-1">
                          <button
                            disabled
                            className="w-full py-2 px-3 bg-slate-200 text-slate-400 font-bold text-[10px] rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            title={`Faltam ${remainingDays} dias para liberar esta notificação legal.`}
                          >
                            🔒 Bloqueado (Faltam {remainingDays} dias)
                          </button>
                          <p className="text-center text-[8px] text-slate-400 font-medium">
                            O botão será ativado após completar o prazo legal de 90 dias sem interação.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Create OS Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-400" /> Cadastrar Nova Ordem de Serviço
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Selecionar Cliente Cadastrado:</label>
                
                {newClientId ? (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Cliente Selecionado</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {clients.find(c => c.id === newClientId)?.name || 'Cliente'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {clients.find(c => c.id === newClientId)?.phone || ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewClientId('');
                        setClientSearchText('');
                      }}
                      className="px-2 py-1 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 font-bold rounded transition-colors text-[10px] cursor-pointer"
                    >
                      Alterar Cliente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Digite o nome, CPF ou telefone para buscar..."
                        value={clientSearchText}
                        onChange={(e) => setClientSearchText(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                      />
                      {clientSearchText && (
                        <button
                          type="button"
                          onClick={() => setClientSearchText('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-sm">
                      {filteredClientsForOS.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-slate-500 font-medium">Nenhum cliente cadastrado com esse nome.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAddClient(clientSearchText)}
                            className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus size={11} /> Cadastrar "{clientSearchText}"
                          </button>
                        </div>
                      ) : (
                        filteredClientsForOS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setNewClientId(c.id);
                              setClientSearchText(c.name);
                              setNewEquipment('');
                              setNewBrand('');
                              setNewModel('');
                              setNewSerial('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs flex justify-between items-center transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{c.name}</span>
                              {c.cpf && <span className="text-slate-400 ml-2 font-mono text-[10px]">CPF: {c.cpf}</span>}
                            </div>
                            <span className="text-slate-500 font-medium">{c.phone}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {newClientId && clientEquipments.length > 0 && (
                <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60">
                  <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1">Aparelhos anteriores deste cliente:</label>
                  <select
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && clientEquipments[idx]) {
                        const eq = clientEquipments[idx];
                        setNewEquipment(eq.equipment);
                        setNewBrand(eq.brand);
                        setNewModel(eq.model);
                        setNewSerial(eq.serialNumber);
                      }
                    }}
                    className="w-full text-xs border border-indigo-200 rounded p-1.5 bg-white font-medium text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="">-- Escolha um aparelho existente ou preencha abaixo --</option>
                    {clientEquipments.map((eq, idx) => (
                      <option key={idx} value={idx}>
                        {eq.equipment} {eq.brand ? `• ${eq.brand}` : ''} {eq.model ? `• ${eq.model}` : ''} {eq.serialNumber ? `(S/N: ${eq.serialNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Equipamento (Ex: Smart TV):</label>
                  <input
                    type="text"
                    required
                    placeholder="Tipo de equipamento"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Marca (Ex: LG, Philco):</label>
                  <input
                    type="text"
                    placeholder="Marca do equipamento"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Modelo:</label>
                  <input
                    type="text"
                    placeholder="Modelo específico"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Número de Série:</label>
                  <input
                    type="text"
                    placeholder="Código de série"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Problema Relatado:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Relato detalhado dado pelo cliente sobre o defeito..."
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Estado Físico / Danos / Arranhões:</label>
                  <input
                    type="text"
                    placeholder="Ex: Riscos na tampa, tela intacta, amassados..."
                    value={newPhysicalCondition}
                    onChange={(e) => setNewPhysicalCondition(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Observações da Entrada (Acessórios, etc):</label>
                  <input
                    type="text"
                    placeholder="Ex: Deixou com cabo HDMI, sem fonte..."
                    value={newObservations}
                    onChange={(e) => setNewObservations(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Prazo de Entrega Estimado:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Mão de Obra Inicial (Opcional - R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLaborCost}
                    onChange={(e) => setNewLaborCost(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-[10px] text-slate-500 border border-slate-100">
                A nova Ordem de Serviço entrará automaticamente com status <strong>Aguardando Orçamento</strong>, registrando o histórico de auditoria.
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
                  Salvar OS
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {isPrintModalOpen && activeOS && (
        <BudgetPrintModal
          order={activeOS}
          client={clients.find(c => c.id === activeOS.clientId) || null}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isDisposalModalOpen && activeOS && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-400" /> Confirmar Encaminhamento para Descarte / Sucata
              </h3>
              <button 
                onClick={() => setIsDisposalModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDisposal} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-700">Aparelho a ser descartado:</p>
                <p className="mt-0.5 text-slate-600 font-medium">
                  {activeOS.equipment} • {activeOS.brand} {activeOS.model ? `(${activeOS.model})` : ''}
                </p>
                {activeOS.serialNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">S/N: {activeOS.serialNumber}</p>}
                <p className="text-[10px] text-indigo-600 font-bold mt-1">Proprietário: {activeOS.clientName}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observações do descarte / Parecer Técnico:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Placa principal oxidada, sem conserto. Cliente optou por doar para sucata e descartar."
                  value={disposalNotes}
                  onChange={(e) => setDisposalNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">Comprar Sucata / Remunerar Cliente?</span>
                    <span className="text-[10px] text-slate-400">Marque se você pagará algum valor ao cliente por esta sucata</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={disposalRemunerated}
                    onChange={(e) => setDisposalRemunerated(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {disposalRemunerated && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Valor do Reembolso (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required={disposalRemunerated}
                        placeholder="Ex: 50.00"
                        value={disposalValue}
                        onChange={(e) => setDisposalValue(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Meio de Pagamento:</label>
                      <select
                        value={disposalPaymentMethod}
                        onChange={(e) => setDisposalPaymentMethod(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro em Espécie</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="carteira">Crédito para Cliente</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisposalModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  Encaminhar para Descarte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Client Modal (on top of Create OS Modal) */}
      {isQuickAddClientOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Plus size={16} /> Cadastrar Novo Cliente
              </h3>
              <button 
                onClick={() => setIsQuickAddClientOpen(false)}
                className="text-white/80 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickClient} className="p-5 space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nome Completo *:</label>
                <input
                  type="text"
                  required
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Telefone *:</label>
                  <input
                    type="text"
                    required
                    value={quickClientPhone}
                    onChange={(e) => setQuickClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">CPF (opcional):</label>
                  <input
                    type="text"
                    value={quickClientCpf}
                    onChange={(e) => setQuickClientCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email (opcional):</label>
                <input
                  type="email"
                  value={quickClientEmail}
                  onChange={(e) => setQuickClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                />
              </div>

              {/* Address Section */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Endereço (Opcional)</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-600 mb-1">CEP:</label>
                    <input
                      type="text"
                      value={quickClientCep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickClientCep(val);
                        if (val.replace(/\D/g, '').length === 8) {
                          fetchQuickAddressByCep(val);
                        }
                      }}
                      onBlur={() => fetchQuickAddressByCep(quickClientCep)}
                      placeholder="00000-000"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-1">Logradouro:</label>
                    <input
                      type="text"
                      value={quickClientAddress}
                      onChange={(e) => setQuickClientAddress(e.target.value)}
                      placeholder="Rua, Av, etc."
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Número:</label>
                    <input
                      type="text"
                      value={quickClientNumber}
                      onChange={(e) => setQuickClientNumber(e.target.value)}
                      placeholder="Nº"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-1">Complemento:</label>
                    <input
                      type="text"
                      value={quickClientComplement}
                      onChange={(e) => setQuickClientComplement(e.target.value)}
                      placeholder="Apto, Sala, etc."
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-600 mb-1">Bairro:</label>
                    <input
                      type="text"
                      value={quickClientNeighborhood}
                      onChange={(e) => setQuickClientNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-600 mb-1">Cidade:</label>
                    <input
                      type="text"
                      value={quickClientCity}
                      onChange={(e) => setQuickClientCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-600 mb-1">Estado (UF):</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={quickClientState}
                      onChange={(e) => setQuickClientState(e.target.value)}
                      placeholder="UF"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickAddClientOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Editor Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <MessageSquare size={16} className="text-emerald-400" />
                <span>{msgModalTitle}</span>
              </h3>
              <button 
                onClick={() => setIsMsgModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">Destinatário (WhatsApp):</label>
                <input
                  type="text"
                  value={msgModalPhone}
                  onChange={(e) => setMsgModalPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-semibold"
                  placeholder="Ex: 11999999999"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">Mensagem (Editável):</label>
                <textarea
                  rows={10}
                  value={msgModalBody}
                  onChange={(e) => setMsgModalBody(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 font-sans text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white leading-relaxed"
                />
                <p className="text-[9px] text-slate-400 mt-1">
                  Você pode usar formatações do WhatsApp como *negrito*, _itálico_ ou ~tachado~.
                </p>
              </div>

              {msgModalTitle.includes("Abandono") && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-[10px] font-bold text-red-800 uppercase flex items-center gap-1">
                    ⚖️ Amparo Jurídico & Termos Importantes
                  </p>
                  <p className="text-[8px] text-slate-600 font-medium leading-relaxed mt-1">
                    Esta mensagem possui validade jurídica de notificação extrajudicial quando entregue e lida pelo destinatário. O prazo mínimo legal de guarda/aviso sem cobrança ou destino é de 90 dias corridos após o orçamento pronto ou finalização. A base para descarte ou alienação do bem é baseada no <strong>Artigo 1.275, inciso III, do Código Civil Brasileiro</strong>.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMsgModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = getWhatsAppLink(msgModalPhone, msgModalBody);
                    window.open(link, '_blank');
                    setIsMsgModalOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <MessageSquare size={14} /> Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
