import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Wrench, 
  Tv, 
  CheckCircle, 
  XCircle, 
  Hourglass, 
  FileCheck, 
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Printer,
  Calendar
} from 'lucide-react';
import { ServiceOrder } from '../types';
import { formatBRL } from '../utils';

interface ClientTrackerProps {
  orders: ServiceOrder[];
  onClientDecision: (orderId: string, approved: boolean) => void;
}

export default function ClientTracker({ orders, onClientDecision }: ClientTrackerProps) {
  const [osInput, setOsInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [trackedOS, setTrackedOS] = useState<ServiceOrder | null>(null);

  // Quick select helper in public portal (for demo convenience)
  const availableDemoOS = useMemo(() => {
    return orders.slice(0, 4);
  }, [orders]);

  // Handler: Search OS
  const handleTrackSearch = (e?: React.FormEvent, demoOSId?: string, demoPhone?: string) => {
    if (e) e.preventDefault();

    const targetOSId = demoOSId || osInput.trim().toUpperCase();
    const targetPhone = demoPhone || phoneInput.replace(/\D/g, '');

    if (!targetOSId || !targetPhone) {
      setErrorMessage('Por favor, informe o número da OS e o celular cadastrado.');
      return;
    }

    const matched = orders.find(o => 
      o.id === targetOSId && 
      o.clientPhone.replace(/\D/g, '') === targetPhone
    );

    if (matched) {
      setTrackedOS(matched);
      setErrorMessage('');
      setHasSearched(true);
    } else {
      setTrackedOS(null);
      setErrorMessage('Ordem de serviço ou telefone não encontrados. Verifique os dados e tente novamente.');
      setHasSearched(true);
    }
  };

  // Stepper steps
  const steps = [
    { key: 'aguardando_orcamento', label: 'Orçamento' },
    { key: 'orcamento_aprovado', label: 'Aprovado' },
    { key: 'em_reparo', label: 'Em Manutenção' },
    { key: 'pronto', label: 'Pronto p/ Retirada' },
    { key: 'entregue', label: 'Entregue' }
  ];

  // Current active step index
  const activeStepIndex = useMemo(() => {
    if (!trackedOS) return 0;
    if (trackedOS.status === 'orcamento_rejeitado') return 0;
    return steps.findIndex(s => s.key === trackedOS.status);
  }, [trackedOS, trackedOS?.status]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Banner portal publico */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 text-center space-y-3">
        <h2 className="text-xl font-black tracking-tight flex items-center justify-center gap-2">
          <Wrench className="text-indigo-400" size={22} /> Portal de Consulta e Acompanhamento
        </h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">Consulte o status do reparo do seu aparelho em tempo real, aprove ou recuse orçamentos e emita sua via de comprovante direto do conforto de sua casa.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Search Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Acesse sua Ordem de Serviço</h3>
          
          <form onSubmit={(e) => handleTrackSearch(e)} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Número da OS:</label>
              <input
                type="text"
                placeholder="Ex: OS-1003"
                value={osInput}
                onChange={(e) => setOsInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Celular Cadastrado:</label>
              <input
                type="text"
                placeholder="Apenas números com DDD (Ex: 11999998888)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-500 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-start gap-1">
                <ShieldAlert size={12} className="shrink-0 mt-0.5" /> {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Search size={14} /> Consultar Aparelho
            </button>
          </form>

          {/* Quick Demo Access triggers to simplify test drive in the app */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Atalhos para Teste Rápido:</span>
            <div className="space-y-1.5">
              {availableDemoOS.map(os => (
                <button
                  key={os.id}
                  onClick={() => {
                    setOsInput(os.id);
                    setPhoneInput(os.clientPhone);
                    handleTrackSearch(undefined, os.id, os.clientPhone);
                  }}
                  className="w-full p-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded text-left text-[11px] text-slate-700 font-medium flex justify-between items-center transition-all cursor-pointer"
                >
                  <span>{os.id} ({os.clientName.split(' ')[0]})</span>
                  <span className="text-[9px] uppercase font-bold text-indigo-600">{os.status.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Tracking details (7 cols) */}
        <div className="lg:col-span-7">
          {trackedOS ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="tracker-result-panel">
              
              {/* Tracker Result Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Status em Tempo Real</span>
                  <h3 className="text-base font-black tracking-tight">{trackedOS.id}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{trackedOS.equipment} {trackedOS.brand} {trackedOS.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Previsão</span>
                  <span className="text-xs font-bold">{trackedOS.dueDate ? new Date(trackedOS.dueDate).toLocaleDateString('pt-BR') : 'A definir'}</span>
                </div>
              </div>

              {/* Progress Flow Stepper */}
              <div className="p-5 border-b border-slate-100">
                {trackedOS.status === 'orcamento_rejeitado' ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                    <XCircle size={22} className="text-rose-500 shrink-0" />
                    <div>
                      <strong className="font-bold text-rose-950">Orçamento Rejeitado</strong>
                      <p className="mt-0.5">Você recusou o orçamento proposto. O aparelho está disponível para retirada na oficina sem custos de diagnóstico.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative py-4">
                    {/* Stepper bar background */}
                    <div className="absolute top-8 left-4 right-4 h-1 bg-slate-100 -z-1"></div>
                    <div 
                      className="absolute top-8 left-4 h-1 bg-indigo-600 transition-all duration-500 -z-1"
                      style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
                    ></div>

                    <div className="flex justify-between items-center text-center">
                      {steps.map((st, idx) => {
                        const isDone = idx <= activeStepIndex;
                        const isCurrent = idx === activeStepIndex;

                        return (
                          <div key={st.key} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                              isDone 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30' 
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 font-bold whitespace-nowrap hidden sm:inline ${
                              isCurrent ? 'text-indigo-600 font-extrabold' : 'text-slate-400'
                            }`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Technical report and Client Decision for pending quote */}
              <div className="p-5 border-b border-slate-100 text-xs space-y-4">
                
                {/* Reported problem */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Problema Informado por Você</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{trackedOS.reportedProblem}"
                  </p>
                </div>

                {/* Diagnostic and proposed solution if available */}
                {trackedOS.technicalReport ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Solução Diagnosticada pelo Técnico</span>
                    <p className="text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {trackedOS.technicalReport}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-2 text-[11px]">Seu aparelho está em análise técnica. Aguarde a elaboração do orçamento.</p>
                )}

                {/* Quatation breakdown if active */}
                {trackedOS.totalCost > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Demonstrativo de Custos</span>
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>Serviço e Mão de Obra</span>
                        <span>{formatBRL(trackedOS.laborCost)}</span>
                      </div>
                      {trackedOS.parts.length > 0 && (
                        <div className="flex justify-between py-1 text-slate-600">
                          <span>Materiais / Peças ({trackedOS.parts.length})</span>
                          <span>{formatBRL(trackedOS.parts.reduce((s, p) => s + (p.unitPrice * p.quantity), 0))}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 font-bold text-slate-800">
                        <span>Custo Total Estimado</span>
                        <span className="text-sm font-extrabold text-indigo-600">{formatBRL(trackedOS.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Client Decision buttons on 'aguardando_orcamento' status */}
                {trackedOS.status === 'aguardando_orcamento' && trackedOS.totalCost > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center space-y-3.5">
                    <div>
                      <h4 className="font-bold text-indigo-900">Aprovação de Orçamento Pendente</h4>
                      <p className="text-[11px] text-indigo-950 mt-0.5 leading-relaxed">Você concorda com o valor e autoriza o início imediato do reparo técnico?</p>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          onClientDecision(trackedOS.id, false);
                          handleTrackSearch(undefined, trackedOS.id, trackedOS.clientPhone);
                        }}
                        className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-rose-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsDown size={13} /> Recusar Orçamento
                      </button>

                      <button
                        onClick={() => {
                          onClientDecision(trackedOS.id, true);
                          handleTrackSearch(undefined, trackedOS.id, trackedOS.clientPhone);
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ThumbsUp size={13} /> Aprovar e Autorizar
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Status Update History */}
              <div className="p-5 bg-slate-50/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2.5">Linha do Tempo do Aparelho</span>
                <div className="space-y-3">
                  {trackedOS.history.slice().reverse().map((ev, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 shrink-0">
                        {new Date(ev.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-slate-400">•</span>
                      <p className="text-slate-600 text-[11px]">
                        <strong className="text-slate-800 uppercase text-[10px] font-bold">{ev.status.replace('_', ' ')}:</strong> {ev.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-16 text-center flex flex-col items-center justify-center text-slate-400 h-full">
              <Hourglass size={36} className="mb-2 text-slate-300 animate-pulse" />
              <p className="font-semibold text-slate-500">Aguardando Consulta</p>
              <p className="text-xs max-w-xs mt-1">Informe a OS e o telefone cadastrado na busca à esquerda para iniciar o rastreamento em tempo real do aparelho.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
