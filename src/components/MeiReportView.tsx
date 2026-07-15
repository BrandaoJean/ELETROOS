import { useState, useMemo } from 'react';
import { 
  FileCheck, 
  Printer, 
  TrendingUp, 
  Info, 
  Percent, 
  Award,
  BookOpen,
  Download,
  AlertCircle
} from 'lucide-react';
import { ServiceOrder } from '../types';
import { formatBRL } from '../utils';

interface MeiReportViewProps {
  orders: ServiceOrder[];
}

export default function MeiReportView({ orders }: MeiReportViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // Default: July (6)
  const currentYear = 2026;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calculate MEI report sections based on paid orders in the selected month
  const meiReportData = useMemo(() => {
    let receitaComercioComNF = 0; // Parts sold with invoice (simulated split)
    let receitaComercioSemNF = 0; // Parts sold without invoice
    let receitaServicoComNF = 0;  // Service labor with invoice
    let receitaServicoSemNF = 0;  // Service labor without invoice

    orders.forEach(o => {
      if (o.isPaid) {
        const payDate = o.paymentDate || o.createdAt;
        const dObj = new Date(payDate);
        if (dObj.getFullYear() === currentYear && dObj.getMonth() === selectedMonth) {
          // Calculate parts subtotal
          const partsCost = o.parts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
          const laborCost = o.laborCost;

          // Split: simulate 60% with invoice, 40% without (typical for MEI)
          const hasInvoice = parseInt(o.id.replace('OS-', '')) % 2 === 0; // Even OS gets Invoice

          if (hasInvoice) {
            receitaComercioComNF += partsCost;
            receitaServicoComNF += laborCost;
          } else {
            receitaComercioSemNF += partsCost;
            receitaServicoSemNF += laborCost;
          }
        }
      }
    });

    const totalComercio = receitaComercioComNF + receitaComercioSemNF;
    const totalServico = receitaServicoComNF + receitaServicoSemNF;
    const faturamentoBrutoTotal = totalComercio + totalServico;

    // MEI limit warnings
    const monthlyAverageLimit = 6750.00; // R$ 81.000,00 / 12
    const statusLimitPercent = (faturamentoBrutoTotal / monthlyAverageLimit) * 100;

    return {
      receitaComercioComNF,
      receitaComercioSemNF,
      totalComercio,
      receitaServicoComNF,
      receitaServicoSemNF,
      totalServico,
      faturamentoBrutoTotal,
      statusLimitPercent
    };
  }, [orders, selectedMonth]);

  // Year cumulative revenue
  const yearlyCumulative = useMemo(() => {
    let total = 0;
    orders.forEach(o => {
      if (o.isPaid) {
        const payDate = o.paymentDate || o.createdAt;
        const dObj = new Date(payDate);
        if (dObj.getFullYear() === currentYear) {
          total += o.totalCost;
        }
      }
    });
    return total;
  }, [orders]);

  return (
    <div className="space-y-6">
      
      {/* Intro and Info Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <FileCheck className="text-indigo-600" size={18} /> Relatório de Faturamento Obrigatório MEI
          </h2>
          <p className="text-xs text-slate-500">Gere e emita o comprovante de receita bruta mensal obrigatório conforme a Resolução CGSN nº 140/2018.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800 cursor-pointer"
          >
            {monthNames.map((m, idx) => (
              <option key={idx} value={idx}>{m} / {currentYear}</option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Official Brazilian MEI Form Template (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded-xl shadow-md overflow-hidden p-6 max-w-3xl mx-auto space-y-6" id="mei-official-form">
          
          {/* Form Header */}
          <div className="text-center border-2 border-slate-900 p-4 space-y-1 rounded-lg">
            <h1 className="text-sm font-black tracking-wider uppercase">Relatório Mensal das Receitas Brutas</h1>
            <p className="text-[10px] font-semibold text-slate-600">(Artigo 26, § 1º e § 3º da Lei Complementar nº 123/2006 e Anexo Único da Resolução CGSN nº 140/2018)</p>
          </div>

          {/* Form Identification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-slate-200 p-3 rounded text-[10px] bg-slate-50">
            <div>
              <p className="font-bold uppercase text-slate-500">Período de Apuração</p>
              <p className="font-black text-slate-800 text-xs">{monthNames[selectedMonth].toUpperCase()} / {currentYear}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-500">CNPJ do Contribuinte</p>
              <p className="font-semibold text-slate-800">22.888.777/0001-99</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-500">Nome da Empresa MEI</p>
              <p className="font-semibold text-slate-800">ELETRO COMERCIO E ASSISTENCIA MEI</p>
            </div>
          </div>

          {/* Form Fields Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
                  <th className="p-3 border border-slate-900">Descrição das Receitas Brutas por Atividade</th>
                  <th className="p-3 border border-slate-900 text-right w-44">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                
                {/* Section I: Commerce / Revenda */}
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2.5 uppercase text-slate-700 text-[10px]" colSpan={2}>I - Receitas de Atividades de Comércio (Venda de Peças e Insumos)</td>
                </tr>
                <tr>
                  <td className="p-3 pl-5 text-slate-600">a) Receitas com emissão de documento fiscal (Vendas de Peças com NF)</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatBRL(meiReportData.receitaComercioComNF)}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-5 text-slate-600">b) Receitas sem emissão de documento fiscal (Vendas de Peças para Pessoa Física sem NF)</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatBRL(meiReportData.receitaComercioSemNF)}</td>
                </tr>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="p-3 pl-5">Total das Receitas de Comércio (a + b)</td>
                  <td className="p-3 text-right font-bold text-slate-950">{formatBRL(meiReportData.totalComercio)}</td>
                </tr>

                {/* Section II: Services / Serviços */}
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2.5 uppercase text-slate-700 text-[10px]" colSpan={2}>II - Receitas de Atividades de Prestação de Serviços (Mão de Obra de Reparos)</td>
                </tr>
                <tr>
                  <td className="p-3 pl-5 text-slate-600">c) Receitas com emissão de documento fiscal (Reparos com NF)</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatBRL(meiReportData.receitaServicoComNF)}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-5 text-slate-600">d) Receitas sem emissão de documento fiscal (Reparos para Pessoa Física sem NF)</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatBRL(meiReportData.receitaServicoSemNF)}</td>
                </tr>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="p-3 pl-5">Total das Receitas de Serviços (c + d)</td>
                  <td className="p-3 text-right font-bold text-slate-950">{formatBRL(meiReportData.totalServico)}</td>
                </tr>

                {/* Grand Total */}
                <tr className="bg-indigo-900 text-white font-extrabold text-xs">
                  <td className="p-3 uppercase">Total Geral das Receitas Brutas no Mês (I + II)</td>
                  <td className="p-3 text-right text-[13px] font-black">{formatBRL(meiReportData.faturamentoBrutoTotal)}</td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-[10px]">
            <div className="text-center space-y-1">
              <p>Local e Data:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-slate-500 font-medium">São Paulo, SP, ____ de ______________ de 2026.</p>
            </div>
            <div className="text-center space-y-1">
              <p>Assinatura do Empreendedor:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-slate-500 font-medium">ELETRO COMERCIO E ASSISTENCIA MEI</p>
            </div>
          </div>

        </div>

        {/* Sidebar MEI Stats & Guides (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Cumulative Progress bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Percent size={14} className="text-indigo-600" /> Limite MEI {currentYear}
            </h3>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Acumulado Pago</span>
                <span>{formatBRL(yearlyCumulative)} / R$ 81k</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((yearlyCumulative / 81000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Sua assistência técnica já faturou {((yearlyCumulative / 81000) * 100).toFixed(1)}% do limite legal permitido no ano.
              </p>
            </div>
          </div>

          {/* Warnings & Help */}
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl space-y-3.5 text-xs text-indigo-950">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Info size={15} /> Regras MEI para Eletrônicas
            </h4>
            <ul className="space-y-2 list-disc list-inside leading-relaxed text-indigo-900">
              <li>MEI pode vender peças acessórias e insumos de informática/eletrônica sob o CNAE de comércio correspondente.</li>
              <li>O faturamento de prestação de serviços deve ser lançado separadamente do comércio de revenda na declaração anual DAS-SIMEI.</li>
              <li>O Relatório de Receita Bruta Mensal deve ser preenchido até o dia 20 do mês subsequente e arquivado com as notas de compra por no mínimo 5 anos.</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1">
              <AlertCircle size={14} className="text-slate-500" /> Exportação de Dados
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">Os dados podem ser impressos fisicamente ou salvos no formato digital PDF utilizando as opções integradas de impressão do navegador.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
