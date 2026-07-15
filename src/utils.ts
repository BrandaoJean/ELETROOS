import { Client, ServiceOrder, BankTransaction, PushNotification } from './types';

// Utility to format currency as Brazilian Real (BRL)
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Generate elegant WhatsApp share link
export function getWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodedText}`;
}

// Helper to extract first name of a client
export function getFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0] || '';
}

// Initial Mock Clients
export const mockClients: Client[] = [
  {
    id: 'C-001',
    name: 'Jean Brandão',
    phone: '11999998888',
    email: 'brandao.jean@gmail.com',
    cpf: '123.456.789-00',
    walletBalance: 150.00,
    createdAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'C-002',
    name: 'Maria Helena Santos',
    phone: '21988887777',
    email: 'maria.helena@hotmail.com',
    cpf: '987.654.321-11',
    walletBalance: 0.00,
    createdAt: '2026-06-02T14:30:00Z',
  },
  {
    id: 'C-003',
    name: 'Carlos Eduardo Souza',
    phone: '31977776666',
    email: 'carlos.edu@gmail.com',
    cpf: '456.789.123-22',
    walletBalance: 50.00,
    createdAt: '2026-06-15T09:15:00Z',
  },
  {
    id: 'C-004',
    name: 'Ana Paula Lima',
    phone: '11966665555',
    email: 'ana.lima@outlook.com',
    cpf: '789.123.456-33',
    walletBalance: 0.00,
    createdAt: '2026-07-01T11:00:00Z',
  },
  {
    id: 'C-005',
    name: 'Roberto de Oliveira',
    phone: '11955554444',
    email: 'roberto.oliveira@gmail.com',
    cpf: '321.654.987-44',
    walletBalance: 0.00,
    createdAt: '2026-07-10T16:20:00Z',
  }
];

// Initial Service Orders
export const mockServiceOrders: ServiceOrder[] = [
  {
    id: 'OS-1001',
    clientId: 'C-001',
    clientName: 'Jean Brandão',
    clientPhone: '11999998888',
    equipment: 'Smart TV 55"',
    brand: 'Samsung',
    model: 'UN55AU7700GXZD',
    serialNumber: 'SAMSUNG-55-98721',
    reportedProblem: 'Sem imagem, apenas som. Tela fica escura ao ligar.',
    technicalReport: 'Substituição do kit de barras de LED do backlight danificado por sobretensão.',
    laborCost: 250.00,
    parts: [
      { id: 'p1', name: 'Kit Barras LED Samsung 55"', quantity: 1, unitPrice: 180.00 }
    ],
    totalCost: 430.00,
    status: 'entregue',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-12T15:00:00Z',
    dueDate: '2026-06-15',
    paymentDate: '2026-06-12T15:00:00Z',
    isPaid: true,
    payments: [
      { method: 'pix', amount: 300.00, timestamp: '2026-06-12T14:50:00Z' },
      { method: 'dinheiro', amount: 130.00, timestamp: '2026-06-12T14:55:00Z' }
    ],
    history: [
      { timestamp: '2026-06-10T10:00:00Z', status: 'aguardando_orcamento', note: 'Entrada do equipamento para diagnóstico.' },
      { timestamp: '2026-06-10T14:00:00Z', status: 'orcamento_aprovado', note: 'Orçamento aprovado pelo cliente via WhatsApp.' },
      { timestamp: '2026-06-11T11:00:00Z', status: 'em_reparo', note: 'Peça recebida, reparo iniciado.' },
      { timestamp: '2026-06-12T10:00:00Z', status: 'pronto', note: 'Aparelho reparado e testado por 12 horas. Pronto para retirada.' },
      { timestamp: '2026-06-12T15:00:00Z', status: 'entregue', note: 'Equipamento retirado pelo cliente. Pago R$300 via PIX e R$130 em Dinheiro.' }
    ]
  },
  {
    id: 'OS-1002',
    clientId: 'C-002',
    clientName: 'Maria Helena Santos',
    clientPhone: '21988887777',
    equipment: 'Notebook Inspiron 15',
    brand: 'Dell',
    model: 'I15-3501',
    serialNumber: 'DELL-LAP-4819',
    reportedProblem: 'Lentidão extrema e travamentos no Windows.',
    technicalReport: 'Instalação de SSD NVMe de alta velocidade e formatação limpa do sistema operacional.',
    laborCost: 150.00,
    parts: [
      { id: 'p2', name: 'SSD NVMe 512GB Kingston', quantity: 1, unitPrice: 220.00 }
    ],
    totalCost: 370.00,
    status: 'entregue',
    createdAt: '2026-06-20T11:30:00Z',
    updatedAt: '2026-06-22T16:00:00Z',
    dueDate: '2026-06-25',
    paymentDate: '2026-06-22T16:00:00Z',
    isPaid: true,
    payments: [
      { method: 'cartao_credito', amount: 370.00, timestamp: '2026-06-22T16:00:00Z' }
    ],
    history: [
      { timestamp: '2026-06-20T11:30:00Z', status: 'aguardando_orcamento', note: 'Entrada para orçamento de upgrade.' },
      { timestamp: '2026-06-20T16:30:00Z', status: 'orcamento_aprovado', note: 'Cliente aprovou upgrade para SSD.' },
      { timestamp: '2026-06-22T14:00:00Z', status: 'pronto', note: 'SSD instalado, Windows configurado e rápido.' },
      { timestamp: '2026-06-22T16:00:00Z', status: 'entregue', note: 'Equipamento entregue. Pago integralmente no Crédito.' }
    ]
  },
  {
    id: 'OS-1003',
    clientId: 'C-003',
    clientName: 'Carlos Eduardo Souza',
    clientPhone: '31977776666',
    equipment: 'Console PlayStation 5',
    brand: 'Sony',
    model: 'CFI-1214A',
    serialNumber: 'SONY-PS5-11029',
    reportedProblem: 'Superaquecendo e desligando após 20 minutos de jogo.',
    technicalReport: 'Desmontagem completa, limpeza química do dissipador de calor e substituição do metal líquido.',
    laborCost: 300.00,
    parts: [
      { id: 'p3', name: 'Metal Líquido Condutividade Térmica', quantity: 1, unitPrice: 80.00 }
    ],
    totalCost: 380.00,
    status: 'pronto',
    createdAt: '2026-07-12T09:00:00Z',
    updatedAt: '2026-07-13T17:00:00Z',
    dueDate: '2026-07-18',
    isPaid: false,
    payments: [],
    history: [
      { timestamp: '2026-07-12T09:00:00Z', status: 'aguardando_orcamento', note: 'Entrada com reclamação de superaquecimento.' },
      { timestamp: '2026-07-12T11:30:00Z', status: 'orcamento_aprovado', note: 'Orçamento de metal líquido aprovado.' },
      { timestamp: '2026-07-13T15:00:00Z', status: 'em_reparo', note: 'Manutenção térmica concluída.' },
      { timestamp: '2026-07-13T17:00:00Z', status: 'pronto', note: 'Equipamento testado sob estresse por 3 horas. Pronto para retirada!' }
    ]
  },
  {
    id: 'OS-1004',
    clientId: 'C-004',
    clientName: 'Ana Paula Lima',
    clientPhone: '11966665555',
    equipment: 'Forno Microondas 30L',
    brand: 'Electrolux',
    model: 'ME30S',
    serialNumber: 'ELECTRO-9912',
    reportedProblem: 'Não está esquentando os alimentos, prato gira e acende luz.',
    technicalReport: 'Defeito no magnetron. Necessita troca da peça para restabelecer a potência micro-ondas.',
    laborCost: 120.00,
    parts: [
      { id: 'p4', name: 'Magnetron Microondas Electrolux', quantity: 1, unitPrice: 150.00 }
    ],
    totalCost: 270.00,
    status: 'aguardando_orcamento',
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-07-14T11:00:00Z',
    dueDate: '2026-07-20',
    isPaid: false,
    payments: [],
    history: [
      { timestamp: '2026-07-14T09:00:00Z', status: 'aguardando_orcamento', note: 'Equipamento deu entrada na oficina.' },
      { timestamp: '2026-07-14T11:00:00Z', status: 'aguardando_orcamento', note: 'Laudo técnico elaborado. Defeito: Magnetron danificado.' }
    ]
  },
  {
    id: 'OS-1005',
    clientId: 'C-005',
    clientName: 'Roberto de Oliveira',
    clientPhone: '11955554444',
    equipment: 'Aparelho de Som',
    brand: 'Gradiente',
    model: 'Energy-800',
    serialNumber: 'GRAD-vintage-77',
    reportedProblem: 'Canal esquerdo sem áudio e chiado no controle de volume.',
    technicalReport: 'Substituição de transistores de saída queimados e lubrificação técnica dos potenciômetros com Limpa Contato.',
    laborCost: 180.00,
    parts: [
      { id: 'p5', name: 'Transistores Potência Canal Esquerdo', quantity: 2, unitPrice: 25.00 },
      { id: 'p6', name: 'Potenciômetro Rotativo Volume', quantity: 1, unitPrice: 30.00 }
    ],
    totalCost: 260.00,
    status: 'em_reparo',
    createdAt: '2026-07-13T10:00:00Z',
    updatedAt: '2026-07-14T14:30:00Z',
    dueDate: '2026-07-20',
    isPaid: false,
    payments: [],
    history: [
      { timestamp: '2026-07-13T10:00:00Z', status: 'aguardando_orcamento', note: 'Entrada para restauro de canal de áudio.' },
      { timestamp: '2026-07-13T15:00:00Z', status: 'orcamento_aprovado', note: 'Cliente aprovou o restauro completo.' },
      { timestamp: '2026-07-14T14:30:00Z', status: 'em_reparo', note: 'Placa limpa, componentes de áudio sendo dessoldados.' }
    ]
  }
];

// Initial Bank Transactions for Conciliation
export const mockBankTransactions: BankTransaction[] = [
  {
    id: 'TX-001',
    timestamp: '2026-07-14T08:15:00Z',
    description: 'PIX Recebido - Carlos Eduardo Souza',
    amount: 380.00,
    method: 'pix',
    status: 'pendente'
  },
  {
    id: 'TX-002',
    timestamp: '2026-07-14T10:30:00Z',
    description: 'TED Recebida - ANA P LIMA',
    amount: 270.00,
    method: 'transferencia',
    status: 'pendente'
  },
  {
    id: 'TX-003',
    timestamp: '2026-07-13T15:00:00Z',
    description: 'PGTO CARTÃO CRÉDITO REDE - DEB: MARIA SANTOS',
    amount: 370.00,
    method: 'cartao',
    matchedOsId: 'OS-1002',
    status: 'conciliado'
  },
  {
    id: 'TX-004',
    timestamp: '2026-07-11T12:00:00Z',
    description: 'PIX Recebido - JEAN BRANDAO',
    amount: 300.00,
    method: 'pix',
    matchedOsId: 'OS-1001',
    status: 'conciliado'
  }
];

// Initial Push Notifications
export const mockNotifications: PushNotification[] = [
  {
    id: 'N-001',
    timestamp: '2026-07-14T10:00:00Z',
    title: 'Cobrança Recorrente Gerada',
    body: 'Notificação push de faturamento enviada para Jean Brandão referente ao plano de manutenção preventiva trimestral.',
    type: 'billing',
    read: false
  },
  {
    id: 'N-002',
    timestamp: '2026-07-14T11:00:00Z',
    title: 'Orçamento Concluído',
    body: 'Orçamento da OS-1004 (Microondas Electrolux) de Ana Paula Lima gerado com sucesso. Notificação de status enviada.',
    type: 'status_update',
    read: false
  },
  {
    id: 'N-003',
    timestamp: '2026-07-13T17:00:00Z',
    title: 'Aparelho Pronto',
    body: 'Notificação push enviada para Carlos Eduardo Souza informando que o Console PS5 (OS-1003) está pronto para retirada.',
    type: 'status_update',
    read: true
  },
  {
    id: 'N-004',
    timestamp: '2026-07-12T08:00:00Z',
    title: 'Alerta de Cobrança Pendente',
    body: 'Notificação push enviada para Maria Helena Santos referente a parcelas remanescentes de orçamentos antigos.',
    type: 'payment_pending',
    read: true
  }
];

// Mock Suppliers
export const mockSuppliers: any[] = [
  {
    id: 'FORN-001',
    name: 'Eletrônica Central Distribuidora Ltda',
    cnpj: '12.345.678/0001-90',
    phone: '1133334444',
    email: 'vendas@eletronicacentral.com.br',
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'FORN-002',
    name: 'Sinal & Imagem Peças de Reposição',
    cnpj: '98.765.432/0001-10',
    phone: '2125556666',
    email: 'contato@sinalimagem.com.br',
    createdAt: '2026-02-10T10:30:00Z'
  },
  {
    id: 'FORN-003',
    name: 'Importadora Express de Semicondutores',
    cnpj: '45.678.901/0001-22',
    phone: '3137778888',
    email: 'suporte@importadoraexpress.com.br',
    createdAt: '2026-03-01T14:00:00Z'
  }
];

// Mock Products / Pieces
export const mockProducts: any[] = [
  {
    id: 'PROD-001',
    name: 'Kit Barras LED Samsung 55"',
    sku: 'LED-SAM-55-UN',
    costPrice: 90.00,
    profitMargin: 100.0, // 100% margin -> sellingPrice: 180.00
    sellingPrice: 180.00,
    stock: 5,
    supplierId: 'FORN-002',
    supplierName: 'Sinal & Imagem Peças de Reposição',
    createdAt: '2026-06-01T10:00:00Z'
  },
  {
    id: 'PROD-002',
    name: 'Cabo Flat Screen Flex LVDs',
    sku: 'CAB-FLAT-LVD-40',
    costPrice: 20.00,
    profitMargin: 150.0, // 150% margin -> sellingPrice: 50.00
    sellingPrice: 50.00,
    stock: 12,
    supplierId: 'FORN-001',
    supplierName: 'Eletrônica Central Distribuidora Ltda',
    createdAt: '2026-06-05T11:00:00Z'
  },
  {
    id: 'PROD-003',
    name: 'CI HDMI Panasonic MN864729 para PS4/PS5',
    sku: 'IC-HDMI-PAN-86',
    costPrice: 45.00,
    profitMargin: 122.22, // 122% margin -> sellingPrice: 100.00
    sellingPrice: 100.00,
    stock: 8,
    supplierId: 'FORN-003',
    supplierName: 'Importadora Express de Semicondutores',
    createdAt: '2026-06-12T15:30:00Z'
  },
  {
    id: 'PROD-004',
    name: 'Magnetron Microondas Electrolux / Consul Universal',
    sku: 'MAG-ELECT-UNI',
    costPrice: 60.00,
    profitMargin: 100.0, // 100% margin -> sellingPrice: 120.00
    sellingPrice: 120.00,
    stock: 4,
    supplierId: 'FORN-001',
    supplierName: 'Eletrônica Central Distribuidora Ltda',
    createdAt: '2026-06-20T09:00:00Z'
  },
  {
    id: 'PROD-005',
    name: 'Transistor de Potência NJW0281G (Par Casado)',
    sku: 'TR-NJW0281G-PAIR',
    costPrice: 15.00,
    profitMargin: 66.67, // 66.67% margin -> sellingPrice: 25.00
    sellingPrice: 25.00,
    stock: 15,
    supplierId: 'FORN-003',
    supplierName: 'Importadora Express de Semicondutores',
    createdAt: '2026-07-01T14:00:00Z'
  },
  {
    id: 'PROD-006',
    name: 'Potenciômetro Rotativo Mono 10K Rígido',
    sku: 'POT-MONO-10K',
    costPrice: 10.00,
    profitMargin: 200.0, // 200% margin -> sellingPrice: 30.00
    sellingPrice: 30.00,
    stock: 25,
    supplierId: 'FORN-001',
    supplierName: 'Eletrônica Central Distribuidora Ltda',
    createdAt: '2026-07-02T16:00:00Z'
  }
];

// Mock Service Templates
export const mockServiceTemplates: any[] = [
  {
    id: 'SERV-001',
    name: 'Diagnóstico & Orçamento Técnico',
    description: 'Análise laboratorial primária, medições de tensão e emissão do laudo técnico de reparabilidade.',
    standardPrice: 60.00,
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'SERV-002',
    name: 'Reparo de Fonte Chaveada',
    description: 'Substituição de capacitores esgotados, diodos retificadores ou reguladores PWM na fonte principal.',
    standardPrice: 150.00,
    createdAt: '2026-01-12T11:30:00Z'
  },
  {
    id: 'SERV-003',
    name: 'Troca de Backlight / Barras de LED',
    description: 'Abertura total do painel de display com ventosas de segurança e substituição integral do barramento de LEDs.',
    standardPrice: 250.00,
    createdAt: '2026-02-01T09:00:00Z'
  },
  {
    id: 'SERV-004',
    name: 'Ressolda BGA / Troca de Conectores HDMI ou USB',
    description: 'Remoção por estação de retrabalho de ar quente, limpeza do PCB e soldagem de novos conectores de interface.',
    standardPrice: 180.00,
    createdAt: '2026-02-15T15:00:00Z'
  },
  {
    id: 'SERV-005',
    name: 'Limpeza Interna Técnica & Troca de Metal Líquido/Pasta',
    description: 'Desmontagem total do equipamento, jateamento de ar, desoxidação química com isopropanol e troca do composto térmico.',
    standardPrice: 120.00,
    createdAt: '2026-03-01T10:00:00Z'
  }
];

// Mock Purchases
export const mockPurchases: any[] = [
  {
    id: 'PUR-001',
    invoiceNumber: '10482',
    supplierId: 'FORN-002',
    supplierName: 'Sinal & Imagem Peças de Reposição',
    purchaseDate: '2026-07-05T10:00:00Z',
    items: [
      {
        productId: 'PROD-001',
        name: 'Kit Barras LED Samsung 55"',
        sku: 'LED-SAM-55-UN',
        quantity: 5,
        costPrice: 90.00,
        profitMargin: 100.0,
        sellingPrice: 180.00
      }
    ],
    totalAmount: 450.00,
    xmlFileName: 'NFe_35260798765432000110550010000104821000104824_procNFe.xml'
  }
];

