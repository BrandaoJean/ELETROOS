import { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  CalendarDays, 
  CalendarRange, 
  Wrench, 
  Sparkles,
  Phone,
  Laptop,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ServiceOrder } from '../types';
import { getFirstName, formatBRL } from '../utils';

interface CalendarHeaderProps {
  orders: ServiceOrder[];
  onSelectOrder: (id: string) => void;
}

type CalendarViewMode = 'monthly' | 'weekly' | 'daily';

export default function CalendarHeader({ orders, onSelectOrder }: CalendarHeaderProps) {
  // Focus and default on today's current date dynamically
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Status visual themes helper
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'aguardando_orcamento':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/20',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          dot: 'bg-amber-400',
          label: 'Aguardando Orçamento'
        };
      case 'orcamento_aprovado':
        return {
          bg: 'bg-blue-500/10 hover:bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          dot: 'bg-blue-400',
          label: 'Orçamento Aprovado'
        };
      case 'orcamento_rejeitado':
        return {
          bg: 'bg-rose-500/10 hover:bg-rose-500/20',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          dot: 'bg-rose-500',
          label: 'Orçamento Rejeitado'
        };
      case 'em_reparo':
        return {
          bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
          text: 'text-indigo-400',
          border: 'border-indigo-500/20',
          dot: 'bg-indigo-500',
          label: 'Em Reparo'
        };
      case 'pronto':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          dot: 'bg-emerald-500',
          label: 'Pronto para Retirada'
        };
      case 'entregue':
        return {
          bg: 'bg-slate-500/10 hover:bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-800',
          dot: 'bg-slate-500',
          label: 'Entregue'
        };
      default:
        return {
          bg: 'bg-slate-500/10 hover:bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-800',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  // Helper: Get order schedule date (dueDate takes priority as scheduling date, fallback to createdAt date)
  const getOrderScheduleDate = (os: ServiceOrder): string => {
    return os.dueDate || os.createdAt.split('T')[0];
  };

  // Helper to change month/year safely
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(todayStr);
    setCurrentMonth(6); // July
    setCurrentYear(2026);
  };

  // 1. GENERATE MONTH DAYS (42 cells: 6 weeks * 7 days)
  const monthDays = useMemo(() => {
    const days = [];
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    // Padding days from previous month
    const prevMonthNumDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = prevMonthNumDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dayNum: prevDayNum,
        fullDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(prevDayNum).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= numDays; i++) {
      days.push({
        dayNum: i,
        fullDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true,
      });
    }

    // Padding days from next month to complete 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dayNum: i,
        fullDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // 2. GENERATE WEEK DAYS (7 days containing selectedDate, starting Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    
    const startOfWeek = new Date(dateObj);
    startOfWeek.setDate(dateObj.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const yearStr = current.getFullYear();
      const monthStr = String(current.getMonth() + 1).padStart(2, '0');
      const dayStr = String(current.getDate()).padStart(2, '0');
      const fullDateStr = `${yearStr}-${monthStr}-${dayStr}`;

      days.push({
        label: weekdayNames[current.getDay()],
        dayNum: current.getDate(),
        fullDate: fullDateStr,
      });
    }
    return days;
  }, [selectedDate]);

  // Find events for the selected day in Daily View
  const dailyEvents = useMemo(() => {
    return orders.filter(o => getOrderScheduleDate(o) === selectedDate);
  }, [orders, selectedDate]);

  // Map orders into days for quick lookup
  const ordersByDate = useMemo(() => {
    const map: Record<string, ServiceOrder[]> = {};
    orders.forEach(os => {
      const dateKey = getOrderScheduleDate(os);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(os);
    });
    return map;
  }, [orders]);

  // Date formatted in natural language for daily headers
  const naturalSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-5 mb-6 border border-slate-800" id="agenda-calendario">
      
      {/* TOP HEADER BLOCK WITH MODE SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/15">
            <Calendar size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight flex items-center gap-1.5 uppercase font-display">
              Agenda Interativa de Serviços <Sparkles size={13} className="text-indigo-400" />
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Controle de prazos de entrega e agendamentos</p>
          </div>
        </div>

        {/* View mode toggle and Today button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-extrabold rounded-lg border border-slate-700 cursor-pointer transition-colors"
          >
            Ir para Hoje
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'monthly' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarRange size={12} /> Mensal
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'weekly' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays size={12} /> Semanal
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'daily' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock size={12} /> Diário
            </button>
          </div>
        </div>
      </div>

      {/* MONTH / NAVIGATION CONTROLS (Only visible in Monthly View or to shift context) */}
      {viewMode === 'monthly' && (
        <div className="flex items-center justify-between mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Navegação Mensal</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-xs w-36 text-center bg-slate-850 border border-slate-850 py-1 px-3 rounded-full text-indigo-300 uppercase tracking-wide">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 1. MONTHLY VIEW GRID                   */}
      {/* ======================================= */}
      {viewMode === 'monthly' && (
        <div className="space-y-2">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayNames.map((name) => (
              <div key={name} className="text-[10px] uppercase font-black tracking-widest text-slate-500 py-1">
                {name}
              </div>
            ))}
          </div>

          {/* 42-cell Month Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const isSelected = day.fullDate === selectedDate;
              const isToday = day.fullDate === todayStr;
              const dayOrders = ordersByDate[day.fullDate] || [];

              return (
                <div
                  key={day.fullDate}
                  onClick={() => setSelectedDate(day.fullDate)}
                  className={`min-h-[88px] p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    day.isCurrentMonth 
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-950/20 border-slate-900/50 opacity-40 hover:opacity-75'
                  } ${
                    isSelected ? 'ring-1 ring-indigo-500 border-indigo-500/50 bg-slate-950/80' : ''
                  }`}
                >
                  {/* Cell Top Header with Day Num */}
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-mono font-bold ${
                      isToday 
                        ? 'bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black' 
                        : isSelected ? 'text-indigo-400 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
                    }`}>
                      {day.dayNum}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    )}
                  </div>

                  {/* Cell Day Orders List */}
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[58px]">
                    {dayOrders.map((os) => {
                      const clientFirstName = getFirstName(os.clientName);
                      const config = getStatusConfig(os.status);

                      return (
                        <div
                          key={os.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering cell click selection
                            onSelectOrder(os.id);
                          }}
                          className={`px-1 py-0.5 rounded text-[9px] font-extrabold truncate border transition-all flex items-center gap-1 ${config.bg} ${config.text} ${config.border} hover:scale-[1.02] cursor-pointer`}
                          title={`OS ${os.id} - ${os.clientName}: ${os.equipment}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${config.dot} shrink-0`}></span>
                          <span className="font-mono">{os.id.split('-')[1] || os.id}</span>
                          <span className="opacity-80">|</span>
                          <span className="truncate">{clientFirstName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. WEEKLY VIEW GRID                    */}
      {/* ======================================= */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Semana do dia {weekDays[0].dayNum} ao {weekDays[6].dayNum} de {monthNames[currentMonth]}
            </span>
            <span className="text-[10px] bg-slate-800 text-indigo-300 font-bold px-2 py-0.5 rounded">
              7 Dias Úteis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
            {weekDays.map((day) => {
              const isSelected = day.fullDate === selectedDate;
              const isToday = day.fullDate === todayStr;
              const dayOrders = ordersByDate[day.fullDate] || [];

              return (
                <div
                  key={day.fullDate}
                  onClick={() => setSelectedDate(day.fullDate)}
                  className={`bg-slate-950 p-3 rounded-2xl border flex flex-col min-h-[220px] cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-950/80' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Column Header */}
                  <div className="border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">{day.label}</span>
                      <span className={`text-base font-black ${isToday ? 'text-indigo-400' : 'text-white'}`}>{day.dayNum}</span>
                    </div>
                    {isToday && (
                      <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">HOJE</span>
                    )}
                  </div>

                  {/* Orders detailed list inside Week column */}
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                    {dayOrders.length === 0 ? (
                      <div className="text-[10px] text-slate-600 italic py-4 text-center">Nenhuma OS</div>
                    ) : (
                      dayOrders.map((os) => {
                        const clientFirstName = getFirstName(os.clientName);
                        const config = getStatusConfig(os.status);

                        return (
                          <div
                            key={os.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder(os.id);
                            }}
                            className={`p-2 rounded-xl border text-[10px] transition-all flex flex-col gap-1 ${config.bg} ${config.text} ${config.border} hover:scale-[1.03] cursor-pointer`}
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span className="font-mono text-xs">{os.id}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                            </div>
                            <div className="font-semibold text-slate-200 truncate">{clientFirstName}</div>
                            <div className="text-[9px] text-slate-400 truncate font-medium">{os.equipment}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. DAILY TIMELINE VIEW                 */}
      {/* ======================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Header row with selected day */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Visão Diária
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mt-1">
                {naturalSelectedDate}
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold font-mono">
              Total de Atendimentos: <strong className="text-indigo-400 font-bold">{dailyEvents.length}</strong>
            </div>
          </div>

          {/* Daily events catalog style list */}
          {dailyEvents.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 italic text-xs">
              <Clock className="mx-auto text-slate-700 mb-2.5" size={24} />
              Nenhuma ordem de serviço ou entrega agendada para este dia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyEvents.map((os) => {
                const config = getStatusConfig(os.status);
                const isDue = os.dueDate === selectedDate;

                return (
                  <div
                    key={os.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors flex flex-col justify-between gap-4 relative group overflow-hidden"
                  >
                    {/* Status side stripe accent */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${config.dot}`}></div>

                    <div className="pl-2 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => onSelectOrder(os.id)}
                              className="font-mono font-black text-indigo-400 text-sm hover:underline cursor-pointer"
                            >
                              {os.id}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300 font-bold flex items-center gap-1 text-xs">
                              <User size={11} className="text-slate-400" />
                              {os.clientName}
                            </span>
                          </div>
                          
                          {/* Client Contacts */}
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-1.5">
                            <Phone size={10} className="text-slate-500" /> {os.clientPhone}
                          </div>
                        </div>

                        {/* Status Label badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border ${config.bg} ${config.text} ${config.border}`}>
                          {config.label}
                        </span>
                      </div>

                      {/* Equipment parameters */}
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60 text-xs flex gap-2">
                        <Laptop className="text-slate-500 mt-0.5 shrink-0" size={14} />
                        <div>
                          <span className="font-extrabold text-slate-200">{os.equipment}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{os.brand} • Modelo: {os.model}</span>
                        </div>
                      </div>

                      {/* Problem details */}
                      <div className="text-xs text-slate-400 leading-normal">
                        <strong className="text-slate-300">Problema:</strong> {os.reportedProblem}
                      </div>
                    </div>

                    {/* Footer values and click access */}
                    <div className="pl-2 pt-3 border-t border-slate-900 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Custo Total de Reparo</span>
                        <span className="font-mono font-black text-indigo-300 text-xs">{formatBRL(os.totalCost)}</span>
                      </div>

                      <div className="flex gap-2">
                        {isDue && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded text-[9px] font-extrabold uppercase flex items-center gap-1">
                            <AlertTriangle size={10} /> Prazo Final
                          </span>
                        )}
                        <button
                          onClick={() => onSelectOrder(os.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                        >
                          Ver OS Completa
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DAILY MINOR SUB-PANEL FOOTER (Help indicator) */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-slate-500 font-semibold bg-slate-950/20 p-2.5 rounded-xl">
        <span className="flex items-center gap-1">
          <Clock size={11} className="text-slate-600" /> Agenda atualizada de acordo com os prazos de entrega inseridos em cada ordem de serviço.
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span> Orçamento
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span> Reparo
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Pronto
        </span>
      </div>

    </div>
  );
}
