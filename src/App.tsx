import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  FileText, 
  Building2, 
  Search, 
  Bell, 
  Moon, 
  Sun,
  Laptop,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';

// Import Types
import { ServiceOrder, Client, BankTransaction, PushNotification, PaymentItem, OSStatus, Supplier, Product, ServiceTemplate, ProductPurchase } from './types';

// Import Utilities & Mock Data
import { 
  mockClients, 
  mockServiceOrders, 
  mockBankTransactions, 
  mockNotifications,
  mockSuppliers,
  mockProducts,
  mockServiceTemplates,
  mockPurchases,
  formatBRL 
} from './utils';

// Import Modular Components
import CalendarHeader from './components/CalendarHeader';
import DashboardView from './components/DashboardView';
import OrderManagementView from './components/OrderManagementView';
import PaymentModal from './components/PaymentModal';
import ClientDirectoryView from './components/ClientDirectoryView';
import MeiReportView from './components/MeiReportView';
import BankReconciliationView from './components/BankReconciliationView';
import ClientTracker from './components/ClientTracker';
import PurchasesAndStockView from './components/PurchasesAndStockView';
import ServicesCatalogView from './components/ServicesCatalogView';
import FinancialModuleView from './components/FinancialModuleView';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Entity States (With LocalStorage Hydration)
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);

  // Selected sub-states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activePaymentOSId, setActivePaymentOSId] = useState<string | null>(null);

  // Dynamic calculations for High Density design
  const currentMonthRevenue = useMemo(() => {
    return orders.reduce((sum, o) => {
      if (o.isPaid) {
        const payDate = o.paymentDate || o.createdAt;
        const d = new Date(payDate);
        if (d.getFullYear() === 2026 && d.getMonth() === 6) {
          return sum + o.totalCost;
        }
      }
      return sum;
    }, 0);
  }, [orders]);

  const agendaOrders = useMemo(() => {
    const activeStatuses: OSStatus[] = ['aguardando_orcamento', 'orcamento_aprovado', 'em_reparo', 'pronto'];
    return orders
      .filter(o => activeStatuses.includes(o.status))
      .slice(0, 4);
  }, [orders]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Load state from local storage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('eletroos_orders');
    const savedClients = localStorage.getItem('eletroos_clients');
    const savedTx = localStorage.getItem('eletroos_transactions');
    const savedNotif = localStorage.getItem('eletroos_notifications');
    const savedSuppliers = localStorage.getItem('eletroos_suppliers');
    const savedProducts = localStorage.getItem('eletroos_products');
    const savedServices = localStorage.getItem('eletroos_services');
    const savedPurchases = localStorage.getItem('eletroos_purchases');

    if (savedOrders) setOrders(JSON.parse(savedOrders));
    else setOrders(mockServiceOrders);

    if (savedClients) setClients(JSON.parse(savedClients));
    else setClients(mockClients);

    if (savedTx) setBankTransactions(JSON.parse(savedTx));
    else setBankTransactions(mockBankTransactions);

    if (savedNotif) setNotifications(JSON.parse(savedNotif));
    else setNotifications(mockNotifications);

    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    else setSuppliers(mockSuppliers);

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else setProducts(mockProducts);

    if (savedServices) setServiceTemplates(JSON.parse(savedServices));
    else setServiceTemplates(mockServiceTemplates);

    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    else setPurchases(mockPurchases);
  }, []);

  // Save to local storage whenever states change
  useEffect(() => {
    if (orders.length > 0) localStorage.setItem('eletroos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (clients.length > 0) localStorage.setItem('eletroos_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    if (bankTransactions.length > 0) localStorage.setItem('eletroos_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    if (notifications.length > 0) localStorage.setItem('eletroos_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (suppliers.length > 0) localStorage.setItem('eletroos_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    if (products.length > 0) localStorage.setItem('eletroos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (serviceTemplates.length > 0) localStorage.setItem('eletroos_services', JSON.stringify(serviceTemplates));
  }, [serviceTemplates]);

  useEffect(() => {
    if (purchases.length > 0) localStorage.setItem('eletroos_purchases', JSON.stringify(purchases));
  }, [purchases]);

  // Handler: Select OS globally (e.g. from calendar or dashboard clicking)
  const handleSelectOrder = (id: string | null) => {
    setSelectedOrderId(id);
    setActiveTab('orders');
    // Scroll to active OS details
    setTimeout(() => {
      const el = document.getElementById('detalhes-os-selecionada');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handler: Add client
  const handleAddClient = (newClientFields: Omit<Client, 'id' | 'createdAt'>) => {
    const newId = `C-00${clients.length + 1}`;
    const newClient: Client = {
      ...newClientFields,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    alert(`Cliente ${newClient.name} cadastrado com sucesso!`);
  };

  // Handler: Update client details
  const handleUpdateClient = (id: string, updatedFields: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    
    // Propagate changes to orders
    if (updatedFields.name || updatedFields.phone) {
      setOrders(prev => prev.map(o => {
        if (o.clientId === id) {
          return {
            ...o,
            clientName: updatedFields.name || o.clientName,
            clientPhone: updatedFields.phone || o.clientPhone
          };
        }
        return o;
      }));
    }
    alert('Cadastro do cliente atualizado com sucesso!');
  };

  // Handler: Add Order
  const handleAddOrder = (newOrderFields: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'payments' | 'isPaid'>) => {
    const newId = `OS-${1000 + orders.length + 1}`;
    const initialHistory = [
      {
        timestamp: new Date().toISOString(),
        status: 'aguardando_orcamento' as OSStatus,
        note: `Ordem de Serviço criada com prazo em ${new Date(newOrderFields.dueDate || '').toLocaleDateString('pt-BR')}.`
      }
    ];

    const newOrder: ServiceOrder = {
      ...newOrderFields,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: initialHistory,
      payments: [],
      isPaid: false
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedOrderId(newId);
    
    // Auto-generate a push notification for this client intake
    const newNotification: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Aparelho Recebido na Oficina',
      body: `Nova OS ${newId} gerada para ${newOrder.clientName}. Notificação push enviada.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    alert(`Ordem de serviço ${newId} cadastrada com sucesso!`);
  };

  // Handler: Update Order details/diagnostics/parts
  const handleUpdateOrder = (id: string, updatedFields: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatedFields } : o));
  };

  // Handler: Multi-split Payment settlement confirmation
  const handleConfirmPayment = (orderId: string, payments: PaymentItem[], updatedWalletBalance?: number) => {
    // 1. Mark order as paid and transition status
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const historyNote = `Conta liquidada na oficina. Formas de pagamento: ${payments.map(p => p.method.toUpperCase()).join(', ')}.`;
        const newHistoryEvent = {
          timestamp: new Date().toISOString(),
          status: o.status === 'pronto' ? 'entregue' as OSStatus : o.status,
          note: historyNote
        };
        return {
          ...o,
          isPaid: true,
          status: o.status === 'pronto' ? 'entregue' : o.status,
          payments: payments,
          paymentDate: new Date().toISOString(),
          history: [...o.history, newHistoryEvent],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // 2. If client wallet balance was altered, update it
    const activeOS = orders.find(o => o.id === orderId);
    if (activeOS && updatedWalletBalance !== undefined) {
      setClients(prev => prev.map(c => c.id === activeOS.clientId ? { ...c, walletBalance: updatedWalletBalance } : c));
    }

    // 3. Trigger a success push notification
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Pagamento Confirmado',
      body: `A OS ${orderId} foi liquidada com sucesso. Recibo enviado por WhatsApp/Impressão.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Handler: Update Client Wallet balance directly (ledger addition)
  const handleUpdateClientWallet = (id: string, addition: number) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, walletBalance: c.walletBalance + addition } : c));
    alert(`Crédito de ${formatBRL(addition)} adicionado à carteira própria do cliente!`);
  };

  // Handler: Single-Click Bank Reconciliation match
  const handleReconcile = (transactionId: string, orderId: string, method: string, amount: number) => {
    // 1. Mark bank transaction as reconciled
    setBankTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, status: 'conciliado', matchedOsId: orderId } : tx));

    // 2. Clear outstanding payment on the order
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const historyNote = `CONCILIAÇÃO BANCÁRIA AUTOMÁTICA: Pagamento de ${formatBRL(amount)} baixado via API Open Finance.`;
        const newEvent = {
          timestamp: new Date().toISOString(),
          status: 'pronto' as OSStatus, // Advance status to ready automatically on payment
          note: historyNote
        };
        return {
          ...o,
          isPaid: true,
          status: 'pronto',
          paymentDate: new Date().toISOString(),
          payments: [{ method: method === 'pix' ? 'pix' : 'cartao_credito', amount, timestamp: new Date().toISOString() }],
          history: [...o.history, newEvent],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // 3. Create push notifications
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Conciliação Realizada',
      body: `Pagamento recebido na API bancária conciliado com sucesso para a OS ${orderId}.`,
      type: 'reconciliation',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert(`Conciliação finalizada! Ordem de serviço ${orderId} atualizada para PAGO.`);
  };

  // Handler: Simulated webhook/Open Finance transaction reload
  const handleRefreshTransactions = () => {
    // Mock new transaction arriving
    const newTx: BankTransaction = {
      id: `TX-00${bankTransactions.length + 1}`,
      timestamp: new Date().toISOString(),
      description: 'PIX Recebido - ANA PAULA LIMA',
      amount: 270.00,
      method: 'pix',
      status: 'pendente'
    };
    setBankTransactions(prev => [newTx, ...prev]);
  };

  // Handler: Trigger push notifications for clients from dashboard controls
  const handleTriggerNotification = (type: 'billing' | 'payment_pending') => {
    const id = `N-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    let title = '';
    let body = '';

    if (type === 'billing') {
      title = 'Lembrete de Cobrança Recorrente';
      body = 'Notificação push enviada para Roberto de Oliveira: Assinatura do plano de manutenção mensal vence em 5 dias.';
    } else {
      title = 'Aviso de Pagamento Pendente';
      body = 'Notificação push de cobrança enviada para Carlos Eduardo (OS-1003): Orçamento pronto aguardando liquidação.';
    }

    const newNotif: PushNotification = {
      id,
      timestamp,
      title,
      body,
      type,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Handler: Client decides on quote from public portal
  const handleClientDecision = (orderId: string, approved: boolean) => {
    const newStatus = approved ? 'orcamento_aprovado' : 'orcamento_rejeitado';
    const decisionText = approved ? 'APROVADO PELO CLIENTE VIA PORTAL' : 'REJEITADO PELO CLIENTE VIA PORTAL';
    
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newHistoryEvent = {
          timestamp: new Date().toISOString(),
          status: newStatus as OSStatus,
          note: `Decisão do cliente via portal: Orçamento ${approved ? 'Aprovado' : 'Rejeitado'}.`
        };
        return {
          ...o,
          status: newStatus as OSStatus,
          history: [...o.history, newHistoryEvent],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // Trigger notification
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: approved ? 'Orçamento Aprovado' : 'Orçamento Rejeitado',
      body: `O cliente respondeu ao orçamento da ${orderId}: ${approved ? 'Aprovou' : 'Recusou'} o valor.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert(`Sua resposta foi enviada com sucesso! O status da OS foi atualizado para: ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  // Active OS to settle payment
  const activePaymentOS = orders.find(o => o.id === activePaymentOSId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* TOP AGENDA BAR */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-40 shadow-xs shrink-0">
        <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider font-display shrink-0">
          Agenda Hoje
        </div>
        
        {/* Dynamic horizontal scrollable row of active orders */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 shrink">
          {agendaOrders.length === 0 ? (
            <span className="text-xs text-slate-400 font-medium italic">Nenhuma OS ativa hoje</span>
          ) : (
            agendaOrders.map((os) => {
              // Status Badge color dot
              let dotColor = "bg-slate-300";
              if (os.status === 'aguardando_orcamento') dotColor = "bg-amber-400";
              if (os.status === 'orcamento_aprovado') dotColor = "bg-blue-400";
              if (os.status === 'em_reparo') dotColor = "bg-indigo-500";
              if (os.status === 'pronto') dotColor = "bg-emerald-500";

              return (
                <button
                  key={os.id}
                  onClick={() => handleSelectOrder(os.id)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0 cursor-pointer transition-all"
                >
                  <span className="font-mono font-bold text-indigo-600 text-[11px]">{os.id}</span>
                  <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">
                    {os.clientName.split(' ')[0]}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                </button>
              );
            })
          )}
        </div>

        {/* Sync Status and Notifications on the right */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Conciliação Bancária</div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado • Real-time
            </div>
          </div>
          
          <button 
            onClick={() => {
              setActiveTab('dashboard');
              setTimeout(() => {
                const el = document.getElementById('notificacoes-container');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg relative cursor-pointer transition-colors"
            title="Ver notificações"
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Left navigation sidebar panel */}
        <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-4">
          <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="text-white font-black text-xl tracking-tighter font-display flex items-center gap-1">
                ELETRO<span className="text-indigo-400">OS</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Eletrônica</div>
            </div>
            
            <nav className="p-3 space-y-1 flex flex-col">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'orders' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Wrench size={14} /> Ordens de Serviço
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'clients' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users size={14} /> Clientes / CPFs
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'reconciliation' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 size={14} /> Conciliação Bancária
              </button>
              <button
                onClick={() => setActiveTab('mei')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'mei' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText size={14} /> Relatório MEI
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'financial' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <DollarSign size={14} /> Financeiro & PDV
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'purchases' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers size={14} /> Compras & Estoque
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'services' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Catálogo de Serviços
              </button>
              
              <div className="border-t border-slate-800/80 my-2" />
              
              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'tracker' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-950/60 border border-indigo-900/30'
                }`}
              >
                <Search size={14} /> Portal do Cliente
              </button>
            </nav>

            {/* Sidebar MEI faturamento limits card (High Density) */}
            <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/30">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Faturamento MEI (Jul)</div>
                <div className="text-xs font-bold text-white font-mono">{formatBRL(currentMonthRevenue)} / {formatBRL(6750)}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentMonthRevenue / 6750) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-tight font-medium">Limite prudencial: R$ 6.750/mês</p>
              </div>
            </div>
          </div>

          {/* Quick Support Badge */}
          <div className="bg-white text-slate-600 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5 text-xs hidden lg:block">
            <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600 animate-pulse" />
              Ambiente Homologado
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Recursos de faturamento MEI, orçamentos, e conciliação integrados operando em simulação local.
            </p>
          </div>
        </aside>

        {/* Content Area panel */}
        <main className="flex-1 min-w-0">
          
          {/* Integrated Top Calendar Panel (Visible only on Dashboard) */}
          {activeTab === 'dashboard' && (
            <CalendarHeader 
              orders={orders} 
              onSelectOrder={handleSelectOrder} 
            />
          )}

          {/* View Router */}
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              notifications={notifications}
              onTriggerNotification={handleTriggerNotification}
              onClearNotifications={handleClearNotifications}
              onNavigateToTab={setActiveTab}
              onSelectOrder={handleSelectOrder}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManagementView
              orders={orders}
              clients={clients}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onPayOrder={(id) => setActivePaymentOSId(id)}
              products={products}
              setProducts={setProducts}
              serviceTemplates={serviceTemplates}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesAndStockView
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              products={products}
              setProducts={setProducts}
              purchases={purchases}
              setPurchases={setPurchases}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeTab === 'services' && (
            <ServicesCatalogView
              serviceTemplates={serviceTemplates}
              setServiceTemplates={setServiceTemplates}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeTab === 'clients' && (
            <ClientDirectoryView
              clients={clients}
              orders={orders}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onUpdateClientWallet={handleUpdateClientWallet}
              onSelectOrder={setSelectedOrderId}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'reconciliation' && (
            <BankReconciliationView
              transactions={bankTransactions}
              orders={orders}
              onReconcile={handleReconcile}
              onRefreshTransactions={handleRefreshTransactions}
            />
          )}

          {activeTab === 'mei' && (
            <MeiReportView 
              orders={orders} 
            />
          )}

          {activeTab === 'financial' && (
            <FinancialModuleView
              orders={orders}
              setOrders={setOrders}
              clients={clients}
              setClients={setClients}
              products={products}
              setProducts={setProducts}
              purchases={purchases}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeTab === 'tracker' && (
            <ClientTracker
              orders={orders}
              onClientDecision={handleClientDecision}
            />
          )}

        </main>

      </div>

      {/* Payment Settlement Modal Container */}
      {activePaymentOS && (
        <PaymentModal
          order={activePaymentOS}
          clients={clients}
          onClose={() => setActivePaymentOSId(null)}
          onConfirmPayment={(orderId, payments, balance) => {
            handleConfirmPayment(orderId, payments, balance);
            setActivePaymentOSId(null);
          }}
        />
      )}

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] text-slate-400 font-medium shrink-0">
        EletroOS © 2026 • Ferramenta Completa de Orçamentos, Pagamentos e Controle Financeiro MEI • Versão 2.4.0
      </footer>

    </div>
  );
}
