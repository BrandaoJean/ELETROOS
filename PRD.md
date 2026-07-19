# PRD - Product Requirement Document (Documento de Requisitos do Produto)
## EletroOS - Sistema de Gestão Inteligente para Assistência Técnica & MEI

Este documento descreve os objetivos, a arquitetura, as funcionalidades e os fluxos de trabalho da plataforma **EletroOS**, um sistema ERP integrado de alta fidelidade desenvolvido sob medida para microempreendedores individuais (MEI) que gerenciam oficinas de eletrônica e manutenção.

---

## 1. Visão Geral do Produto

### 1.1 Objetivos e Proposta de Valor
A **EletroOS** foi projetada para resolver a fragmentação operacional enfrentada por técnicos e oficinas de manutenção. O principal objetivo é centralizar o fluxo operacional — desde a recepção do aparelho do cliente até a conformidade fiscal do MEI — eliminando planilhas e processos manuais.

**Principais Diferenciais:**
*   **Economia Operacional Extrema:** Impressão de ordens de serviço otimizada em via dupla (Via Oficina e Via Cliente) na mesma folha (orientação Paisagem, com vias em Retrato lado a lado) e divisória de corte, reduzindo o consumo de papel pela metade.
*   **Conformidade Fiscal Simplificada:** Geração automática do *Relatório Mensal de Receitas Brutas do MEI* preenchido dinamicamente com os dados cadastrados no perfil da empresa.
*   **Automação de Cadastro:** Integração transparente com a API pública do ViaCEP para preenchimento ágil de endereços ao cadastrar clientes ou fornecedores.

---

## 2. Requisitos Funcionais (Módulos do Sistema)

### 2.1 Gestão de Ordens de Serviço (OS) e Orçamentos
*   **Cadastro Ágil de Clientes:** Durante a criação de uma OS, o operador pode buscar um cliente pelo nome, telefone ou CPF. Caso não encontre, é disponibilizado um modal de cadastro rápido integrado ao ViaCEP.
*   **Controle de Entrada de Equipamentos:** Registro detalhado do tipo de equipamento, marca, modelo, número de série, estado físico e observações.
*   **Ciclo de Vida da OS:** Transições de status bem definidas:
    *   *Aguardando Orçamento*
    *   *Orçamento Aprovado*
    *   *Em Reparo*
    *   *Pronto para Retirada*
    *   *Entregue ao Cliente*
    *   *Sem Conserto / Descarte*
*   **Composição de Custos:** Permite adicionar peças do estoque e valores de mão de obra para precificar o orçamento com precisão.

### 2.2 Impressão Inteligente de OS (BudgetPrintModal)
*   **Duas Vias Lado a Lado:** Uma única página A4 impressa horizontalmente (Paisagem) que abriga duas vias de visualização vertical (Retrato): uma para a Oficina e outra para o Cliente.
*   **Sem Desperdício de Papel:** CSS customizado para impressão (`@media print`) que oculta elementos desnecessários da tela, recalcula margens exatas e remove quebras de página espúrias, evitando a emissão de páginas em branco adicionais.
*   **Indicação de Corte:** Divisória de corte pontilhada visualizável e imprimível equipada com um ícone de tesoura para facilidade de manuseio físico.

### 2.3 Módulo Financeiro e Frente de Caixa (PDV)
*   **PDV Rápido:** Frente de caixa simplificada para a venda de peças avulsas ou serviços diretamente aos clientes, com suporte a descontos (em valor absoluto ou percentual).
*   **Fluxo de Caixa Consolidado:** Lançamentos em tempo real de contas a pagar (fornecedores, utilidades, impostos) e contas a receber (vendas do PDV e faturamento de OS).
*   **Impressão de Cupom Não Fiscal:** Suporte à visualização e impressão térmica em bobina de 80mm para recibos rápidos de vendas.

### 2.4 Compras e Controle de Estoque
*   **Entrada via XML de NF-e:** Importação direta de notas fiscais de compra de autopeças ou insumos eletrônicos, povoando o estoque automaticamente com as quantidades e valores faturados.
*   **Alertas de Reposição:** Monitoramento de estoque mínimo que destaca em vermelho itens críticos para evitar paradas na bancada.

### 2.5 Relatório Mensal MEI (MeiReportView)
*   **Autopreenchimento Cadastral:** Sincronização dinâmica com os dados definidos no Perfil da Empresa (Razão Social, CNPJ, Cidade, UF).
*   **Faturamento Categorizado:** Divisão inteligente do faturamento mensal consolidado entre:
    *   *Revenda de Mercadorias (Comércio)* — oriundo do PDV e vendas de peças.
    *   *Prestação de Serviços* — oriundo do fechamento de ordens de serviço.
*   **Pronto para Assinatura:** Documento formatado conforme as diretrizes federais, contendo campos para local, data e assinatura do empreendedor, ideal para exportação em PDF e arquivamento anual.

---

## 3. Arquitetura e Stack Tecnológica

### 3.1 Pilha Tecnológica Principal
*   **Framework:** React 18+ (Vite)
*   **Linguagem:** TypeScript (Strict Mode)
*   **Estilização:** Tailwind CSS (Integração rápida e classes utilitárias responsivas)
*   **Ícones:** Lucide React
*   **Animações:** Motion (motion/react)
*   **Visualização de Dados:** Recharts (para relatórios financeiros e gráficos do Dashboard)
*   **Armazenamento de Dados:** Estado em memória e persistência reativa (simulando integração duradoura via DTOs limpos).

### 3.2 Estrutura de Diretórios
```bash
src/
├── App.tsx                    # Orquestrador de Telas e Navegação Lateral
├── main.tsx                   # Entrada principal do React
├── index.css                  # Folha de estilo global e overrides para impressão
├── types.ts                   # Interfaces de dados compartilhadas (OS, Cliente, Fornecedor)
├── utils.ts                   # Funções de formatação (BRL, datas) e mocks de inicialização
└── components/                # Componentes modulares reutilizáveis
    ├── BudgetPrintModal.tsx   # Modal de impressão ecológica de OS em via dupla
    ├── CalendarHeader.tsx     # Agenda de controle de prazos e OS
    ├── CompanyProfileView.tsx # Cadastro do Perfil da Oficina e Certificado Digital
    ├── FinancialModuleView.tsx# Frente de caixa (PDV), fluxo de caixa e contas
    ├── MeiReportView.tsx      # Gerador de relatório anual e mensal MEI estruturado
    ├── OrderManagementView.tsx# Central operacional de Ordens de Serviço
    └── PurchasesAndStockView.tsx # Painel de Compras, XML de Notas e Controle de Peças
```

---

## 4. Requisitos Não Funcionais

### 4.1 Desempenho e Responsividade
*   **Interface Fluida:** Transições leves de tela utilizando `motion` para garantir uma experiência confortável para o usuário em computadores de escritório antigos.
*   **Layout Responsivo:** Suporte completo em monitores de alta resolução e layouts amigáveis para tablets de atendimento de balcão.

### 4.2 Segurança e Privacidade
*   **Armazenamento Isolado:** Os dados cadastrais sensíveis (como Certificado Digital A1 e CNPJ) residem de forma segura na memória do cliente, eliminando riscos de vazamento em servidores compartilhados.

---

## 5. Próximos Passos de Desenvolvimento (Roadmap)
1.  **Integração com Gateway de Pagamentos:** Permitir a geração direta de links de pagamento (PIX e Cartão) ao enviar o orçamento por WhatsApp para o cliente.
2.  **Sincronização em Nuvem (Firebase/Firestore):** Persistência distribuída para oficinas que trabalham com mais de um técnico simultaneamente na bancada.
3.  **Emissão de NFS-e (Nota Fiscal de Serviço Eletrônica):** Integração automática com APIs de prefeituras para faturar a OS convertida diretamente em nota fiscal homologada.
