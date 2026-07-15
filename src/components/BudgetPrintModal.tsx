import React from 'react';
import { Printer, X, CheckSquare, ShieldCheck, FileText } from 'lucide-react';
import { ServiceOrder, Client } from '../types';
import { formatBRL } from '../utils';

interface BudgetPrintModalProps {
  order: ServiceOrder;
  client: Client | null;
  onClose: () => void;
}

export default function BudgetPrintModal({ order, client, onClose }: BudgetPrintModalProps) {
  const [printType, setPrintType] = React.useState<'entrada' | 'orcamento' | 'retirada'>('orcamento');
  
  const partsCost = order.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
  const formattedDueDate = order.dueDate 
    ? new Date(order.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') 
    : 'Sem previsão';

  const handlePrint = () => {
    window.print();
  };

  // Determine title and subtitle based on printType
  const getDocumentHeader = () => {
    switch (printType) {
      case 'entrada':
        return {
          title: 'Recibo de Entrada de Equipamento',
          label: 'EletroOS - Entrada e Triagem'
        };
      case 'retirada':
        return {
          title: 'Recibo de Retirada e Quitação de Equipamento',
          label: 'EletroOS - Entrega e Quitação'
        };
      case 'orcamento':
      default:
        return {
          title: 'Orçamento de Prestação de Serviços Técnicos',
          label: 'EletroOS - Orçamento Técnico'
        };
    }
  };

  const docHeader = getDocumentHeader();

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-h-none print:rounded-none">
        
        {/* Modal Controls (Hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Impressão de Ordem de Serviço ({order.id})</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer size={14} /> Imprimir Agora
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Print Type Selector Tab Bar (Hidden during print) */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-wrap gap-2 print:hidden shrink-0">
          <button
            onClick={() => setPrintType('entrada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              printType === 'entrada'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            1. Recibo de Entrada
          </button>
          <button
            onClick={() => setPrintType('orcamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              printType === 'orcamento'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            2. Orçamento Técnico
          </button>
          <button
            onClick={() => setPrintType('retirada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              printType === 'retirada'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            3. Recibo de Retirada (Quitação)
          </button>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          
          <div 
            id="print-area" 
            className="bg-white border border-slate-200 shadow-md p-8 max-w-3xl mx-auto rounded-lg font-sans text-xs text-slate-800 space-y-6 print:border-none print:shadow-none print:p-4 print:my-0"
          >
            {/* Header / Business details */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  ELETRO<span className="text-indigo-600">OS</span>
                </h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Oficina de Eletrônica e Manutenção</p>
                <div className="mt-2 text-slate-500 leading-relaxed text-[10px]">
                  <p>Av. Principal, 1500 - Centro - São Paulo/SP</p>
                  <p>CNPJ: 12.345.678/0001-90 • Inscr. Est: Isenta</p>
                  <p>Contato: (11) 98765-4321 • contato@eletroos.com.br</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 inline-block">
                  <p className="text-[10px] text-slate-400 uppercase font-black">Nº da OS</p>
                  <p className="text-base font-black text-indigo-700">{order.id}</p>
                </div>
                <div className="mt-2.5 text-slate-500 text-[10px]">
                  <p><strong>Emissão:</strong> {formattedDate}</p>
                  {printType !== 'entrada' && (
                    <p><strong>Previsão:</strong> {formattedDueDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center bg-slate-900 text-white py-2 rounded uppercase tracking-wider font-extrabold text-[11px] print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
              {docHeader.title}
            </div>

            {/* Conditionally render dynamic receipt description */}
            {printType === 'entrada' && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs leading-relaxed space-y-1.5 print:bg-white print:border-slate-100">
                <p className="font-semibold text-slate-800">Declaração de Recebimento de Equipamento:</p>
                <p>Confirmamos, para os devidos fins legais, que recebemos em nossa assistência técnica especializada o equipamento abaixo descrito para fins de avaliação detalhada em laboratório, diagnóstico de falhas, testes eletrônicos e posterior emissão do respectivo orçamento de reparo.</p>
                <p className="text-[10px] text-slate-500 italic">Previsão para retorno com parecer técnico completo: de 24 a 48 horas úteis.</p>
              </div>
            )}

            {printType === 'retirada' && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-xs leading-relaxed space-y-1.5 print:bg-white print:border-slate-100">
                <p className="font-semibold text-emerald-800">Termo de Retirada e Quitação Definitiva:</p>
                <p>Declaramos que o equipamento especificado neste documento foi devidamente consertado, calibrado e submetido a rigorosos testes de bancada, encontrando-se em perfeito e pleno estado de funcionamento técnico. O cliente outorga ampla e irrevogável quitação de valores e retira o equipamento em perfeitas condições estéticas e operacionais nesta data.</p>
              </div>
            )}

            {/* Customer Details Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60 print:bg-white">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Cliente</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{order.clientName}</p>
                <p className="text-slate-500 text-[10px]">CPF: {client?.cpf || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Telefone / E-mail</p>
                <p className="font-semibold text-slate-700 mt-0.5">{order.clientPhone}</p>
                <p className="text-slate-500 text-[10px] truncate">{client?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Endereço do Cliente</p>
                {client?.address ? (
                  <div className="text-slate-700 mt-0.5 text-[10px] leading-snug">
                    <p className="font-semibold">{client.address}, {client.number || 'S/N'}</p>
                    {client.complement && <p className="text-slate-500">{client.complement}</p>}
                    <p className="text-slate-500">{client.neighborhood && `${client.neighborhood} - `}{client.city}/{client.state}</p>
                    <p className="font-mono text-[9px] text-slate-400">CEP: {client.cep}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mt-0.5 font-medium">Cadastro regularizado</p>
                    <p className="text-slate-400 text-[9px] italic">Registrado na base de dados</p>
                  </>
                )}
              </div>
            </div>

            {/* Equipment Details Block */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-1.5 font-bold text-slate-700 text-[10px] uppercase border-b border-slate-200">
                Informações do Equipamento
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-xs">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Aparelho</p>
                  <p className="font-bold text-slate-800 mt-0.5">{order.equipment}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Marca</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{order.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Modelo</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{order.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Nº de Série</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{order.serialNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Reported Problem & Technical Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 print:bg-white">
                <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                  ❌ Problema Relatado
                </h4>
                <p className="text-slate-600 leading-relaxed italic text-[11px]">
                  "{order.reportedProblem}"
                </p>
              </div>
              
              {printType !== 'entrada' ? (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 print:bg-white">
                  <h4 className="font-bold text-indigo-900 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                    🔧 Parecer / Diagnóstico Técnico
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-medium text-[11px]">
                    {order.technicalReport || 'Conserto e testes de componentes executados com sucesso.'}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 print:bg-white flex flex-col justify-center">
                  <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1.5">
                    ⚙️ Estado Operacional na Entrada
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed italic">
                    Aparelho aguardando abertura laboratorial e testes iniciais de hardware/software pelo laboratório técnico.
                  </p>
                </div>
              )}
            </div>

            {/* Dynamic middle block based on document type */}
            {printType === 'entrada' ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-amber-50/30 border-dashed text-slate-700 print:bg-white space-y-3">
                <div>
                  <p className="font-bold text-[10px] uppercase text-amber-800 mb-1">Anotações de Estado Físico / Danos / Arranhões:</p>
                  <p className="text-[11px] italic text-slate-800">
                    {order.physicalCondition || 'Sem avarias externas ou arranhões visíveis relatados.'}
                  </p>
                </div>
                {order.observations && (
                  <div>
                    <p className="font-bold text-[10px] uppercase text-indigo-800 mb-1">Observações da Entrada:</p>
                    <p className="text-[11px] italic text-slate-800">{order.observations}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {(order.physicalCondition || order.observations) && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-amber-50/10 text-slate-700 print:bg-white grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {order.physicalCondition && (
                      <div>
                        <p className="font-bold text-[9px] uppercase text-slate-500 mb-1">🔍 Estado Físico / Danos / Arranhões na Entrada:</p>
                        <p className="text-[10px] text-slate-700">{order.physicalCondition}</p>
                      </div>
                    )}
                    {order.observations && (
                      <div>
                        <p className="font-bold text-[9px] uppercase text-slate-500 mb-1">📝 Observações Gerais da Entrada:</p>
                        <p className="text-[10px] text-slate-700">{order.observations}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cost Detail Table (Show only on Budget and Withdrawal receipts) */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 text-[10px] uppercase border-b border-slate-200">
                      {printType === 'retirada' ? 'Serviços Prestados e Peças Aplicadas' : 'Itens, Peças e Mão de Obra Orçados'}
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <th className="py-2 px-4">Item / Descrição do Componente ou Serviço</th>
                          <th className="py-2 px-4 text-center">Tipo</th>
                          <th className="py-2 px-4 text-center">Qtd</th>
                          <th className="py-2 px-4 text-right">Unitário</th>
                          <th className="py-2 px-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* Labor Cost Row */}
                        {order.laborCost > 0 && (
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">Serviço de Mão de Obra Técnica</td>
                            <td className="py-2.5 px-4 text-center text-slate-500 font-bold uppercase text-[9px]">Serviço</td>
                            <td className="py-2.5 px-4 text-center text-slate-600">1</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatBRL(order.laborCost)}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatBRL(order.laborCost)}</td>
                          </tr>
                        )}
                        {/* Applied Parts Rows */}
                        {order.parts.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{p.name}</td>
                            <td className="py-2.5 px-4 text-center text-slate-500 font-bold uppercase text-[9px]">Peça</td>
                            <td className="py-2.5 px-4 text-center text-slate-600">{p.quantity}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatBRL(p.unitPrice)}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-800">{formatBRL(p.quantity * p.unitPrice)}</td>
                          </tr>
                        ))}
                        {/* If no parts and no labor */}
                        {order.parts.length === 0 && order.laborCost === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 italic">Nenhum valor lançado neste orçamento.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Total and Settle Status block */}
                    {printType === 'retirada' ? (
                      <div className="bg-emerald-800 text-white p-4 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-t print:border-slate-300">
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase tracking-wider text-emerald-200 print:text-slate-500">Situação de Pagamento:</span>
                          <strong className="text-xs uppercase font-extrabold text-white print:text-slate-900">
                            {order.isPaid ? '✓ QUITADO E LIQUIDADO EM CAIXA' : '⚠ VALOR PENDENTE / COBRANÇA EM CONTA'}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-200 block font-bold print:text-slate-500">VALOR TOTAL:</span>
                          <strong className="text-base font-black tracking-tight">{formatBRL(order.totalCost)}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-t print:border-slate-300">
                        <span className="font-black text-xs uppercase tracking-wider print:text-slate-700">Valor Total do Orçamento:</span>
                        <strong className="text-base font-black tracking-tight">{formatBRL(order.totalCost)}</strong>
                      </div>
                    )}
                  </div>
              </>
            )}

            {/* Terms and warranty info */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 text-[10px] text-slate-500 leading-relaxed space-y-1.5 print:bg-white">
              <h5 className="font-bold text-slate-600 uppercase text-[9px] flex items-center gap-1">
                <ShieldCheck size={12} className="text-slate-400" /> Termos de Garantia e Condições Gerais
              </h5>
              {printType === 'entrada' ? (
                <>
                  <p>1. O cliente autoriza a realização de testes, desmontagem e análise preliminar de hardware/software necessários para detecção de defeitos.</p>
                  <p>2. A oficina não se responsabiliza por perda de dados, mídias, backups ou arquivos gravados no dispositivo. Recomenda-se prévio backup por parte do cliente.</p>
                  <p>3. Aparelhos sob análise não retirados em até 90 dias após emissão deste termo estarão sujeitos a alienação operacional para cobertura de custos operacionais conforme Código Civil Brasileiro Art. 1238.</p>
                </>
              ) : (
                <>
                  <p>1. O orçamento apresentado tem validade improrrogável de 10 (dez) dias corridos a partir da data de sua emissão.</p>
                  <p>2. Os serviços prestados e peças novas aplicadas gozam de garantia legal de 90 (noventa) dias, sob condições normais de uso e conservação.</p>
                  <p>3. A garantia técnica será integralmente invalidada em caso de violação de lacres de segurança interna, danos provocados por queda, infiltração de líquidos, surtos elétricos ou intervenção realizada por terceiros.</p>
                </>
              )}
            </div>

            {/* Dynamic Signature fields based on printType */}
            {printType === 'entrada' ? (
              <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">Responsável pela Entrega (Cliente)</p>
                  <p>Assinatura / Data: ____/____/2026</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">Responsável pelo Recebimento (Oficina)</p>
                  <p>EletroOS Manutenção e Reparos Técnicos</p>
                </div>
              </div>
            ) : printType === 'retirada' ? (
              <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">Equipamento Retirado por (Cliente)</p>
                  <p>Assinatura / RG: ____________________________________</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">Equipamento Entregue por (Técnico)</p>
                  <p>Oficina de Reparos Especializada</p>
                </div>
              </div>
            ) : (
              <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">Autorizo a Execução do Serviço</p>
                  <p>Assinatura do Cliente / Data: ____/____/2026</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-4/5 mx-auto"></div>
                  <p className="font-bold uppercase text-slate-700">ELETRO OS - Técnico Responsável</p>
                  <p>Oficina de Reparos Especializada</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
