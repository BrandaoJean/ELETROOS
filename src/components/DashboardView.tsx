import { useMemo } from 'react';
import { 
  TrendingUp, 
  Wrench, 
  CheckCircle2, 
  Hourglass, 
  DollarSign, 
  FileText, 
  Bell, 
  Plus, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { ServiceOrder, PushNotification } from '../types';
import { formatBRL } from '../utils';

interface DashboardViewProps {
  orders: ServiceOrder[];
  notifications: PushNotification[];
  onTriggerNotification: (type: 'billing' | 'payment_pending') => void;
  onClearNotifications: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectOrder: (id: string) => void;
}

export default function DashboardView({ 
  orders, 
  notifications, 
  onTriggerNotification, 
  onClearNotifications,
  onNavigateToTab,
  onSelectOrder
}: DashboardViewProps) {

  // Calculate stats
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'entregue' && o.status !== 'orcamento_rejeitado');
    const pendingApproval = orders.filter(o => o.status === 'aguardando_orcamento');
    const completed = orders.filter(o => o.status === 'pronto');
    
    // Financial calculations (current month: July 2026, and previous month: June 2026)
    let totalRevenueJune = 0;
    let totalRevenueJuly = 0;
    let laborJune = 0;
    let partsJune = 0;
    let laborJuly = 0;
    let partsJuly = 0;

    orders.forEach(o => {
      if (o.isPaid) {
        const payDate = o.paymentDate || o.createdAt;
        const dateObj = new Date(payDate);
        const month = dateObj.getMonth(); // 5 for June, 6 for July
        const year = dateObj.getFullYear();

        if (year === 2026) {
          // Calculate parts total cost
          const partsCost = o.parts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0);
          
          if (month === 5) { // June
            totalRevenueJune += o.totalCost;
            laborJune += o.laborCost;
            partsJune += partsCost;
          } else if (month === 6) { // July
            totalRevenueJuly += o.totalCost;
            laborJuly += o.laborCost;
            partsJuly += partsCost;
          }
        }
      }
    });

    const activeCount = activeOrders.length;
    const paidCount = orders.filter(o => o.isPaid).length;
    const ticketMedio = paidCount > 0 
      ? orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.totalCost, 0) / paidCount 
      : 0;

    return {
      activeCount,
      pendingApprovalCount: pendingApproval.length,
      completedReadyCount: completed.length,
      ticketMedio,
      june: { total: totalRevenueJune, labor: laborJune, parts: partsJune },
      july: { total: totalRevenueJuly, labor: laborJuly, parts: partsJuly }
    };
  }, [orders]);

  // Chart data for financial performance comparison
  const chartData = [
    {
      name: 'Junho / 2026',
      'Mão de Obra': stats.june.labor,
      'Venda de Peças': stats.june.parts,
      'Faturamento Bruto': stats.june.total,
    },
    {
      name: 'Julho / 2026',
      'Mão de Obra': stats.july.labor,
      'Venda de Peças': stats.july.parts,
      'Faturamento Bruto': stats.july.total,
    }
  ];

  // Daily evolution for July (to give a real-time faturamento look)
  const evolutionData = [
    { dia: '01/07', Faturamento: 270 },
    { dia: '05/07', Faturamento: 270 },
    { dia: '10/07', Faturamento: 530 },
    { dia: '12/07', Faturamento: 800 },
    { dia: '14/07', Faturamento: stats.july.total },
  ];

  // Filter orders needing attention
  const pendingOSList = useMemo(() => {
    return orders.filter(o => !o.isPaid && o.status !== 'orcamento_rejeitado').slice(0, 3);
  }, [orders]);

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Faturamento Bruto (Julho)</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatBRL(stats.july.total)}</p>
            <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              <TrendingUp size={10} />
              +{(stats.june.total > 0 ? ((stats.july.total - stats.june.total) / stats.june.total * 100) : 0).toFixed(1)}% vs Junho
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">OS em Aberto / Ativas</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeCount} Ordens</p>
            <p className="text-[10px] text-slate-500 font-medium">Oficina sob controle</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Wrench size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Orçamentos Pendentes</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.pendingApprovalCount} Aguardando</p>
            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <Hourglass size={10} />
              Aguardando aprovação
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <FileText size={20} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ticket Médio Geral</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatBRL(stats.ticketMedio)}</p>
            <p className="text-[10px] text-slate-500 font-medium">Por aparelho liquidado</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-all">
            <CreditCard size={20} />
          </div>
        </div>

      </div>

      {/* Main Charts & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph Area (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Desempenho Financeiro Detalhado</h3>
                <p className="text-xs text-slate-500">Mão de obra e fornecimento de peças (MEI compatível)</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Real-Time</span>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => formatBRL(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Mão de Obra" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Venda de Peças" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simulated Alerts & MEI Limits Banner */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-lg text-indigo-700 mt-1 md:mt-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Controle de Faturamento do MEI</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                  O limite anual de faturamento bruto do MEI é de <strong>R$ 81.000,00</strong> (média de R$ 6.750,00/mês). Seu faturamento acumulado nos mock data é de <strong>{formatBRL(stats.june.total + stats.july.total)}</strong> (fácil conformidade).
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('mei')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              Relatório MEI <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Action Panel & Push Notification Center (1 Column) */}
        <div className="space-y-6">
          
          {/* Push Notification Simulator Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4" id="notificacoes-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bell size={16} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Notificações Push do Sistema</h3>
              </div>
              <button 
                onClick={onClearNotifications}
                className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold cursor-pointer transition-colors"
              >
                Limpar
              </button>
            </div>

            {/* Simulated actions to trigger notifications */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <button
                onClick={() => onTriggerNotification('billing')}
                className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-center transition-all cursor-pointer text-[10px] font-semibold text-slate-700"
              >
                <Plus size={14} className="text-indigo-600 mb-1" />
                <span>Cobrança Recorrente</span>
              </button>
              <button
                onClick={() => onTriggerNotification('payment_pending')}
                className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-center transition-all cursor-pointer text-[10px] font-semibold text-slate-700"
              >
                <Plus size={14} className="text-amber-600 mb-1" />
                <span>Pgtos Pendentes</span>
              </button>
            </div>

            {/* Notification List Scroll Area */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Nenhuma notificação enviada recentemente.
                </div>
              ) : (
                notifications.map((notif) => {
                  let badgeColor = "bg-slate-100 text-slate-600";
                  if (notif.type === 'billing') badgeColor = "bg-indigo-50 text-indigo-600 border border-indigo-100";
                  if (notif.type === 'payment_pending') badgeColor = "bg-amber-50 text-amber-600 border border-amber-100";
                  if (notif.type === 'status_update') badgeColor = "bg-blue-50 text-blue-600 border border-blue-100";

                  return (
                    <div 
                      key={notif.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        notif.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-indigo-50/20 border-indigo-100 text-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                          {notif.type === 'billing' ? 'Cobrança Recorrente' : notif.type === 'payment_pending' ? 'Cobrança OS' : 'Status'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mb-0.5">{notif.title}</h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{notif.body}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mini Pending Actions list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3.5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-500" />
              Retiradas e Cobranças Pendentes
            </h3>
            <div className="space-y-2">
              {pendingOSList.map((os) => (
                <div 
                  key={os.id}
                  onClick={() => onSelectOrder(os.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      {os.id} <span className="text-slate-400 font-normal">| {os.clientName.split(' ')[0]}</span>
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">{os.equipment} {os.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-xs">{formatBRL(os.totalCost)}</p>
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {os.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Ver Todas as Ordens de Serviço
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
