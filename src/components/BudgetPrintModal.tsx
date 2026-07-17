import React from 'react';
import { createPortal } from 'react-dom';
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

  const renderDocumentCopy = (copyType: 'oficina' | 'cliente') => {
    return (
      <div className={`space-y-4 print:space-y-3 flex-1 flex flex-col justify-between ${
        copyType === 'cliente' 
          ? 'lg:pl-6 print:pl-5' 
          : 'lg:pr-6 print:pr-5'
      }`}>
        <div className="space-y-4 print:space-y-2.5">
          {/* Header / Business details */}
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-3 print:pb-1.5">
            <div>
              <h1 className="text-lg print:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                ELETRO<span className="text-indigo-600">OS</span>
              </h1>
              <p className="text-[9px] print:text-[7px] uppercase font-bold text-slate-500 tracking-wider">Oficina de Eletrônica e Manutenção</p>
              <div className="mt-1 text-slate-500 leading-snug text-[9px] print:text-[7.5px]">
                <p>Av. Principal, 1500 - Centro - São Paulo/SP</p>
                <p>CNPJ: 12.345.678/0001-90 • Inscr. Est: Isenta</p>
                <p>Contato: (11) 98765-4321 • contato@eletroos.com.br</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-slate-100 px-3 py-1 rounded border border-slate-200 inline-block print:py-0.5 print:px-2">
                <p className="text-[8px] print:text-[7px] text-slate-400 uppercase font-black leading-none">Nº da OS</p>
                <p className="text-sm print:text-xs font-black text-indigo-700 leading-tight">{order.id}</p>
              </div>
              <div className="mt-1 text-slate-500 text-[9px] print:text-[7.5px] leading-tight">
                <p><strong>Emissão:</strong> {formattedDate}</p>
                {printType !== 'entrada' && (
                  <p><strong>Previsão:</strong> {formattedDueDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Title & Copy Indicator */}
          <div className="flex justify-between items-center bg-slate-900 text-white py-1.5 px-3 rounded uppercase tracking-wider font-extrabold text-[10px] print:text-[8px] print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
            <span>{docHeader.title}</span>
            <span className="text-[9px] print:text-[7.5px] px-1.5 py-0.5 bg-indigo-600 rounded text-white print:bg-slate-200 print:text-slate-800 print:font-black">
              {copyType === 'oficina' ? 'Via da Oficina' : 'Via do Cliente'}
            </span>
          </div>

          {/* Conditionally render dynamic receipt description */}
          {printType === 'entrada' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] print:text-[8.5px] leading-relaxed space-y-1 print:bg-white print:border-slate-100 print:p-2">
              <p className="font-semibold text-slate-800">Declaração de Recebimento de Equipamento:</p>
              <p>Confirmamos, para os devidos fins legais, que recebemos em nossa assistência técnica especializada o equipamento abaixo descrito para fins de avaliação detalhada em laboratório, diagnóstico de falhas, testes eletrônicos e posterior emissão do respectivo orçamento de reparo.</p>
              <p className="text-[9px] print:text-[7.5px] text-slate-500 italic leading-none">Previsão para retorno com parecer técnico completo: de 24 a 48 horas úteis.</p>
            </div>
          )}

          {printType === 'retirada' && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-[10px] print:text-[8.5px] leading-relaxed space-y-1 print:bg-white print:border-slate-100 print:p-2">
              <p className="font-semibold text-emerald-800">Termo de Retirada e Quitação Definitiva:</p>
              <p>Declaramos que o equipamento especificado neste documento foi devidamente consertado, calibrado e submetido a rigorosos testes de bancada, encontrando-se em perfeito e pleno estado de funcionamento técnico. O cliente outorga ampla e irrevogável quitação de valores e retira o equipamento em perfeitas condições estéticas e operacionais nesta data.</p>
            </div>
          )}

          {/* Customer Details Block */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60 print:bg-white print:p-2 print:border-slate-150">
            <div>
              <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Cliente</p>
              <p className="font-bold text-slate-800 text-[10.5px] print:text-[9px] mt-0.5 truncate">{order.clientName}</p>
              <p className="text-slate-500 text-[9px] print:text-[8px]">CPF: {client?.cpf || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Telefone / E-mail</p>
              <p className="font-semibold text-slate-700 text-[10px] print:text-[8.5px] mt-0.5">{order.clientPhone}</p>
              <p className="text-slate-500 text-[9px] print:text-[8px] truncate">{client?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Endereço do Cliente</p>
              {client?.address ? (
                <div className="text-slate-700 mt-0.5 text-[9px] print:text-[8px] leading-tight">
                  <p className="font-semibold truncate">{client.address}, {client.number || 'S/N'}</p>
                  {client.complement && <p className="text-slate-500 truncate text-[8px]">{client.complement}</p>}
                  <p className="text-slate-500 truncate">{client.neighborhood && `${client.neighborhood} - `}{client.city}/{client.state}</p>
                </div>
              ) : (
                <div className="text-slate-600 mt-0.5 text-[9px] print:text-[8px]">
                  <p className="font-medium">Cadastro regularizado</p>
                  <p className="text-slate-400 text-[8px] italic">Registrado na base</p>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Details Block */}
          <div className="border border-slate-200 rounded-lg overflow-hidden print:border-slate-150">
            <div className="bg-slate-100 px-3 py-1 font-bold text-slate-700 text-[9px] print:text-[7.5px] uppercase border-b border-slate-200 print:px-2 print:py-0.5">
              Informações do Equipamento
            </div>
            <div className="grid grid-cols-4 gap-2 p-3 text-[10px] print:text-[8.5px] print:p-2">
              <div>
                <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Aparelho</p>
                <p className="font-bold text-slate-800 mt-0.5 truncate">{order.equipment}</p>
              </div>
              <div>
                <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Marca</p>
                <p className="font-semibold text-slate-700 mt-0.5 truncate">{order.brand || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Modelo</p>
                <p className="font-semibold text-slate-700 mt-0.5 truncate">{order.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] print:text-[7px] uppercase font-bold text-slate-400">Nº de Série</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">{order.serialNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Reported Problem & Technical Diagnosis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 print:bg-white print:p-2 print:border-slate-150">
              <h4 className="font-bold text-slate-700 uppercase text-[8.5px] print:text-[7px] tracking-wider mb-1 flex items-center gap-1 leading-none">
                ❌ Problema Relatado
              </h4>
              <p className="text-slate-600 leading-relaxed italic text-[10px] print:text-[8.5px] line-clamp-3">
                "{order.reportedProblem}"
              </p>
            </div>
            
            {printType !== 'entrada' ? (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 print:bg-white print:p-2 print:border-slate-150">
                <h4 className="font-bold text-indigo-900 uppercase text-[8.5px] print:text-[7px] tracking-wider mb-1 flex items-center gap-1 leading-none">
                  🔧 Diagnóstico Técnico
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium text-[10px] print:text-[8.5px] line-clamp-3">
                  {order.technicalReport || 'Conserto e testes de componentes executados com sucesso.'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 print:bg-white print:p-2 print:border-slate-150 flex flex-col justify-center">
                <h4 className="font-bold text-slate-500 uppercase text-[8.5px] print:text-[7px] tracking-wider mb-1 leading-none">
                  ⚙️ Estado na Entrada
                </h4>
                <p className="text-slate-500 text-[10px] print:text-[8.5px] leading-relaxed italic line-clamp-3">
                  Aparelho aguardando testes de laboratório e avaliação inicial.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic middle block based on document type */}
          {printType === 'entrada' ? (
            <div className="border border-slate-200 rounded-lg p-3 bg-amber-50/30 border-dashed text-slate-700 print:bg-white print:p-2 print:border-slate-150 space-y-2 print:space-y-1">
              <div>
                <p className="font-bold text-[9px] print:text-[7px] uppercase text-amber-800 mb-0.5">Anotações de Estado Físico / Danos / Arranhões:</p>
                <p className="text-[10px] print:text-[8.5px] italic text-slate-800 line-clamp-2">
                  {order.physicalCondition || 'Sem avarias externas ou arranhões visíveis relatados.'}
                </p>
              </div>
              {order.observations && (
                <div>
                  <p className="font-bold text-[9px] print:text-[7px] uppercase text-indigo-800 mb-0.5">Observações da Entrada:</p>
                  <p className="text-[10px] print:text-[8.5px] italic text-slate-800 line-clamp-2">{order.observations}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {(order.physicalCondition || order.observations) && (
                <div className="border border-slate-200 rounded-lg p-3 bg-amber-50/10 text-slate-700 print:bg-white print:p-2 print:border-slate-150 grid grid-cols-2 gap-3">
                  {order.physicalCondition ? (
                    <div>
                      <p className="font-bold text-[8px] print:text-[7px] uppercase text-slate-500 mb-0.5">🔍 Estado Físico / Danos / Arranhões:</p>
                      <p className="text-[9.5px] print:text-[8px] text-slate-700 line-clamp-2">{order.physicalCondition}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-[8px] print:text-[7px] uppercase text-slate-500 mb-0.5">🔍 Estado Físico:</p>
                      <p className="text-[9.5px] print:text-[8px] text-slate-400 italic line-clamp-2">Sem avarias relatadas.</p>
                    </div>
                  )}
                  {order.observations && (
                    <div>
                      <p className="font-bold text-[8px] print:text-[7px] uppercase text-slate-500 mb-0.5">📝 Observações Gerais:</p>
                      <p className="text-[9.5px] print:text-[8px] text-slate-700 line-clamp-2">{order.observations}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Cost Detail Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden print:border-slate-150">
                <div className="bg-slate-100 px-3 py-1 font-bold text-slate-700 text-[9px] print:text-[7.5px] uppercase border-b border-slate-200 print:px-2 print:py-0.5">
                  {printType === 'retirada' ? 'Serviços Prestados e Peças Aplicadas' : 'Itens, Peças e Mão de Obra Orçados'}
                </div>
                <table className="w-full text-left border-collapse text-[10px] print:text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 print:border-slate-150">
                      <th className="py-1 px-3 print:px-1.5">Descrição</th>
                      <th className="py-1 px-3 print:px-1.5 text-center">Tipo</th>
                      <th className="py-1 px-3 print:px-1.5 text-center">Qtd</th>
                      <th className="py-1 px-3 print:px-1.5 text-right">Unitário</th>
                      <th className="py-1 px-3 print:px-1.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-150">
                    {/* Labor Cost Row */}
                    {order.laborCost > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 font-semibold text-slate-850">Mão de Obra Técnica</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-center text-slate-500 font-bold uppercase text-[8px] print:text-[7px]">Serviço</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-center text-slate-600">1</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-right text-slate-600">{formatBRL(order.laborCost)}</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-right font-bold text-slate-800">{formatBRL(order.laborCost)}</td>
                      </tr>
                    )}
                    {/* Applied Parts Rows */}
                    {order.parts.slice(0, 5).map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 font-medium text-slate-800 truncate max-w-[120px]">{p.name}</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-center text-slate-500 font-bold uppercase text-[8px] print:text-[7px]">Peça</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-center text-slate-600">{p.quantity}</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-right text-slate-600">{formatBRL(p.unitPrice)}</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-1.5 text-right font-semibold text-slate-800">{formatBRL(p.quantity * p.unitPrice)}</td>
                      </tr>
                    ))}
                    {/* If more parts, show a summary row */}
                    {order.parts.length > 5 && (
                      <tr>
                        <td colSpan={5} className="py-1 px-3 text-center text-slate-400 italic text-[9px] print:text-[8px]">
                          + {order.parts.length - 5} outras peças detalhadas no sistema.
                        </td>
                      </tr>
                    )}
                    {/* If no parts and no labor */}
                    {order.parts.length === 0 && order.laborCost === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">Nenhum valor lançado neste orçamento.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Total and Settle Status block */}
                {printType === 'retirada' ? (
                  <div className="bg-emerald-800 text-white p-2.5 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-t print:border-slate-300">
                    <div className="flex flex-col">
                      <span className="font-black text-[8px] print:text-[7px] uppercase tracking-wider text-emerald-200 print:text-slate-500">Situação de Pagamento:</span>
                      <strong className="text-[9px] print:text-[8px] uppercase font-extrabold text-white print:text-slate-900 leading-tight">
                        {order.isPaid ? '✓ QUITADO EM CAIXA' : '⚠ COBRANÇA EM CONTA'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] print:text-[7px] text-emerald-200 block font-bold print:text-slate-500">VALOR TOTAL:</span>
                      <strong className="text-sm font-black tracking-tight">{formatBRL(order.totalCost)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 text-white p-2.5 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border-t print:border-slate-300">
                    <span className="font-black text-[9px] print:text-[7.5px] uppercase tracking-wider print:text-slate-700">Valor Total do Orçamento:</span>
                    <strong className="text-sm font-black tracking-tight">{formatBRL(order.totalCost)}</strong>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Terms and warranty info */}
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 text-[8.5px] print:text-[7px] text-slate-500 leading-relaxed space-y-1 print:bg-white print:p-2 print:border-slate-150">
            <h5 className="font-bold text-slate-600 uppercase text-[8px] print:text-[7px] flex items-center gap-1 leading-none">
              <ShieldCheck size={10} className="text-slate-400" /> Termos de Garantia e Condições Gerais
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
        </div>

        {/* Dynamic Signature fields based on printType */}
        {printType === 'entrada' ? (
          <div className="pt-4 print:pt-2 grid grid-cols-2 gap-4 text-[9px] print:text-[7px] text-slate-500">
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">Responsável pela Entrega (Cliente)</p>
              <p>Assinatura / Data: ____/____/2026</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">Responsável pelo Recebimento (Oficina)</p>
              <p>EletroOS Manutenção e Reparos Técnicos</p>
            </div>
          </div>
        ) : printType === 'retirada' ? (
          <div className="pt-4 print:pt-2 grid grid-cols-2 gap-4 text-[9px] print:text-[7px] text-slate-500">
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">Equipamento Retirado por (Cliente)</p>
              <p>Assinatura / RG: ________________________</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">Equipamento Entregue por (Técnico)</p>
              <p>Oficina de Reparos Especializada</p>
            </div>
          </div>
        ) : (
          <div className="pt-4 print:pt-2 grid grid-cols-2 gap-4 text-[9px] print:text-[7px] text-slate-500">
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">Autorizo a Execução do Serviço</p>
              <p>Assinatura do Cliente / Data: ____/____/2026</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-t border-slate-400 pt-1 w-4/5 mx-auto"></div>
              <p className="font-bold uppercase text-slate-700 leading-none text-[8.5px] print:text-[7px]">ELETRO OS - Técnico Responsável</p>
              <p>Oficina de Reparos Especializada</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-h-none print:rounded-none">
        
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
              <Printer size={14} /> Imprimir em Paisagem (Duas Vias)
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
            1. Recibo de Entrada (Duas Vias)
          </button>
          <button
            onClick={() => setPrintType('orcamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              printType === 'orcamento'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            2. Orçamento Técnico (Duas Vias)
          </button>
          <button
            onClick={() => setPrintType('retirada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              printType === 'retirada'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            3. Recibo de Retirada (Duas Vias)
          </button>
        </div>

        {/* Printable Document Area */}
        <div className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          <style>{`
            @media print {
              #root {
                display: none !important;
              }
              @page {
                size: A4 landscape !important;
                margin: 5mm 6mm !important;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .fixed {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                padding: 0 !important;
              }
              .print\\:hidden, .print-hidden {
                display: none !important;
              }
              #print-area {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                background: white !important;
              }
            }
          `}</style>
          
          <div 
            id="print-area" 
            className="bg-white border border-slate-200 shadow-xl p-6 lg:p-8 w-full max-w-6xl mx-auto rounded-xl font-sans text-xs text-slate-800 relative print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none"
          >
            {/* Side-by-side Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative divide-y lg:divide-y-0 lg:divide-x lg:divide-dashed divide-slate-350 print:grid-cols-2 print:gap-10 print:divide-y-0 print:divide-x print:divide-dashed print:divide-slate-400 print:items-stretch">
              {/* Copy 1: Via da Oficina (Eletrônica) */}
              {renderDocumentCopy('oficina')}

              {/* Copy 2: Via do Cliente */}
              {renderDocumentCopy('cliente')}
            </div>

            {/* Dotted cutting divider line with scissors icon for on-screen decoration */}
            <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-between py-6 pointer-events-none print:flex">
              <div className="border-l border-dashed border-slate-300 h-full w-0 flex items-center justify-center relative">
                <span className="absolute bg-white px-2 py-0.5 border border-slate-200 rounded-md text-[8px] font-bold text-slate-400 flex items-center gap-1 shadow-xs uppercase tracking-wider rotate-90 lg:rotate-0 print:border-slate-300">
                  ✂️ Recorte
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
