import { useState, useMemo } from 'react';
import { 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Link2, 
  AlertCircle,
  Clock,
  Sparkles,
  Link2Off,
  Coins
} from 'lucide-react';
import { BankTransaction, ServiceOrder } from '../types';
import { formatBRL } from '../utils';

interface BankReconciliationViewProps {
  transactions: BankTransaction[];
  orders: ServiceOrder[];
  onReconcile: (transactionId: string, orderId: string, method: string, amount: number) => void;
  onRefreshTransactions: () => void;
}

export default function BankReconciliationView({
  transactions,
  orders,
  onReconcile,
  onRefreshTransactions
}: BankReconciliationViewProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Trigger simulated API reload
  const handleSyncBank = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onRefreshTransactions();
      setIsSyncing(false);
      alert('Extrato bancário atualizado via API Open Finance com sucesso!');
    }, 1200);
  };

  // Heuristics algorithm to auto-match transaction to a pending unpaid OS
  const reconciliationMatches = useMemo(() => {
    return transactions.map(tx => {
      if (tx.status === 'conciliado') {
        return { tx, matchedOs: orders.find(o => o.id === tx.matchedOsId) || null, confidence: 'high' };
      }

      // Try to match with unpaid orders
      const pendingOrders = orders.filter(o => !o.isPaid);
      
      // Heuristic 1: Exact Amount and client name substring match
      let matchedOs = pendingOrders.find(o => {
        const matchesAmount = Math.abs(o.totalCost - tx.amount) < 0.01;
        const nameParts = o.clientName.toLowerCase().split(' ');
        const matchesName = nameParts.some(p => p.length > 2 && tx.description.toLowerCase().includes(p));
        return matchesAmount && matchesName;
      }) || null;

      let confidence: 'high' | 'medium' | 'none' = matchedOs ? 'high' : 'none';

      // Heuristic 2: If no name match, match purely by exact Amount
      if (!matchedOs) {
        const potentialMatches = pendingOrders.filter(o => Math.abs(o.totalCost - tx.amount) < 0.01);
        if (potentialMatches.length === 1) {
          matchedOs = potentialMatches[0];
          confidence = 'medium';
        }
      }

      return {
        tx,
        matchedOs,
        confidence
      };
    });
  }, [transactions, orders]);

  return (
    <div className="space-y-6">
      
      {/* Banking integration header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Building2 className="text-indigo-600 animate-pulse" size={18} /> Conciliação Bancária Automática (API Open Finance)
          </h2>
          <p className="text-xs text-slate-500">Concilie automaticamente os pagamentos recebidos por PIX, Cartões ou TED com as respectivas Ordens de Serviço sem digitação manual.</p>
        </div>

        <button
          onClick={handleSyncBank}
          disabled={isSyncing}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Buscando Extrato...' : 'Sincronizar Banco'}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Real-time Extrato Bancário Feed (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider px-1">Lançamentos Recentes do Extrato Bancário</h3>
          
          <div className="space-y-3">
            {reconciliationMatches.map(({ tx, matchedOs, confidence }) => {
              const isConciliated = tx.status === 'conciliado';

              return (
                <div 
                  key={tx.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isConciliated 
                      ? 'border-emerald-200 bg-emerald-50/15' 
                      : matchedOs 
                        ? 'border-indigo-200 bg-indigo-50/10' 
                        : 'border-slate-200'
                  }`}
                >
                  {/* Left: bank transaction information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                        tx.method === 'pix' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tx.method.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleString('pt-BR', {day: '2-digit', month:'2-digit', hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs leading-relaxed">{tx.description}</h4>
                    <p className="font-black text-slate-900 text-sm">{formatBRL(tx.amount)}</p>
                  </div>

                  {/* Middle/Right: match recommendation and trigger action */}
                  <div className="border-t md:border-t-0 pt-3 md:pt-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    
                    {/* Conciliation visual link matches */}
                    {isConciliated ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
                        <CheckCircle2 size={13} />
                        <span>Conciliado com {tx.matchedOsId}</span>
                      </div>
                    ) : matchedOs ? (
                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-100/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                          <Link2 size={11} /> Match Sugerido ({confidence === 'high' ? '98%' : '85%'} de Confiança)
                        </div>
                        
                        <div className="text-left sm:text-right text-[11px] text-slate-600 leading-normal">
                          <p>Vincular a: <strong>{matchedOs.id}</strong> ({matchedOs.clientName})</p>
                          <p className="text-[10px]">Aparelho: {matchedOs.equipment}</p>
                        </div>

                        <button
                          onClick={() => onReconcile(tx.id, matchedOs!.id, tx.method, tx.amount)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          Confirmar Conciliação
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80 text-[11px] font-medium">
                        <Link2Off size={13} />
                        <span>Nenhum match exato pendente</span>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* API Connection Information (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" /> Como funciona a Conciliação
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-indigo-50 rounded-full text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <p className="leading-relaxed">A API Open Finance monitora os recebimentos em tempo real e lista as transações na sua conta jurídica.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-indigo-50 rounded-full text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <p className="leading-relaxed">Nosso algoritmo compara o <strong>valor exato</strong> e o <strong>nome/CPF do remetente</strong> com as OS em aberto.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-indigo-50 rounded-full text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <p className="leading-relaxed">Com um clique, você concilia a transação. O sistema automaticamente quita a OS, emite o recibo e muda o status para Pronto.</p>
              </div>
            </div>
          </div>

          {/* Secure Webhook Simulator Info */}
          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Coins size={14} /> Webhooks PIX Ativos
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O webhook do seu banco parceiro está configurado no ambiente de teste para disparar conciliações instantaneamente ao receber qualquer PIX copia e cola.
            </p>
            <div className="bg-slate-950 p-2.5 rounded font-mono text-[9px] text-emerald-400 border border-slate-800">
              URL: {window.location.origin}/api/webhooks/pix
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
