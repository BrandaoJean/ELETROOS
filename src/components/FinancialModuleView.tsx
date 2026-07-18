import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingCart, 
  User, 
  Percent, 
  Printer, 
  X, 
  Clock, 
  FileText, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  FileDown,
  ChevronRight,
  Sparkles,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { ServiceOrder, Client, Product, ProductPurchase, FinancialAccountItem, POSSale, POSSaleItem } from '../types';
import { formatBRL } from '../utils';

interface FinancialModuleViewProps {
  orders: ServiceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  purchases: ProductPurchase[];
  onTriggerNotification: (type: 'billing' | 'payment_pending') => void;
  manualAccounts: FinancialAccountItem[];
  setManualAccounts: React.Dispatch<React.SetStateAction<FinancialAccountItem[]>>;
}

export default function FinancialModuleView({
  orders,
  setOrders,
  clients,
  setClients,
  products,
  setProducts,
  purchases,
  onTriggerNotification,
  manualAccounts,
  setManualAccounts
}: FinancialModuleViewProps) {
  // Financial sub-tab navigation
  const [activeSubTab, setActiveSubTab] = useState<'flow' | 'receivable' | 'payable' | 'pos'>('flow');

  // POS sales state (with localStorage persistence)
  const [posSales, setPosSales] = useState<POSSale[]>(() => {
    const saved = localStorage.getItem('eletroos_pos_sales');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'POS-1001',
        clientName: 'Consumidor Final',
        items: [
          { productId: 'p1', name: 'Kit Barras LED Samsung 55"', sku: 'SKU-LED-55', quantity: 1, unitPrice: 180.00, totalPrice: 180.00 }
        ],
        subtotal: 180.00,
        discount: 10.00,
        total: 170.00,
        paymentMethod: 'pix',
        timestamp: '2026-07-12T14:30:00Z'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('eletroos_pos_sales', JSON.stringify(posSales));
  }, [posSales]);

  // POS shopping cart state
  const [posCart, setPosCart] = useState<POSSaleItem[]>([]);
  const [posDiscount, setPosDiscount] = useState<string>('0');
  const [posDiscountType, setPosDiscountType] = useState<'brl' | 'percent'>('brl');
  const [selectedPosClient, setSelectedPosClient] = useState<string>('consumidor_final');
  const [posClientSearch, setPosClientSearch] = useState<string>('');
  const [posProductSearch, setPosProductSearch] = useState<string>('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira'>('pix');
  const [activeReceiptSale, setActiveReceiptSale] = useState<POSSale | null>(null);

  // Forms states
  const [showAddReceivableModal, setShowAddReceivableModal] = useState(false);
  const [showAddPayableModal, setShowAddPayableModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    description: '',
    category: 'Outros',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    clientOrSupplierName: ''
  });

  // Filter & Search states inside lists
  const [payableFilter, setPayableFilter] = useState<'todos' | 'pendente' | 'pago' | 'atrasado'>('todos');
  const [receivableFilter, setReceivableFilter] = useState<'todos' | 'pendente' | 'pago' | 'atrasado'>('todos');
  const [cashFlowSearch, setCashFlowSearch] = useState('');
  const [cashFlowCategory, setCashFlowCategory] = useState('todas');

  // New States for Custom Loose Items & OS Search/Settle
  const [posLooseName, setPosLooseName] = useState('');
  const [posLoosePrice, setPosLoosePrice] = useState('');
  const [posLooseQty, setPosLooseQty] = useState(1);
  const [posOsSearchQuery, setPosOsSearchQuery] = useState('');

  // Find unpaid OS by ID (supporting "OS-1001" or just "1001")
  const foundOS = useMemo(() => {
    if (!posOsSearchQuery.trim()) return null;
    const cleanQuery = posOsSearchQuery.trim().toLowerCase();
    return orders.find(o => 
      !o.isPaid && 
      (o.id.toLowerCase() === cleanQuery || 
       o.id.replace('os-', '').toLowerCase() === cleanQuery)
    ) || null;
  }, [orders, posOsSearchQuery]);

  // Handler to pay and settle the searched OS
  const handlePayFoundOS = () => {
    if (!foundOS) return;
    
    // Process wallet balance check if payment is Carteira Própria
    if (posPaymentMethod === 'carteira') {
      const client = clients.find(c => c.id === foundOS.clientId);
      if (client && client.walletBalance < foundOS.totalCost) {
        const confirmDebit = confirm(`O cliente ${client.name} possui apenas ${formatBRL(client.walletBalance)} na carteira.\nDeseja autorizar a quitação gerando débito de ${formatBRL(client.walletBalance - foundOS.totalCost)} na ficha dele?`);
        if (!confirmDebit) return;
        
        // Deduct from wallet (allow debit/negative balance)
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - foundOS.totalCost } : c));
      } else if (client) {
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - foundOS.totalCost } : c));
      }
    }

    const payItem = {
      method: posPaymentMethod,
      amount: foundOS.totalCost,
      timestamp: new Date().toISOString()
    };

    setOrders(prev => prev.map(o => {
      if (o.id === foundOS.id) {
        return {
          ...o,
          isPaid: true,
          status: 'entregue', // Mark as delivered automatically on cashier payment
          payments: [payItem],
          paymentDate: new Date().toISOString(),
          history: [
            ...o.history,
            {
              timestamp: new Date().toISOString(),
              status: 'entregue',
              note: `OS quitada e entregue via caixa PDV utilizando ${posPaymentMethod.toUpperCase()}.`
            }
          ]
        };
      }
      return o;
    }));

    alert(`OS ${foundOS.id} quitada e encerrada com sucesso via ${posPaymentMethod.toUpperCase()}!`);
    setPosOsSearchQuery('');
  };

  // Pre-determined Categories lists
  const expenseCategories = ['Utilidades', 'Aluguel', 'Fornecedor', 'Comunicações', 'Impostos', 'Marketing', 'Compra de Ativos para Sucata', 'Outros'];
  const revenueCategories = ['Venda OS', 'PDV', 'Reciclagem', 'Serviço Externo', 'Outros'];

  // Current Date Helper - dynamically set to today's date
  const currentDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Helper to check if a due date is past due
  const getAccountStatus = (dueDate: string, currentStatus: 'pendente' | 'pago'): 'pago' | 'pendente' | 'atrasado' => {
    if (currentStatus === 'pago') return 'pago';
    if (new Date(dueDate) < new Date(currentDateStr)) {
      return 'atrasado';
    }
    return 'pendente';
  };

  // 1. DYNAMIC ACCOUNTS RECEIVABLE COMPILATION
  const dynamicReceivables = useMemo(() => {
    const list: FinancialAccountItem[] = [];

    // Retrieve from unpaid Service Orders
    orders.forEach(o => {
      if (!o.isPaid) {
        const isPast = o.dueDate ? new Date(o.dueDate) < new Date(currentDateStr) : false;
        list.push({
          id: `REC-OS-${o.id}`,
          type: 'receber',
          description: `Serviço e Peças - ${o.equipment} (${o.brand})`,
          category: 'Venda OS',
          amount: o.totalCost,
          dueDate: o.dueDate || o.createdAt.split('T')[0],
          status: isPast ? 'atrasado' : 'pendente',
          clientOrSupplierName: o.clientName,
          originId: o.id
        });
      }
    });

    // Add manual receivables
    manualAccounts.filter(acc => acc.type === 'receber').forEach(acc => {
      list.push({
        ...acc,
        status: getAccountStatus(acc.dueDate, acc.status === 'pago' ? 'pago' : 'pendente')
      });
    });

    return list;
  }, [orders, manualAccounts]);

  // 2. DYNAMIC ACCOUNTS PAYABLE COMPILATION
  const dynamicPayables = useMemo(() => {
    const list: FinancialAccountItem[] = [];

    // Add manual payables
    manualAccounts.filter(acc => acc.type === 'pagar').forEach(acc => {
      list.push({
        ...acc,
        status: getAccountStatus(acc.dueDate, acc.status === 'pago' ? 'pago' : 'pendente')
      });
    });

    // Integrate Product Purchases as payables (since we buy from suppliers, let's treat them as Fornecedor payables!)
    purchases.forEach(p => {
      // Assuming purchases are always recorded paid on their purchase date for cashflow, but represent supplier outflow
      list.push({
        id: `PAY-PUR-${p.id}`,
        type: 'pagar',
        description: `Nota Fiscal Compra Peças Nº ${p.invoiceNumber}`,
        category: 'Fornecedor',
        amount: p.totalAmount,
        dueDate: p.purchaseDate,
        paymentDate: p.purchaseDate,
        status: 'pago', // Pre-marked paid as it comes from inventory system purchase receipt
        clientOrSupplierName: p.supplierName,
        originId: p.id
      });
    });

    return list;
  }, [manualAccounts, purchases]);

  // 3. CASH FLOW LEDGER LIST (ALL COMPLETED PAID INFLOWS & OUTFLOWS)
  const cashFlowLedger = useMemo(() => {
    const list: {
      id: string;
      type: 'entrada' | 'saida';
      description: string;
      category: string;
      amount: number;
      date: string;
      paymentMethod: string;
      originId?: string;
      entityName?: string;
    }[] = [];

    // A. Paid Service Orders (Revenues)
    orders.forEach(o => {
      if (o.isPaid) {
        const pDate = o.paymentDate || o.createdAt;
        o.payments.forEach((pay, idx) => {
          list.push({
            id: `CF-OS-${o.id}-${idx}`,
            type: 'entrada',
            description: `Ordem de Serviço ${o.id} - ${o.equipment}`,
            category: 'Venda OS',
            amount: pay.amount,
            date: pDate.split('T')[0],
            paymentMethod: pay.method,
            originId: o.id,
            entityName: o.clientName
          });
        });
      }
    });

    // B. Manual Receivables marked 'pago'
    manualAccounts.forEach(acc => {
      if (acc.type === 'receber' && acc.status === 'pago') {
        list.push({
          id: `CF-MAN-${acc.id}`,
          type: 'entrada',
          description: acc.description,
          category: acc.category,
          amount: acc.amount,
          date: acc.paymentDate || acc.dueDate,
          paymentMethod: acc.paymentMethod || 'pix',
          originId: acc.id,
          entityName: acc.clientOrSupplierName
        });
      }
    });

    // C. POS sales (instantly paid)
    posSales.forEach(sale => {
      list.push({
        id: `CF-POS-${sale.id}`,
        type: 'entrada',
        description: `Venda PDV Balcão - Código: ${sale.id}`,
        category: 'PDV',
        amount: sale.total,
        date: sale.timestamp.split('T')[0],
        paymentMethod: sale.paymentMethod,
        originId: sale.id,
        entityName: sale.clientName
      });
    });

    // D. Manual Payables marked 'pago'
    manualAccounts.forEach(acc => {
      if (acc.type === 'pagar' && acc.status === 'pago') {
        list.push({
          id: `CF-MAN-${acc.id}`,
          type: 'saida',
          description: acc.description,
          category: acc.category,
          amount: acc.amount,
          date: acc.paymentDate || acc.dueDate,
          paymentMethod: acc.paymentMethod || 'pix',
          originId: acc.id,
          entityName: acc.clientOrSupplierName
        });
      }
    });

    // E. Product Purchases (Supplier cash outflows)
    purchases.forEach(p => {
      list.push({
        id: `CF-PUR-${p.id}`,
        type: 'saida',
        description: `Aquisição de Componentes - NF ${p.invoiceNumber}`,
        category: 'Fornecedor',
        amount: p.totalAmount,
        date: p.purchaseDate,
        paymentMethod: 'pix', // Standard assumption
        originId: p.id,
        entityName: p.supplierName
      });
    });

    // Sort by date descending, then id descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, manualAccounts, posSales, purchases]);

  // 4. CASH FLOW SUMMARY METRICS (FOR SELECTABLE RANGE / DEFAULT JULY 2026)
  const cashFlowMetrics = useMemo(() => {
    let totalInflows = 0;
    let totalOutflows = 0;

    cashFlowLedger.forEach(item => {
      const itemDate = new Date(item.date);
      // Filter primarily for July 2026 in simulator
      if (itemDate.getFullYear() === 2026 && itemDate.getMonth() === 6) {
        if (item.type === 'entrada') totalInflows += item.amount;
        else totalOutflows += item.amount;
      }
    });

    return {
      inflow: totalInflows,
      outflow: totalOutflows,
      net: totalInflows - totalOutflows
    };
  }, [cashFlowLedger]);

  // 5. CHART DATA GENERATION: Daily cash flow details for July 2026 (Days 1 to 20 for simulated projection)
  const chartData = useMemo(() => {
    const daysMap: { [day: number]: { dayStr: string; Receitas: number; Despesas: number; Saldo: number } } = {};
    
    // Seed days 1 to 20 of July 2026
    for (let d = 1; d <= 20; d++) {
      daysMap[d] = {
        dayStr: `${String(d).padStart(2, '0')}/07`,
        Receitas: 0,
        Despesas: 0,
        Saldo: 0
      };
    }

    // Populate actuals from ledger
    cashFlowLedger.forEach(item => {
      const dateObj = new Date(item.date + 'T12:00:00');
      if (dateObj.getFullYear() === 2026 && dateObj.getMonth() === 6) {
        const dayNum = dateObj.getDate();
        if (daysMap[dayNum]) {
          if (item.type === 'entrada') {
            daysMap[dayNum].Receitas += item.amount;
          } else {
            daysMap[dayNum].Despesas += item.amount;
          }
        }
      }
    });

    // Calculate cumulative balances or plain daily bars
    let cumulative = 0;
    return Object.keys(daysMap).map(dayKey => {
      const day = parseInt(dayKey);
      const d = daysMap[day];
      cumulative += (d.Receitas - d.Despesas);
      return {
        ...d,
        SaldoAcumulado: parseFloat(cumulative.toFixed(2)),
        Receitas: parseFloat(d.Receitas.toFixed(2)),
        Despesas: parseFloat(d.Despesas.toFixed(2))
      };
    });
  }, [cashFlowLedger]);

  // FILTERED LEDGER ENTRIES FOR DATA TABLE
  const filteredLedger = useMemo(() => {
    return cashFlowLedger.filter(item => {
      const matchSearch = item.description.toLowerCase().includes(cashFlowSearch.toLowerCase()) ||
                          (item.entityName && item.entityName.toLowerCase().includes(cashFlowSearch.toLowerCase())) ||
                          item.id.toLowerCase().includes(cashFlowSearch.toLowerCase());
      
      const matchCategory = cashFlowCategory === 'todas' || item.category === cashFlowCategory;
      return matchSearch && matchCategory;
    });
  }, [cashFlowLedger, cashFlowSearch, cashFlowCategory]);

  // FILTERED PAYABLES LIST
  const filteredPayables = useMemo(() => {
    return dynamicPayables.filter(item => {
      if (payableFilter === 'todos') return true;
      return item.status === payableFilter;
    });
  }, [dynamicPayables, payableFilter]);

  // FILTERED RECEIVABLES LIST
  const filteredReceivables = useMemo(() => {
    return dynamicReceivables.filter(item => {
      if (receivableFilter === 'todos') return true;
      return item.status === receivableFilter;
    });
  }, [dynamicReceivables, receivableFilter]);


  // ==================== HANDLERS ====================

  // Save manual bill (Payable / Receivable)
  const handleSaveAccount = (type: 'pagar' | 'receber') => {
    if (!newAccountForm.description || !newAccountForm.amount) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    const value = parseFloat(newAccountForm.amount);
    if (isNaN(value) || value <= 0) {
      alert('Insira um valor numérico válido!');
      return;
    }

    const newAcc: FinancialAccountItem = {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      type,
      description: newAccountForm.description,
      category: newAccountForm.category,
      amount: value,
      dueDate: newAccountForm.dueDate,
      status: 'pendente',
      clientOrSupplierName: newAccountForm.clientOrSupplierName || undefined
    };

    setManualAccounts(prev => [newAcc, ...prev]);
    
    // Reset Form & Close Modal
    setNewAccountForm({
      description: '',
      category: 'Outros',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      clientOrSupplierName: ''
    });
    setShowAddPayableModal(false);
    setShowAddReceivableModal(false);
  };

  // Delete manual ledger account
  const handleDeleteManualAccount = (id: string) => {
    if (confirm('Tem certeza de que deseja excluir este lançamento financeiro?')) {
      setManualAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  // Settle manual bills (mark paid)
  const handlePayAccount = (id: string, method: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira') => {
    setManualAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          status: 'pago',
          paymentDate: currentDateStr,
          paymentMethod: method
        };
      }
      return acc;
    }));
    alert('Lançamento baixado com sucesso como PAGO!');
  };

  // Settle OS Payment directly from accounts receivable
  const handlePayOSReceivable = (orderId: string, method: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Handle wallet balance logic if payment is Carteira Própria
    if (method === 'carteira') {
      const client = clients.find(c => c.id === order.clientId);
      if (client && client.walletBalance < order.totalCost) {
        const confirmDebit = confirm(`O cliente ${client.name} possui saldo de ${formatBRL(client.walletBalance)} na Carteira.\nDeseja realizar a compra gerando um débito de ${formatBRL(client.walletBalance - order.totalCost)} na ficha dele?`);
        if (!confirmDebit) return;
        
        // Deduct from wallet
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - order.totalCost } : c));
      } else if (client) {
        // Normal wallet deduction
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - order.totalCost } : c));
      }
    }

    const payItem = {
      method,
      amount: order.totalCost,
      timestamp: new Date().toISOString()
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          isPaid: true,
          status: o.status === 'pronto' ? 'entregue' : o.status,
          payments: [payItem],
          paymentDate: new Date().toISOString(),
          history: [
            ...o.history,
            {
              timestamp: new Date().toISOString(),
              status: o.status === 'pronto' ? 'entregue' : o.status,
              note: `Pagamento de ${formatBRL(order.totalCost)} efetuado via ${method.toUpperCase()} pela aba Financeiro.`
            }
          ]
        };
      }
      return o;
    }));

    alert(`OS ${orderId} liquidada com sucesso via ${method.toUpperCase()}!`);
  };


  // ==================== POS (PDV) CONTROLLERS ====================

  // Client Selection list
  const activePOSClientObj = useMemo(() => {
    if (selectedPosClient === 'consumidor_final') {
      return { id: 'CF', name: 'Consumidor Final', cpf: '000.000.000-00', phone: '(00) 00000-0000', walletBalance: 0 };
    }
    return clients.find(c => c.id === selectedPosClient) || null;
  }, [selectedPosClient, clients]);

  // Autocomplete suggestions for Client search
  const filteredClientsForPOS = useMemo(() => {
    if (!posClientSearch) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(posClientSearch.toLowerCase()) ||
      c.cpf.includes(posClientSearch)
    );
  }, [clients, posClientSearch]);

  // Autocomplete products search
  const filteredProductsForPOS = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(posProductSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(posProductSearch.toLowerCase())
    );
  }, [products, posProductSearch]);

  // Add Product to POS Shopping Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Produto ${product.name} esgotado no estoque!`);
      return;
    }

    setPosCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Quantidade limite em estoque (${product.stock} un.) atingida!`);
          return prev;
        }
        return prev.map(item => item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } 
          : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.sellingPrice,
          totalPrice: product.sellingPrice
        }];
      }
    });

    setPosProductSearch(''); // Reset search input
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (productId: string, increment: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setPosCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = increment ? item.quantity + 1 : item.quantity - 1;
          if (newQty <= 0) return null;
          if (newQty > product.stock) {
            alert(`Limite do estoque atingido (${product.stock} un.)`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice
          };
        }
        return item;
      }).filter(Boolean) as POSSaleItem[];
    });
  };

  // POS Shopping Cart Subtotal
  const posSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [posCart]);

  // Discount conversion
  const calculatedDiscount = useMemo(() => {
    const discVal = parseFloat(posDiscount) || 0;
    if (discVal <= 0) return 0;
    if (posDiscountType === 'percent') {
      return parseFloat(((posSubtotal * discVal) / 100).toFixed(2));
    }
    return Math.min(discVal, posSubtotal);
  }, [posSubtotal, posDiscount, posDiscountType]);

  // POS Final Total
  const posTotal = useMemo(() => {
    return parseFloat((posSubtotal - calculatedDiscount).toFixed(2));
  }, [posSubtotal, calculatedDiscount]);

  // Complete POS Sale Flow
  const handleCheckoutPOS = () => {
    if (posCart.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar!');
      return;
    }

    // Process Wallet limit checkout
    if (posPaymentMethod === 'carteira' && selectedPosClient !== 'consumidor_final') {
      const client = clients.find(c => c.id === selectedPosClient);
      if (client && client.walletBalance < posTotal) {
        const confirmDebit = confirm(`O cliente possui apenas ${formatBRL(client.walletBalance)} na carteira.\nDeseja autorizar venda faturada gerando débito de ${formatBRL(client.walletBalance - posTotal)} na ficha?`);
        if (!confirmDebit) return;
        
        // Deduct from wallet (allow debit/negative balance)
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - posTotal } : c));
      } else if (client) {
        // Direct debit
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, walletBalance: c.walletBalance - posTotal } : c));
      }
    } else if (posPaymentMethod === 'carteira' && selectedPosClient === 'consumidor_final') {
      alert('Venda para Consumidor Final não aceita Carteira Própria como meio. Selecione um cliente cadastrado!');
      return;
    }

    // 1. Deduct items from products stock
    setProducts(prev => prev.map(prod => {
      const cartItem = posCart.find(item => item.productId === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity)
        };
      }
      return prod;
    }));

    // 2. Register POS Sale Record
    const clientName = activePOSClientObj ? activePOSClientObj.name : 'Consumidor Final';
    const newSaleId = `POS-${1000 + posSales.length + 1}`;
    const newSale: POSSale = {
      id: newSaleId,
      clientId: selectedPosClient === 'consumidor_final' ? undefined : selectedPosClient,
      clientName,
      items: posCart,
      subtotal: posSubtotal,
      discount: calculatedDiscount,
      total: posTotal,
      paymentMethod: posPaymentMethod,
      timestamp: new Date().toISOString()
    };

    setPosSales(prev => [newSale, ...prev]);

    // Clear cart and triggers receipt modal
    setActiveReceiptSale(newSale);
    setPosCart([]);
    setPosDiscount('0');
    setSelectedPosClient('consumidor_final');
    setPosClientSearch('');
    
    alert(`Venda ${newSaleId} registrada e estoque atualizado!`);
  };

  // Action: Prompt printer
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div id="financeiro-modulo-root" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[70vh] print:p-0 print:border-none print:shadow-none">
      
      {/* Tab Header (Hidden during print) */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <DollarSign size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider font-display">Módulo Financeiro Integrado</h2>
            <p className="text-[10px] text-slate-400 font-medium">Controle de caixa, contas de fornecedores, recebíveis e faturamento de balcão</p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('flow')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'flow' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={12} /> Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveSubTab('receivable')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeSubTab === 'receivable' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft size={12} /> Contas a Receber
            {dynamicReceivables.filter(r => r.status === 'atrasado' || r.status === 'pendente').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('payable')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeSubTab === 'payable' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight size={12} /> Contas a Pagar
            {dynamicPayables.filter(p => p.status === 'atrasado' || p.status === 'pendente').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'pos' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart size={12} /> Ponto de Venda (PDV)
          </button>
        </div>
      </div>

      {/* Main Workspace panels */}
      <div className="p-6 flex-1 bg-slate-50 overflow-y-auto print:bg-white print:p-0">
        
        {/* ==================== 1. CASH FLOW PANEL ==================== */}
        {activeSubTab === 'flow' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* High density quick indicator blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Entradas do Mês (Julho)</span>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">{formatBRL(cashFlowMetrics.inflow)}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowDownLeft size={18} />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saídas do Mês (Julho)</span>
                  <p className="text-xl font-black text-rose-600 font-mono mt-0.5">{formatBRL(cashFlowMetrics.outflow)}</p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className={`rounded-xl p-4 border shadow-xs flex items-center justify-between transition-all ${
                cashFlowMetrics.net >= 0 
                  ? 'bg-indigo-50/60 border-indigo-100 text-indigo-900' 
                  : 'bg-rose-50 border-rose-100 text-rose-900'
              }`}>
                <div>
                  <span className="text-[10px] opacity-75 uppercase font-bold tracking-wider">Saldo de Caixa Líquido</span>
                  <p className={`text-xl font-black font-mono mt-0.5`}>
                    {cashFlowMetrics.net < 0 ? '-' : ''}{formatBRL(Math.abs(cashFlowMetrics.net))}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${cashFlowMetrics.net >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                  <DollarSign size={18} />
                </div>
              </div>
            </div>

            {/* Cash flow Chart block */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Evolução do Saldo do Caixa Diário (Simulador de Julho 2026)</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Demonstração das receitas de OS/PDV confrontadas com as despesas gerais</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100/50 font-bold uppercase">
                  <Sparkles size={11} /> Julho/2026
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dayStr" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '10px', fontFamily: 'monospace' }}
                      formatter={(val: number) => [formatBRL(val), '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ledger Transactions list */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Extrato Geral de Lançamentos Liquidados</h3>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="Pesquisar descrição ou cliente..."
                      value={cashFlowSearch}
                      onChange={(e) => setCashFlowSearch(e.target.value)}
                      className="border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                    />
                  </div>

                  <select
                    value={cashFlowCategory}
                    onChange={(e) => setCashFlowCategory(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="todas">Categorias: Todas</option>
                    {revenueCategories.concat(expenseCategories).filter((v, i, a) => a.indexOf(v) === i).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4">Código / Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Origem / Entidade</th>
                      <th className="py-3 px-4 text-center">Tipo</th>
                      <th className="py-3 px-4 text-center">Forma</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredLedger.length > 0 ? (
                      filteredLedger.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="block font-bold text-slate-800 text-[10px] font-mono">{item.id}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 text-[11px] max-w-xs truncate" title={item.description}>
                            {item.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] uppercase font-bold border border-slate-200/40">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.entityName ? (
                              <span className="text-slate-600 font-semibold text-[10px]">{item.entityName}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Não informado</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                              item.type === 'entrada' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-[9px] text-slate-500 font-extrabold uppercase bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">
                              {item.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold text-[11px] font-mono ${
                            item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {item.type === 'entrada' ? '+' : '-'}{formatBRL(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          Nenhum lançamento liquidado encontrado nos critérios selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ==================== 2. ACCOUNTS RECEIVABLE ==================== */}
        {activeSubTab === 'receivable' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* Summary metrics header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Controle de Recebimentos Futuros e Pendentes</h3>
                <p className="text-[10px] text-slate-400 font-medium">Automaticamente integrado com as ordens de serviço pendentes de liquidação na oficina.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-black">Previsão Pendente Total:</span>
                  <p className="font-mono font-black text-slate-800 text-sm">
                    {formatBRL(dynamicReceivables.reduce((sum, item) => item.status !== 'pago' ? sum + item.amount : sum, 0))}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewAccountForm(prev => ({ ...prev, category: 'Outros' }));
                    setShowAddReceivableModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={12} /> Novo Lançamento
                </button>
              </div>
            </div>

            {/* List Table container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tabela de Contas a Receber</span>
                
                {/* Status selector filter */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-200">
                  {(['todos', 'pendente', 'atrasado', 'pago'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReceivableFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase cursor-pointer transition-all ${
                        receivableFilter === f ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4">Identificação</th>
                      <th className="py-3 px-4">Descrição da Conta</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Cliente Associado</th>
                      <th className="py-3 px-4 text-center">Vencimento</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações de Baixa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredReceivables.length > 0 ? (
                      filteredReceivables.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[10px] text-slate-900">{item.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 text-[11px]">{item.description}</td>
                          <td className="py-3 px-4">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600">{item.clientOrSupplierName || 'Consumidor Avulso'}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                            {new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              item.status === 'pago' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : item.status === 'atrasado'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[11px] font-mono text-indigo-600">{formatBRL(item.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            {item.status !== 'pago' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (item.id.startsWith('REC-OS-') && item.originId) {
                                      handlePayOSReceivable(item.originId, 'pix');
                                    } else {
                                      handlePayAccount(item.id, 'pix');
                                    }
                                  }}
                                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Receber via PIX"
                                >
                                  Receber Pix
                                </button>
                                <button
                                  onClick={() => {
                                    const method = prompt('Digite o método de pagamento (pix, cartao_credito, cartao_debito, dinheiro, carteira):', 'dinheiro');
                                    if (method && ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'carteira'].includes(method)) {
                                      const casted = method as any;
                                      if (item.id.startsWith('REC-OS-') && item.originId) {
                                        handlePayOSReceivable(item.originId, casted);
                                      } else {
                                        handlePayAccount(item.id, casted);
                                      }
                                    } else if (method) {
                                      alert('Método inválido! Use: pix, cartao_credito, cartao_debito, dinheiro ou carteira');
                                    }
                                  }}
                                  className="px-1.5 py-0.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Outros métodos"
                                >
                                  Outro...
                                </button>
                                {item.id.startsWith('ACC-') && (
                                  <button
                                    onClick={() => handleDeleteManualAccount(item.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-0.5">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Liquidado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          Nenhuma conta a receber encontrada nesta categoria de filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ==================== 3. ACCOUNTS PAYABLE ==================== */}
        {activeSubTab === 'payable' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* Summary metrics header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Controle de Contas a Pagar e Despesas Operacionais</h3>
                <p className="text-[10px] text-slate-400 font-medium">Cadastre e gerencie as contas fixas, faturas e pagamentos de fornecedores associados ao estoque.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-black">Previsão de Saídas Pendentes:</span>
                  <p className="font-mono font-black text-rose-600 text-sm">
                    {formatBRL(dynamicPayables.reduce((sum, item) => item.status !== 'pago' ? sum + item.amount : sum, 0))}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewAccountForm(prev => ({ ...prev, category: 'Utilidades' }));
                    setShowAddPayableModal(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={12} /> Lançar Despesa
                </button>
              </div>
            </div>

            {/* List Table container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tabela de Contas a Pagar</span>
                
                {/* Status selector filter */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-200">
                  {(['todos', 'pendente', 'atrasado', 'pago'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setPayableFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase cursor-pointer transition-all ${
                        payableFilter === f ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4">Identificação</th>
                      <th className="py-3 px-4">Descrição da Conta</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Fornecedor / Credor</th>
                      <th className="py-3 px-4 text-center">Vencimento</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações de Baixa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPayables.length > 0 ? (
                      filteredPayables.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[10px] text-slate-900">{item.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 text-[11px]">{item.description}</td>
                          <td className="py-3 px-4">
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600">{item.clientOrSupplierName || 'Serviços Públicos'}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                            {new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              item.status === 'pago' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : item.status === 'atrasado'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[11px] font-mono text-rose-600">{formatBRL(item.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            {item.status !== 'pago' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handlePayAccount(item.id, 'pix')}
                                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Liquidar via PIX"
                                >
                                  Pagar Pix
                                </button>
                                <button
                                  onClick={() => {
                                    const method = prompt('Digite o método de pagamento (pix, cartao_credito, cartao_debito, dinheiro):', 'pix');
                                    if (method && ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'].includes(method)) {
                                      handlePayAccount(item.id, method as any);
                                    } else if (method) {
                                      alert('Método inválido! Use: pix, cartao_credito, cartao_debito ou dinheiro');
                                    }
                                  }}
                                  className="px-1.5 py-0.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Outros métodos"
                                >
                                  Outro...
                                </button>
                                {item.id.startsWith('ACC-') && (
                                  <button
                                    onClick={() => handleDeleteManualAccount(item.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-0.5">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Pago
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          Nenhuma conta a pagar pendente encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ==================== 4. POINT OF SALE (PDV) PANEL ==================== */}
        {activeSubTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in print:hidden">
            
            {/* Products catalog sidebar selector (Left 7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Produtos em Catálogo</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Itens em estoque</span>
                </div>
                
                {/* Search box for products */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Filtrar por nome do componente ou código SKU..."
                    value={posProductSearch}
                    onChange={(e) => setPosProductSearch(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-medium"
                  />
                </div>

                {/* Products Grid view */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredProductsForPOS.length > 0 ? (
                    filteredProductsForPOS.map((prod) => (
                      <div 
                        key={prod.id} 
                        onClick={() => handleAddToCart(prod)}
                        className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
                          prod.stock <= 0 
                            ? 'bg-slate-50 border-slate-200/50 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-indigo-500/80'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono bg-slate-100 text-slate-500 border border-slate-200/60 px-1 rounded inline-block font-extrabold">
                            {prod.sku}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</h4>
                        </div>
                        <div className="flex items-end justify-between mt-3 pt-1 border-t border-slate-100/50">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">VALOR</span>
                            <span className="text-xs font-black text-indigo-700 font-mono">{formatBRL(prod.sellingPrice)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold">ESTOQUE</span>
                            <span className={`text-[10px] font-bold font-mono ${
                              prod.stock <= 2 ? 'text-amber-500' : 'text-slate-600'
                            }`}>
                              {prod.stock <= 0 ? 'Sem estoque' : `${prod.stock} un.`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-10 text-center text-slate-400 italic">
                      Nenhum produto cadastrado com estoque disponível.
                    </div>
                  )}
                </div>
              </div>

              {/* 4.A LANÇAR ITEM AVULSO */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Plus size={13} className="text-indigo-600" /> Inserir Item Avulso / Serviço Manual
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase px-1.5 py-0.5 rounded">PDV Direto</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end font-semibold text-slate-700">
                  <div className="sm:col-span-6">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Nome / Descrição do Item:</label>
                    <input
                      type="text"
                      placeholder="Ex: Cabo de Força HDMI, Limpeza Preventiva..."
                      value={posLooseName}
                      onChange={(e) => setPosLooseName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Preço Unitário (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={posLoosePrice}
                      onChange={(e) => setPosLoosePrice(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Qtd:</label>
                    <input
                      type="number"
                      min="1"
                      value={posLooseQty}
                      onChange={(e) => setPosLooseQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => {
                        const priceNum = parseFloat(posLoosePrice) || 0;
                        if (!posLooseName.trim() || priceNum <= 0) {
                          alert('Por favor, informe a descrição e um preço unitário válido maior que zero.');
                          return;
                        }
                        
                        const looseId = `LSE-${Date.now()}`;
                        const newItem: POSSaleItem = {
                          productId: looseId,
                          name: posLooseName.trim(),
                          sku: 'AVULSO',
                          quantity: posLooseQty,
                          unitPrice: priceNum,
                          totalPrice: priceNum * posLooseQty
                        };

                        setPosCart(prev => {
                          const existingIdx = prev.findIndex(item => item.sku === 'AVULSO' && item.name.toLowerCase() === newItem.name.toLowerCase());
                          if (existingIdx > -1) {
                            return prev.map((item, idx) => idx === existingIdx 
                              ? { ...item, quantity: item.quantity + newItem.quantity, totalPrice: (item.quantity + newItem.quantity) * item.unitPrice }
                              : item
                            );
                          }
                          return [...prev, newItem];
                        });

                        // Reset
                        setPosLooseName('');
                        setPosLoosePrice('');
                        setPosLooseQty(1);
                      }}
                      className="w-full h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                      title="Adicionar item ao carrinho"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4.B BUSCAR ORDEM DE SERVIÇO PARA QUITAÇÃO */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Search size={13} className="text-amber-600" /> Buscar OS para Quitação Direta
                  </span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-bold uppercase px-1.5 py-0.5 rounded border border-amber-100">Faturamento</span>
                </div>

                <div className="relative font-semibold text-slate-700">
                  <Search className="absolute left-3 top-3 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Digite o código da OS (Ex: OS-1001 ou apenas 1001) para liquidar..."
                    value={posOsSearchQuery}
                    onChange={(e) => setPosOsSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-slate-50 font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                {foundOS ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-3 animate-pulse">
                    <div className="flex justify-between items-start border-b border-amber-200/60 pb-2">
                      <div>
                        <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono font-black">{foundOS.id}</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{foundOS.equipment}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">Cliente: <span className="font-extrabold text-slate-700">{foundOS.clientName}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-amber-700 block font-bold">TOTAL DA OS</span>
                        <span className="text-xs font-black text-amber-900 font-mono">{formatBRL(foundOS.totalCost)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 font-semibold italic">OS está pendente de quitação.</span>
                      <button
                        type="button"
                        onClick={handlePayFoundOS}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Check size={11} /> Confirmar Recebimento e Fechar OS
                      </button>
                    </div>
                  </div>
                ) : posOsSearchQuery.trim() ? (
                  <p className="text-[10px] text-rose-500 italic font-semibold">Nenhuma Ordem de Serviço pendente de quitação correspondente a "{posOsSearchQuery}".</p>
                ) : null}
              </div>
            </div>

            {/* Shopping Cart & Checkout ledger (Right 5 columns) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Header panel */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart size={14} className="text-indigo-400" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider">Carrinho de Compras do Caixa</span>
                  </div>
                  <span className="text-[9px] bg-indigo-600 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    {posCart.reduce((sum, item) => sum + item.quantity, 0)} Itens
                  </span>
                </div>

                {/* Cliente selector block */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-500" />
                    <label className="text-[10px] font-black text-slate-500 uppercase">Selecione o Cliente na Ficha:</label>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedPosClient}
                      onChange={(e) => {
                        setSelectedPosClient(e.target.value);
                        setPosClientSearch(''); // clear search on select
                      }}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-slate-800"
                    >
                      <option value="consumidor_final">Consumidor Final (Avulso)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Saldo: {formatBRL(c.walletBalance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer stats display if selected */}
                  {selectedPosClient !== 'consumidor_final' && activePOSClientObj && (
                    <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/60 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="text-[9px] text-indigo-800 uppercase block font-black">Cliente Selecionado:</span>
                        <span className="font-bold text-slate-800">{activePOSClientObj.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-indigo-800 uppercase block font-black">Carteira Própria:</span>
                        <span className={`font-mono font-bold ${
                          activePOSClientObj.walletBalance < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'
                        }`}>
                          {formatBRL(activePOSClientObj.walletBalance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart list layout */}
                <div className="p-4 divide-y divide-slate-100 max-h-48 overflow-y-auto flex-1 min-h-[140px]">
                  {posCart.length > 0 ? (
                    posCart.map((item) => (
                      <div key={item.productId} className="py-2.5 flex justify-between items-center gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h5 className="text-[11px] font-bold text-slate-800 truncate">{item.name}</h5>
                          <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">{item.sku}</span>
                        </div>
                        
                        {/* Quantity management */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, false)}
                            className="w-5 h-5 border border-slate-200 bg-white hover:bg-slate-100 rounded flex items-center justify-center text-xs text-slate-600 cursor-pointer font-bold select-none"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-extrabold text-slate-800 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, true)}
                            className="w-5 h-5 border border-slate-200 bg-white hover:bg-slate-100 rounded flex items-center justify-center text-xs text-slate-600 cursor-pointer font-bold select-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Totals */}
                        <div className="text-right shrink-0 w-20">
                          <span className="font-mono text-xs font-bold text-slate-800 block">{formatBRL(item.totalPrice)}</span>
                          <span className="text-[8px] text-slate-400 font-medium">({formatBRL(item.unitPrice)} un.)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-400 italic text-[11px] flex flex-col items-center justify-center gap-1.5">
                      <ShoppingCart size={24} className="opacity-35" />
                      Carrinho vazio. Adicione componentes ao lado.
                    </div>
                  )}
                </div>

                {/* Discount and surcharge options */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 grid grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Desconto Comercial:</label>
                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        value={posDiscount}
                        onChange={(e) => setPosDiscount(e.target.value)}
                        className="w-full border border-slate-200 rounded-l-lg p-1 text-[11px] font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => setPosDiscountType(prev => prev === 'brl' ? 'percent' : 'brl')}
                        className="border border-l-0 border-slate-200 bg-slate-100 hover:bg-slate-200 rounded-r-lg px-2 text-[10px] font-bold text-slate-600 cursor-pointer"
                        title="Alterar tipo de desconto"
                      >
                        {posDiscountType === 'brl' ? 'R$' : '%'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Meio de Pagamento:</label>
                    <select
                      value={posPaymentMethod}
                      onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="pix">PIX Automático</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="dinheiro">Dinheiro Espécie</option>
                      <option value="carteira" disabled={selectedPosClient === 'consumidor_final'}>
                        Carteira Própria
                      </option>
                    </select>
                  </div>
                </div>

                {/* Totals panel and checkout trigger */}
                <div className="p-4 border-t border-slate-200 bg-slate-900 text-white shrink-0">
                  <div className="space-y-1.5 text-xs font-bold">
                    <div className="flex justify-between font-medium text-slate-400">
                      <span>Subtotal da Compra:</span>
                      <span className="font-mono">{formatBRL(posSubtotal)}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between font-medium text-emerald-400">
                        <span>Desconto Aplicado:</span>
                        <span className="font-mono">-{formatBRL(calculatedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t border-slate-800 pt-2 tracking-tight">
                      <span>TOTAL A PAGAR:</span>
                      <span className="font-mono text-indigo-400">{formatBRL(posTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutPOS}
                    disabled={posCart.length === 0}
                    className={`w-full mt-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all ${
                      posCart.length === 0
                        ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                    }`}
                  >
                    <Check size={14} /> Registrar e Fechar Venda
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>


      {/* ==================== DIALOGS & MODAL INSERTS ==================== */}

      {/* NEW ACCOUNT FORM DIALOGS */}
      {(showAddPayableModal || showAddReceivableModal) && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className={`p-4 text-white flex justify-between items-center ${
              showAddPayableModal ? 'bg-rose-600' : 'bg-indigo-600'
            }`}>
              <div className="flex items-center gap-2">
                {showAddPayableModal ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                <span className="font-bold text-xs uppercase tracking-wider">
                  {showAddPayableModal ? 'Lançar Conta a Pagar / Despesa' : 'Lançar Conta a Receber / Receita'}
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowAddPayableModal(false);
                  setShowAddReceivableModal(false);
                }}
                className="text-white hover:opacity-85 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Descrição do Lançamento *:</label>
                <input
                  type="text"
                  placeholder="Ex: Conta de Luz, Venda de Peças Avulsas..."
                  value={newAccountForm.description}
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Categoria *:</label>
                  <select
                    value={newAccountForm.category}
                    onChange={(e) => setNewAccountForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                  >
                    {showAddPayableModal 
                      ? expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : revenueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Valor do Lançamento (R$) *:</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAccountForm.amount}
                    onChange={(e) => setNewAccountForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Data de Vencimento *:</label>
                  <input
                    type="date"
                    value={newAccountForm.dueDate}
                    onChange={(e) => setNewAccountForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    {showAddPayableModal ? 'Fornecedor / Credor:' : 'Cliente / Pagador:'}
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={newAccountForm.clientOrSupplierName}
                    onChange={(e) => setNewAccountForm(prev => ({ ...prev, clientOrSupplierName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowAddPayableModal(false);
                    setShowAddReceivableModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveAccount(showAddPayableModal ? 'pagar' : 'receber')}
                  className={`px-5 py-2 text-white font-black uppercase rounded-lg cursor-pointer transition-all shadow-md ${
                    showAddPayableModal ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* THERMAL STYLE POS SALE RECEIPT MODAL (Visible standard viewport and printable full overlay) */}
      {activeReceiptSale && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:static print:h-auto print:max-h-none print:overflow-visible">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-h-none print:rounded-none">
            
            {/* Action Bar (Hidden in Print) */}
            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center print:hidden shrink-0">
              <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
                <Printer size={13} /> Recibo de Venda do PDV
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => setActiveReceiptSale(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Content Area */}
            <div className="p-4 bg-slate-100/50 overflow-y-auto flex-1 font-mono text-[10px] text-slate-800 print:bg-white print:p-0 print:overflow-visible">
              <div 
                id="print-area" 
                className="bg-white border border-slate-200/80 p-5 rounded-lg shadow-sm space-y-4 max-w-xs mx-auto print:border-none print:shadow-none print:p-2"
              >
                
                {/* Header branding */}
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                  <h3 className="text-sm font-black text-slate-900">ELETROOS OFICINA</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Gestão e Serviços Técnicos</p>
                  <p className="text-[8px] text-slate-500">CNPJ: 12.345.678/0001-90</p>
                  <p className="text-[8px] text-slate-500">Av. Principal, 1500 - SP</p>
                  <p className="text-[8px] text-slate-500">Telefone: (11) 98765-4321</p>
                </div>

                {/* Metadata info */}
                <div className="space-y-0.5 text-[8px] text-slate-600">
                  <p><strong>CUPOM DE VENDA:</strong> {activeReceiptSale.id}</p>
                  <p><strong>DATA:</strong> {new Date(activeReceiptSale.timestamp).toLocaleString('pt-BR')}</p>
                  <p><strong>CLIENTE:</strong> {activeReceiptSale.clientName}</p>
                  <p className="border-b border-dashed border-slate-300 pb-2">----------------------------------------</p>
                </div>

                {/* Items detail list */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 font-bold text-slate-800 text-[9px] border-b border-dashed border-slate-200 pb-1">
                    <span className="col-span-6">DESCRIÇÃO</span>
                    <span className="col-span-2 text-center">QTD</span>
                    <span className="col-span-4 text-right">VALOR</span>
                  </div>
                  
                  {activeReceiptSale.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 text-[8px] leading-tight text-slate-700">
                      <div className="col-span-6 truncate font-medium">
                        {item.name}
                        <span className="block text-[7px] text-slate-400 font-mono">{item.sku}</span>
                      </div>
                      <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                      <span className="col-span-4 text-right font-mono">{formatBRL(item.totalPrice)}</span>
                    </div>
                  ))}
                  
                  <p className="border-b border-dashed border-slate-300 pt-1">----------------------------------------</p>
                </div>

                {/* Totals summation blocks */}
                <div className="space-y-1 text-right text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">SUBTOTAL:</span>
                    <span className="font-mono">{formatBRL(activeReceiptSale.subtotal)}</span>
                  </div>
                  {activeReceiptSale.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>DESCONTO:</span>
                      <span className="font-mono">-{formatBRL(activeReceiptSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-1 text-[11px]">
                    <span>TOTAL GERAL:</span>
                    <span className="font-mono text-indigo-700">{formatBRL(activeReceiptSale.total)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-2 text-[8px] text-slate-500">
                  <p className="font-bold">MEIO: {activeReceiptSale.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                  <p className="italic">Obrigado pela preferência!<br />Volte Sempre.</p>
                  <div className="border-t border-slate-200 pt-1 text-[7px] font-mono text-slate-400">
                    EletroOS software v2.4.0
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
