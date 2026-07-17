export type OSStatus = 
  | 'aguardando_orcamento' 
  | 'orcamento_aprovado' 
  | 'orcamento_rejeitado' 
  | 'em_reparo' 
  | 'pronto' 
  | 'entregue';

export interface OSHistoryEvent {
  timestamp: string;
  status: OSStatus;
  note: string;
}

export interface PartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentItem {
  method: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira';
  amount: number;
  timestamp: string;
  installmentsCount?: number;
  firstInstallmentDueDate?: string;
  installmentsList?: { number: number; dueDate: string; amount: number; status: 'pendente' | 'pago' }[];
}

export interface ServiceOrder {
  id: string; // e.g., "OS-1001"
  clientId: string;
  clientName: string;
  clientPhone: string;
  equipment: string;
  brand: string;
  model: string;
  serialNumber: string;
  reportedProblem: string;
  physicalCondition?: string; // damages, scratches, physical state
  observations?: string; // general observations
  technicalReport: string;
  parts: PartItem[];
  laborCost: number;
  totalCost: number;
  status: OSStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  paymentDate?: string;
  history: OSHistoryEvent[];
  payments: PaymentItem[];
  isPaid: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  walletBalance: number;
  cep?: string;
  address?: string; // street / logradouro
  number?: string;
  complement?: string;
  neighborhood?: string; // bairro
  city?: string;
  state?: string; // UF / estado
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  timestamp: string;
  description: string;
  amount: number;
  method: 'pix' | 'transferencia' | 'cartao';
  matchedOsId?: string;
  status: 'pendente' | 'conciliado';
}

export interface PushNotification {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  type: 'status_update' | 'billing' | 'payment_pending' | 'reconciliation';
  read: boolean;
}

// Purchase and Inventory Types
export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  profitMargin: number; // percentage (e.g. 50 for 50%)
  sellingPrice: number;
  stock: number;
  supplierId?: string;
  supplierName?: string;
  createdAt: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  standardPrice: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId?: string; // empty if it's a newly created product during purchase
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  profitMargin: number;
  sellingPrice: number;
}

export interface ProductPurchase {
  id: string;
  invoiceNumber: string; // NFe Número
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseItem[];
  totalAmount: number;
  xmlFileName?: string;
}

export interface FinancialAccountItem {
  id: string;
  type: 'pagar' | 'receber';
  description: string;
  category: string; // e.g. 'Fornecedor', 'Aluguel', 'Energia', 'Venda OS', 'PDV', 'Outros'
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira';
  clientOrSupplierName?: string;
  originId?: string; // OS-1001, purchase ID, POS ID, etc.
}

export interface POSSaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface POSSale {
  id: string;
  clientId?: string;
  clientName: string;
  items: POSSaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira';
  timestamp: string;
}

export interface InserviceableAsset {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  equipment: string;
  brand: string;
  model: string;
  serialNumber: string;
  entryDate: string;
  origin: 'ordem_servico' | 'direto';
  originId?: string;
  remunerated: boolean;
  valuePaid: number;
  status: 'recebido' | 'descartado' | 'vendido_como_sucata';
  notes?: string;
}

export interface CompanyProfile {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnaeCode: string;
  cnaeDesc: string;
  taxRegime: 'mei' | 'simples' | 'lucro_presumido' | 'lucro_real';
  stateRegistration: string; // Inscrição Estadual
  municipalRegistration: string; // Inscrição Municipal
  taxRateSimple?: number; // Alíquota do Simples Nacional ou Imposto Geral
  icmsRate?: number;
  issqnRate?: number;
  digitalCertificateUploaded: boolean;
  digitalCertificatePassword?: string;
  nfeSerie: string;
  nfeNextNumber: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  environment?: 'homologacao' | 'producao';
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'administrador' | 'tecnico' | 'atendente';
  password?: string;
  companyCnpj: string;
}

export interface AuthSession {
  user: User | null;
  company: CompanyProfile | null;
}





