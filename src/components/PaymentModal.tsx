import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  CreditCard, 
  Coins, 
  Smartphone, 
  Printer, 
  MessageSquare,
  Sparkles,
  Award,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ServiceOrder, PaymentItem, Client } from '../types';
import { formatBRL, getWhatsAppLink } from '../utils';

interface PaymentModalProps {
  order: ServiceOrder;
  clients: Client[];
  onClose: () => void;
  onConfirmPayment: (
    orderId: string,
    payments: PaymentItem[],
    updatedWalletBalance?: number,
    updatedEquipmentDetails?: { equipment: string; brand: string; model: string; serialNumber: string }
  ) => void;
}

export default function PaymentModal({
  order,
  clients,
  onClose,
  onConfirmPayment
}: PaymentModalProps) {
  // Find associated client
  const client = useMemo(() => {
    return clients.find(c => c.id === order.clientId) || null;
  }, [clients, order]);

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira'>('pix');
  const [amountInput, setAmountInput] = useState<string>('');
  const [addedPayments, setAddedPayments] = useState<PaymentItem[]>([]);
  const [paymentFinished, setPaymentFinished] = useState(false);

  // Editable equipment states
  const [equipment, setEquipment] = useState(order.equipment || '');
  const [brand, setBrand] = useState(order.brand || '');
  const [model, setModel] = useState(order.model || '');
  const [serialNumber, setSerialNumber] = useState(order.serialNumber || '');
  const [intakeError, setIntakeError] = useState('');

  // Installment states for Carteira Própria
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default to 30 days from now
    return d.toISOString().split('T')[0];
  });

  // Automatically generate installment list
  const generatedInstallments = useMemo(() => {
    const list: { number: number; dueDate: string; amount: number }[] = [];
    if (!firstInstallmentDate || installmentsCount < 1) return list;
    
    const amount = parseFloat(amountInput) || 0;
    if (amount <= 0) return list;
    
    const partAmount = parseFloat((amount / installmentsCount).toFixed(2));
    const [year, month, day] = firstInstallmentDate.split('-').map(Number);
    
    let sumPaid = 0;
    for (let i = 0; i < installmentsCount; i++) {
      const isLast = i === installmentsCount - 1;
      const installmentAmount = isLast ? parseFloat((amount - sumPaid).toFixed(2)) : partAmount;
      sumPaid += installmentAmount;

      const date = new Date(year, month - 1 + i, 1);
      const maxDays = new Date(year, month + i, 0).getDate();
      const targetDay = Math.min(day, maxDays);
      date.setDate(targetDay);
      
      const yStr = date.getFullYear();
      const mStr = String(date.getMonth() + 1).padStart(2, '0');
      const dStr = String(date.getDate()).padStart(2, '0');
      
      list.push({
        number: i + 1,
        dueDate: `${yStr}-${mStr}-${dStr}`,
        amount: installmentAmount
      });
    }
    return list;
  }, [amountInput, installmentsCount, firstInstallmentDate]);

  // Total paid so far
  const totalPaid = useMemo(() => {
    return addedPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [addedPayments]);

  // Remaining balance to be paid
  const remainingToPay = useMemo(() => {
    const diff = order.totalCost - totalPaid;
    return diff > 0 ? diff : 0;
  }, [order.totalCost, totalPaid]);

  // Set default amount to remaining amount
  useMemo(() => {
    if (!paymentFinished) {
      setAmountInput(remainingToPay.toFixed(2));
    }
  }, [remainingToPay, paymentFinished]);

  // Handler: Add Payment option split
  const handleAddPayment = () => {
    const amount = parseFloat(amountInput) || 0;
    if (amount <= 0) {
      alert('Insira um valor maior que zero.');
      return;
    }
    if (amount > remainingToPay + 0.01) {
      alert(`O valor inserido (${formatBRL(amount)}) excede o saldo restante para pagamento (${formatBRL(remainingToPay)}).`);
      return;
    }

    // Wallet balance limit check
    if (selectedMethod === 'carteira' && client) {
      if (!isInstallment) {
        if (client.walletBalance < amount) {
          alert(`O cliente não possui saldo suficiente na Carteira própria. Saldo atual: ${formatBRL(client.walletBalance)}`);
          return;
        }
      }
    }

    const newItem: PaymentItem = {
      method: selectedMethod,
      amount: amount,
      timestamp: new Date().toISOString(),
      ...(selectedMethod === 'carteira' && isInstallment ? {
        installmentsCount: installmentsCount,
        firstInstallmentDueDate: firstInstallmentDate,
        installmentsList: generatedInstallments.map(inst => ({
          number: inst.number,
          dueDate: inst.dueDate,
          amount: inst.amount,
          status: 'pendente'
        }))
      } : {})
    };

    setAddedPayments(prev => [...prev, newItem]);
    setAmountInput('');
    setIsInstallment(false); // Reset to false after adding
  };

  // Handler: Remove split
  const handleRemovePayment = (index: number) => {
    setAddedPayments(prev => prev.filter((_, i) => i !== index));
  };

  // Handler: Confirm full settlement
  const handleFinishPayment = () => {
    if (!equipment.trim()) {
      setIntakeError('Por favor, preencha o nome do equipamento para confirmar a entrega.');
      return;
    }
    setIntakeError('');

    if (Math.abs(totalPaid - order.totalCost) > 0.05) {
      alert(`Para finalizar, o total pago (${formatBRL(totalPaid)}) deve ser igual ao total da OS (${formatBRL(order.totalCost)}).`);
      return;
    }

    // Calculate updated wallet balance if wallet was used
    let updatedWalletBalance = client ? client.walletBalance : 0;
    const walletUsed = addedPayments.find(p => p.method === 'carteira');
    if (walletUsed && client) {
      updatedWalletBalance = client.walletBalance - walletUsed.amount;
    }

    onConfirmPayment(order.id, addedPayments, updatedWalletBalance, {
      equipment: equipment.trim(),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim()
    });
    setPaymentFinished(true);
  };

  // Formatted receipt text for WhatsApp sharing
  const whatsAppMessage = useMemo(() => {
    if (!client) return '';
    const paymentMethodsList = addedPayments.map(p => {
      let methodLabel = p.method.toUpperCase();
      if (p.method === 'cartao_credito') methodLabel = 'CARTÃO DE CRÉDITO';
      if (p.method === 'cartao_debito') methodLabel = 'CARTÃO DE DÉBITO';
      if (p.method === 'carteira') {
        methodLabel = 'CARTEIRA PRÓPRIA';
        if (p.installmentsCount && p.installmentsList) {
          const installmentLines = p.installmentsList.map(inst => 
            `   └ Parcela ${inst.number}: ${new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')} - ${formatBRL(inst.amount)}`
          ).join('\n');
          return `- ${methodLabel} (Parcelado ${p.installmentsCount}x):\n${installmentLines}`;
        }
      }
      return `- ${methodLabel}: ${formatBRL(p.amount)}`;
    }).join('\n');

    return `*ELETRO OS - RECIBO DE PAGAMENTO*\n\n` +
      `Olá, *${client.name}*!\n` +
      `Confirmamos a liquidação da *${order.id}*.\n\n` +
      `*Aparelho:* ${equipment} ${brand} ${model}\n` +
      `*Valor Total:* ${formatBRL(order.totalCost)}\n\n` +
      `*Detalhamento de Pagamento:*\n${paymentMethodsList}\n\n` +
      `Seu aparelho já está liberado para retirada na nossa oficina eletrônica.\n` +
      `Muito obrigado pela confiança! 🛠️⚡`;
  }, [order, client, addedPayments, equipment, brand, model]);

  const whatsappLink = useMemo(() => {
    if (!client) return '';
    return getWhatsAppLink(client.phone, whatsAppMessage);
  }, [client, whatsAppMessage]);

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <style>{`
        @media print {
          #root {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100" id="modal-pagamento">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Coins size={16} className="text-amber-400 animate-spin" /> Liquidação de Conta & Pagamento Múltiplo
            </h3>
            <p className="text-[10px] text-slate-300">Ordens de Serviço • {order.id}</p>
          </div>
          {!paymentFinished && (
            <button onClick={onClose} className="text-slate-400 hover:text-white font-bold cursor-pointer text-xs">
              ✕
            </button>
          )}
        </div>

        {!paymentFinished ? (
          /* Active payment process */
          <div className="p-5 space-y-4 text-xs">
            
            {/* Total banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Valor Total da OS</p>
                <p className="text-xl font-black">{formatBRL(order.totalCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Falta Pagar</p>
                <p className="text-xl font-black text-rose-400">{formatBRL(remainingToPay)}</p>
              </div>
            </div>

            {/* Client wallet indicator if available */}
            {client && client.walletBalance > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg flex justify-between items-center">
                <span>Saldo disponível na <strong>Carteira própria</strong> do cliente:</span>
                <strong className="font-bold text-amber-950">{formatBRL(client.walletBalance)}</strong>
              </div>
            )}

            {/* Editable Equipment Intake section to validate device details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
              <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider flex items-center gap-1">
                🔧 Confirmar / Atualizar Detalhes do Aparelho
              </p>
              
              {intakeError && (
                <p className="text-rose-600 font-bold text-[10px] bg-rose-50 p-1.5 rounded border border-rose-100 animate-pulse" id="intake-error-msg">
                  ⚠️ {intakeError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="intake-equipment-input" className="block text-[10px] font-bold text-slate-500 mb-0.5">Equipamento:</label>
                  <input
                    id="intake-equipment-input"
                    type="text"
                    value={equipment}
                    onChange={(e) => {
                      setEquipment(e.target.value);
                      setIntakeError('');
                    }}
                    placeholder="Tipo de Equipamento"
                    className="w-full border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="intake-brand-input" className="block text-[10px] font-bold text-slate-500 mb-0.5">Marca:</label>
                  <input
                    id="intake-brand-input"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Marca"
                    className="w-full border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="intake-model-input" className="block text-[10px] font-bold text-slate-500 mb-0.5">Modelo:</label>
                  <input
                    id="intake-model-input"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Modelo"
                    className="w-full border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="intake-serial-input" className="block text-[10px] font-bold text-slate-500 mb-0.5">Número de Série:</label>
                  <input
                    id="intake-serial-input"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="S/N"
                    className="w-full border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Add Payment Method block */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-700">Compor Formas de Pagamento:</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                
                {/* Method selector */}
                <div className="sm:col-span-6">
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-xs text-slate-800"
                  >
                    <option value="pix">🔵 PIX Online</option>
                    <option value="cartao_credito">💳 Cartão de Crédito</option>
                    <option value="cartao_debito">💳 Cartão de Débito</option>
                    <option value="dinheiro">💵 Dinheiro (Espécie)</option>
                    <option value="carteira">🎒 Carteira Própria (Saldo Loja)</option>
                  </select>
                </div>

                {/* Value input */}
                <div className="sm:col-span-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-xs"
                  />
                </div>

                {/* Add button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-full h-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold transition-all p-2 cursor-pointer"
                    title="Adicionar fração de pagamento"
                  >
                    <Plus size={16} />
                  </button>
                </div>

              </div>

              {/* Installment options for Carteira Própria */}
              {selectedMethod === 'carteira' && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Aceitar Pagamento Parcelado</span>
                  </label>

                  {isInstallment && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qtd de Parcelas:</label>
                          <input
                            type="number"
                            min="2"
                            max="36"
                            value={installmentsCount}
                            onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vencimento da 1ª Parcela:</label>
                          <input
                            type="date"
                            value={firstInstallmentDate}
                            onChange={(e) => setFirstInstallmentDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-xs"
                          />
                        </div>
                      </div>

                      {/* Displaying generated installment plan */}
                      {generatedInstallments.length > 0 && (
                        <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60 space-y-1">
                          <p className="font-bold text-[10px] text-indigo-800 uppercase tracking-wider mb-1.5">Grade de Parcelas Geradas:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-700 max-h-24 overflow-y-auto bg-white/80 p-2 rounded border border-indigo-100/30">
                            {generatedInstallments.map((inst) => (
                              <div key={inst.number} className="flex justify-between border-b border-slate-200/50 pb-0.5">
                                <span>Parc. {inst.number}:</span>
                                <span className="font-semibold text-indigo-700">
                                  {new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')} - {formatBRL(inst.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Added Splits Checklist */}
            <div className="space-y-2">
              <p className="font-bold text-slate-600">Composição do Pagamento ({addedPayments.length}):</p>
              {addedPayments.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  Nenhuma forma de pagamento adicionada à composição ainda.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {addedPayments.map((pay, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        {pay.method === 'pix' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        {pay.method === 'dinheiro' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        {pay.method === 'carteira' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                        {(pay.method === 'cartao_credito' || pay.method === 'cartao_debito') && <span className="w-2 h-2 rounded-full bg-purple-500"></span>}
                        <span className="font-semibold text-slate-800 uppercase text-[11px] flex flex-wrap items-center gap-1">
                          {pay.method === 'pix' && 'PIX'}
                          {pay.method === 'cartao_credito' && 'Cartão de Crédito'}
                          {pay.method === 'cartao_debito' && 'Cartão de Débito'}
                          {pay.method === 'dinheiro' && 'Dinheiro (Espécie)'}
                          {pay.method === 'carteira' && (
                            <span>
                              Carteira Própria {pay.installmentsCount ? `(${pay.installmentsCount}x)` : ''}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <strong className="text-slate-900 font-bold">{formatBRL(pay.amount)}</strong>
                        <button
                          onClick={() => handleRemovePayment(i)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                disabled={remainingToPay > 0}
                onClick={handleFinishPayment}
                className={`px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  remainingToPay > 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <CheckCircle size={14} /> Confirmar e Dar Baixa
              </button>
            </div>

          </div>
        ) : (
          /* Payment success screen & Receipt options */
          <div className="p-6 space-y-5 text-xs text-center" id="recibo-sucesso">
            
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full text-emerald-600 flex items-center justify-center border border-emerald-200 animate-bounce">
              <CheckCircle size={28} />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800">Pagamento Liquidado com Sucesso!</h4>
              <p className="text-slate-500 mt-0.5">Ordem de Serviço {order.id} quitada e atualizada.</p>
            </div>

            {/* Printable virtual invoice receipt container */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-[10px] space-y-2 select-all print:block">
              <p className="text-center font-bold border-b border-dashed border-slate-300 pb-1 uppercase">ELETRO OS - COMPROVANTE</p>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-bold">{client?.name.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>EQUIPAMENTO:</span>
                <span className="font-bold">{equipment.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>OS NÚMERO:</span>
                <span className="font-bold">{order.id}</span>
              </div>
              <hr className="border-dashed border-slate-300 my-1" />
              <div className="space-y-1">
                <p className="font-semibold">DETALHAMENTO DO PAGAMENTO:</p>
                {addedPayments.map((p, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between pl-2">
                      <span className="uppercase font-bold">
                        {p.method.replace('_', ' ')}
                        {p.method === 'carteira' && p.installmentsCount ? ` (${p.installmentsCount}x)` : ''}:
                      </span>
                      <span className="font-bold">{formatBRL(p.amount)}</span>
                    </div>
                    {p.method === 'carteira' && p.installmentsList && (
                      <div className="pl-4 text-[9px] text-slate-500 font-mono space-y-0.5">
                        {p.installmentsList.map(inst => (
                          <div key={inst.number} className="flex justify-between">
                            <span>Venc. Parc. {inst.number} ({new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}):</span>
                            <span>{formatBRL(inst.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <hr className="border-dashed border-slate-300 my-1" />
              <div className="flex justify-between font-bold text-[11px]">
                <span>VALOR LIQUIDADO:</span>
                <span>{formatBRL(order.totalCost)}</span>
              </div>
              <p className="text-center text-[8px] text-slate-400 pt-1.5 uppercase">Obrigado pela preferência!</p>
            </div>

            {/* Receipts selection buttons */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} className="text-slate-500" /> Imprimir Via
              </button>
              
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} /> Enviar WhatsApp
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
