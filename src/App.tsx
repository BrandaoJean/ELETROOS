import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  FileText, 
  Building2, 
  Search, 
  Bell, 
  Moon, 
  Sun,
  Laptop,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  ShieldAlert
} from 'lucide-react';

// Import Firebase Setup
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Import Types
import { 
  ServiceOrder, 
  Client, 
  BankTransaction, 
  PushNotification, 
  PaymentItem, 
  OSStatus, 
  Supplier, 
  Product, 
  ServiceTemplate, 
  ProductPurchase,
  FinancialAccountItem,
  InserviceableAsset,
  CompanyProfile,
  User
} from './types';

// Import Utilities & Mock Data
import { 
  mockClients, 
  mockServiceOrders, 
  mockBankTransactions, 
  mockNotifications,
  mockSuppliers,
  mockProducts,
  mockServiceTemplates,
  mockPurchases,
  formatBRL 
} from './utils';

// Import Modular Components
import CalendarHeader from './components/CalendarHeader';
import DashboardView from './components/DashboardView';
import OrderManagementView from './components/OrderManagementView';
import PaymentModal from './components/PaymentModal';
import ClientDirectoryView from './components/ClientDirectoryView';
import MeiReportView from './components/MeiReportView';
import BankReconciliationView from './components/BankReconciliationView';
import ClientTracker from './components/ClientTracker';
import PurchasesAndStockView from './components/PurchasesAndStockView';
import ServicesCatalogView from './components/ServicesCatalogView';
import FinancialModuleView from './components/FinancialModuleView';
import InserviceableAssetsView from './components/InserviceableAssetsView';
import CompanyProfileView from './components/CompanyProfileView';
import LoginView from './components/LoginView';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Users State (Authentication)
  const [users, setRawUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('eletroos_users');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'U-001',
        name: 'Administrador',
        username: 'admin',
        email: 'brandao.jean@gmail.com',
        role: 'administrador',
        password: 'admin',
        companyCnpj: '12.345.678/0001-90'
      },
      {
        id: 'U-002',
        name: 'Técnico Silva',
        username: 'tecnico',
        email: 'tecnico@eletroos.com.br',
        role: 'tecnico',
        password: '123',
        companyCnpj: '12.345.678/0001-90'
      }
    ];
  });

  // Current Logged-in User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eletroos_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Core Entity States (With LocalStorage Hydration)
  const [orders, setRawOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('eletroos_orders');
    return saved ? JSON.parse(saved) : mockServiceOrders;
  });

  const [clients, setRawClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('eletroos_clients');
    return saved ? JSON.parse(saved) : mockClients;
  });

  const [bankTransactions, setRawBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('eletroos_transactions');
    return saved ? JSON.parse(saved) : mockBankTransactions;
  });

  const [notifications, setRawNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('eletroos_notifications');
    return saved ? JSON.parse(saved) : mockNotifications;
  });

  const [suppliers, setRawSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('eletroos_suppliers');
    return saved ? JSON.parse(saved) : mockSuppliers;
  });

  const [products, setRawProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('eletroos_products');
    return saved ? JSON.parse(saved) : mockProducts;
  });

  const [serviceTemplates, setRawServiceTemplates] = useState<ServiceTemplate[]>(() => {
    const saved = localStorage.getItem('eletroos_services');
    return saved ? JSON.parse(saved) : mockServiceTemplates;
  });

  const [purchases, setRawPurchases] = useState<ProductPurchase[]>(() => {
    const saved = localStorage.getItem('eletroos_purchases');
    return saved ? JSON.parse(saved) : mockPurchases;
  });

  const [manualAccounts, setRawManualAccounts] = useState<FinancialAccountItem[]>(() => {
    const saved = localStorage.getItem('eletroos_manual_accounts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ACC-001',
        type: 'pagar',
        description: 'Aluguel do Galpão / Oficina',
        category: 'Aluguel',
        amount: 1200.00,
        dueDate: '2026-07-10',
        paymentDate: '2026-07-10',
        status: 'pago',
        paymentMethod: 'pix'
      },
      {
        id: 'ACC-002',
        type: 'pagar',
        description: 'Fatura de Energia Elétrica Enel',
        category: 'Utilidades',
        amount: 345.80,
        dueDate: '2026-07-15',
        status: 'pendente'
      },
      {
        id: 'ACC-003',
        type: 'pagar',
        description: 'Serviço de Internet Fibra',
        category: 'Comunicações',
        amount: 149.90,
        dueDate: '2026-07-20',
        status: 'pendente'
      },
      {
        id: 'ACC-004',
        type: 'receber',
        description: 'Venda de Sucata de Cobre / Placas',
        category: 'Reciclagem',
        amount: 280.00,
        dueDate: '2026-07-05',
        paymentDate: '2026-07-05',
        status: 'pago',
        paymentMethod: 'dinheiro'
      },
      {
        id: 'ACC-005',
        type: 'receber',
        description: 'Consultoria de Recuperação de Inversor',
        category: 'Serviço Externo',
        amount: 450.00,
        dueDate: '2026-07-18',
        status: 'pendente'
      }
    ];
  });

  const [inserviceableAssets, setRawInserviceableAssets] = useState<InserviceableAsset[]>(() => {
    const saved = localStorage.getItem('eletroos_inserviceable_assets');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ATV-1001',
        clientId: 'C-001',
        clientName: 'Ana Paula Lima',
        clientPhone: '(11) 98765-4321',
        equipment: 'Smart TV 55"',
        brand: 'Samsung',
        model: 'UN55TU8000GXZD',
        serialNumber: 'Z6YH3X8N901234',
        entryDate: '2026-07-02',
        origin: 'ordem_servico',
        originId: 'OS-1001',
        remunerated: false,
        valuePaid: 0,
        status: 'descartado',
        notes: 'Display trincado. Cliente autorizou descarte ecológico.'
      }
    ];
  });

  const [companyProfile, setRawCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('eletroos_company_profile');
    if (saved) return JSON.parse(saved);
    return {
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'EletroOS Eletrônica e Manutenção MEI',
      nomeFantasia: 'EletroOS Assistência Técnica',
      cnaeCode: '9521-5/00',
      cnaeDesc: 'Reparação e manutenção de equipamentos eletroeletrônicos de uso pessoal e doméstico',
      taxRegime: 'mei',
      stateRegistration: 'Isento',
      municipalRegistration: '987654-32',
      taxRateSimple: 0,
      icmsRate: 0,
      issqnRate: 2.01,
      digitalCertificateUploaded: false,
      nfeSerie: '1',
      nfeNextNumber: '1',
      cep: '01001-000',
      address: 'Praça da Sé',
      number: '355',
      complement: 'lado ímpar',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 3242-2211',
      email: 'contato@eletroos.com.br',
      environment: 'homologacao'
    };
  });

  // State Refs to prevent stale closures in Firebase sync
  const ordersRef = useRef(orders);
  const clientsRef = useRef(clients);
  const bankTransactionsRef = useRef(bankTransactions);
  const notificationsRef = useRef(notifications);
  const suppliersRef = useRef(suppliers);
  const productsRef = useRef(products);
  const serviceTemplatesRef = useRef(serviceTemplates);
  const purchasesRef = useRef(purchases);
  const manualAccountsRef = useRef(manualAccounts);
  const inserviceableAssetsRef = useRef(inserviceableAssets);
  const companyProfileRef = useRef(companyProfile);
  const usersRef = useRef(users);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { clientsRef.current = clients; }, [clients]);
  useEffect(() => { bankTransactionsRef.current = bankTransactions; }, [bankTransactions]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  useEffect(() => { suppliersRef.current = suppliers; }, [suppliers]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { serviceTemplatesRef.current = serviceTemplates; }, [serviceTemplates]);
  useEffect(() => { purchasesRef.current = purchases; }, [purchases]);
  useEffect(() => { manualAccountsRef.current = manualAccounts; }, [manualAccounts]);
  useEffect(() => { inserviceableAssetsRef.current = inserviceableAssets; }, [inserviceableAssets]);
  useEffect(() => { companyProfileRef.current = companyProfile; }, [companyProfile]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Firebase Real-Time Synchronization Setter Generator
  function createFirebaseSyncSetter<T extends { id: string }>(
    collectionName: string,
    localSetter: React.Dispatch<React.SetStateAction<T[]>>,
    stateRef: React.MutableRefObject<T[]>,
    localStorageKey: string
  ) {
    return (value: React.SetStateAction<T[]>) => {
      const currentState = stateRef.current;
      const newState = typeof value === 'function' 
        ? (value as (prev: T[]) => T[])(currentState) 
        : value;

      // Update locally first
      localStorage.setItem(localStorageKey, JSON.stringify(newState));
      localSetter(newState);

      // Write differential updates to Firebase if authenticated
      if (auth.currentUser) {
        const existingMap = new Map<string, T>(currentState.map(item => [item.id, item]));
        const newMap = new Map<string, T>(newState.map(item => [item.id, item]));

        newMap.forEach(async (newItem, id) => {
          const existingItem = existingMap.get(id);
          if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
            try {
              await setDoc(doc(db, collectionName, id), newItem);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
            }
          }
        });

        existingMap.forEach(async (_, id) => {
          if (!newMap.has(id)) {
            try {
              await deleteDoc(doc(db, collectionName, id));
            } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
            }
          }
        });
      }
    };
  }

  // Synced Wrapper Setters
  const setOrders = createFirebaseSyncSetter('orders', setRawOrders, ordersRef, 'eletroos_orders');
  const setClients = createFirebaseSyncSetter('clients', setRawClients, clientsRef, 'eletroos_clients');
  const setBankTransactions = createFirebaseSyncSetter('bankTransactions', setRawBankTransactions, bankTransactionsRef, 'eletroos_transactions');
  const setNotifications = createFirebaseSyncSetter('notifications', setRawNotifications, notificationsRef, 'eletroos_notifications');
  const setSuppliers = createFirebaseSyncSetter('suppliers', setRawSuppliers, suppliersRef, 'eletroos_suppliers');
  const setProducts = createFirebaseSyncSetter('products', setRawProducts, productsRef, 'eletroos_products');
  const setServiceTemplates = createFirebaseSyncSetter('serviceTemplates', setRawServiceTemplates, serviceTemplatesRef, 'eletroos_services');
  const setPurchases = createFirebaseSyncSetter('purchases', setRawPurchases, purchasesRef, 'eletroos_purchases');
  const setManualAccounts = createFirebaseSyncSetter('manualAccounts', setRawManualAccounts, manualAccountsRef, 'eletroos_manual_accounts');
  const setInserviceableAssets = createFirebaseSyncSetter('inserviceableAssets', setRawInserviceableAssets, inserviceableAssetsRef, 'eletroos_inserviceable_assets');
  const setUsers = createFirebaseSyncSetter('users', setRawUsers, usersRef, 'eletroos_users');

  const setCompanyProfile = async (value: React.SetStateAction<CompanyProfile>) => {
    const currentState = companyProfileRef.current;
    const newState = typeof value === 'function' ? (value as Function)(currentState) : value;
    
    localStorage.setItem('eletroos_company_profile', JSON.stringify(newState));
    setRawCompanyProfile(newState);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'companyProfile', 'default'), newState);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'companyProfile/default');
      }
    }
  };

  // Firebase Auth State Observer & Real-Time Sync Listeners
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const unsubscribes = [
          onSnapshot(collection(db, 'orders'), (snapshot) => {
            const list: ServiceOrder[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as ServiceOrder));
            setRawOrders(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders')),

          onSnapshot(collection(db, 'clients'), (snapshot) => {
            const list: Client[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as Client));
            setRawClients(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients')),

          onSnapshot(collection(db, 'bankTransactions'), (snapshot) => {
            const list: BankTransaction[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as BankTransaction));
            setRawBankTransactions(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'bankTransactions')),

          onSnapshot(collection(db, 'notifications'), (snapshot) => {
            const list: PushNotification[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as PushNotification));
            setRawNotifications(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')),

          onSnapshot(collection(db, 'suppliers'), (snapshot) => {
            const list: Supplier[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as Supplier));
            setRawSuppliers(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'suppliers')),

          onSnapshot(collection(db, 'products'), (snapshot) => {
            const list: Product[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as Product));
            setRawProducts(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'products')),

          onSnapshot(collection(db, 'serviceTemplates'), (snapshot) => {
            const list: ServiceTemplate[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as ServiceTemplate));
            setRawServiceTemplates(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'serviceTemplates')),

          onSnapshot(collection(db, 'purchases'), (snapshot) => {
            const list: ProductPurchase[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as ProductPurchase));
            setRawPurchases(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'purchases')),

          onSnapshot(collection(db, 'manualAccounts'), (snapshot) => {
            const list: FinancialAccountItem[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as FinancialAccountItem));
            setRawManualAccounts(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'manualAccounts')),

          onSnapshot(collection(db, 'inserviceableAssets'), (snapshot) => {
            const list: InserviceableAsset[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as InserviceableAsset));
            setRawInserviceableAssets(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'inserviceableAssets')),

          onSnapshot(collection(db, 'users'), (snapshot) => {
            const list: User[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as User));
            setRawUsers(list);
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'users')),

          onSnapshot(doc(db, 'companyProfile', 'default'), (docSnap) => {
            if (docSnap.exists()) {
              setRawCompanyProfile(docSnap.data() as CompanyProfile);
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, 'companyProfile/default'))
        ];

        return () => {
          unsubscribes.forEach(unsub => unsub());
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Selected sub-states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activePaymentOSId, setActivePaymentOSId] = useState<string | null>(null);

  // Dynamic calculations for High Density design
  const currentMonthRevenue = useMemo(() => {
    return orders.reduce((sum, o) => {
      if (o.isPaid) {
        const payDate = o.paymentDate || o.createdAt;
        const d = new Date(payDate);
        if (d.getFullYear() === 2026 && d.getMonth() === 6) {
          return sum + o.totalCost;
        }
      }
      return sum;
    }, 0);
  }, [orders]);

  const agendaOrders = useMemo(() => {
    const activeStatuses: OSStatus[] = ['aguardando_orcamento', 'orcamento_aprovado', 'em_reparo', 'pronto'];
    const localToday = new Date();
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return orders.filter(o => {
      if (!activeStatuses.includes(o.status)) return false;
      if (!o.dueDate) return false;
      return o.dueDate.split('T')[0] === todayStr;
    });
  }, [orders]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Save to local storage whenever states change
  useEffect(() => {
    localStorage.setItem('eletroos_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('eletroos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('eletroos_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('eletroos_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('eletroos_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('eletroos_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('eletroos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('eletroos_services', JSON.stringify(serviceTemplates));
  }, [serviceTemplates]);

  useEffect(() => {
    localStorage.setItem('eletroos_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('eletroos_manual_accounts', JSON.stringify(manualAccounts));
  }, [manualAccounts]);

  useEffect(() => {
    localStorage.setItem('eletroos_inserviceable_assets', JSON.stringify(inserviceableAssets));
  }, [inserviceableAssets]);

  useEffect(() => {
    localStorage.setItem('eletroos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('eletroos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('eletroos_current_user');
    }
  }, [currentUser]);

  // Deployment handler to clear the database and save the new profile/admin
  const handleDeploySystem = (companyData: Partial<CompanyProfile>, adminUser: Partial<User>) => {
    // 1. Create company profile
    const newCompany: CompanyProfile = {
      cnpj: companyData.cnpj || '00.000.000/0000-00',
      razaoSocial: companyData.razaoSocial || '',
      nomeFantasia: companyData.nomeFantasia || companyData.razaoSocial || '',
      cnaeCode: '9521-5/00',
      cnaeDesc: 'Reparação e manutenção de equipamentos eletroeletrônicos de uso pessoal e doméstico',
      taxRegime: 'mei',
      stateRegistration: 'Isento',
      municipalRegistration: '',
      taxRateSimple: 0,
      icmsRate: 0,
      issqnRate: 2.0,
      digitalCertificateUploaded: false,
      nfeSerie: '1',
      nfeNextNumber: '1',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      environment: 'homologacao'
    };

    // 2. Create admin user
    const newAdmin: User = {
      id: 'U-' + Date.now(),
      name: adminUser.name || 'Administrador',
      username: adminUser.username || 'admin',
      email: adminUser.email || '',
      role: 'administrador',
      password: adminUser.password || 'admin',
      companyCnpj: newCompany.cnpj
    };

    // 3. Clear all states & Save to localStorage
    setOrders([]);
    setClients([]);
    setBankTransactions([]);
    setNotifications([]);
    setSuppliers([]);
    setProducts([]);
    setServiceTemplates([]);
    setPurchases([]);
    setManualAccounts([]);
    setInserviceableAssets([]);
    
    // Set company profile and user lists
    setCompanyProfile(newCompany);
    const newUsersList = [newAdmin];
    setUsers(newUsersList);
    
    // Log in this user
    setCurrentUser(newAdmin);

    // Save empty lists to localStorage explicitly to prevent any fallback loading on next mount
    localStorage.setItem('eletroos_orders', JSON.stringify([]));
    localStorage.setItem('eletroos_clients', JSON.stringify([]));
    localStorage.setItem('eletroos_transactions', JSON.stringify([]));
    localStorage.setItem('eletroos_notifications', JSON.stringify([]));
    localStorage.setItem('eletroos_suppliers', JSON.stringify([]));
    localStorage.setItem('eletroos_products', JSON.stringify([]));
    localStorage.setItem('eletroos_services', JSON.stringify([]));
    localStorage.setItem('eletroos_purchases', JSON.stringify([]));
    localStorage.setItem('eletroos_manual_accounts', JSON.stringify([]));
    localStorage.setItem('eletroos_inserviceable_assets', JSON.stringify([]));
    localStorage.setItem('eletroos_company_profile', JSON.stringify(newCompany));
    localStorage.setItem('eletroos_users', JSON.stringify(newUsersList));
    localStorage.setItem('eletroos_current_user', JSON.stringify(newAdmin));
    localStorage.setItem('eletroos_installed', 'true');
    
    // Redirect to dashboard
    setActiveTab('dashboard');
  };

  // Re-onboarding / trigger deployment wizard from profile tab
  const handleResetSystem = () => {
    setCurrentUser(null);
    localStorage.removeItem('eletroos_current_user');
    localStorage.removeItem('eletroos_installed');
  };

  // Log out session
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Erro ao sair do Firebase:", e);
    }
    setCurrentUser(null);
  };

  // Handler: Select OS globally (e.g. from calendar or dashboard clicking)
  const handleSelectOrder = (id: string | null) => {
    setSelectedOrderId(id);
    setActiveTab('orders');
    // Scroll to active OS details
    setTimeout(() => {
      const el = document.getElementById('detalhes-os-selecionada');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handler: Add a manual account expense or revenue
  const handleAddManualAccount = (acc: Omit<FinancialAccountItem, 'id'>) => {
    const newId = `ACC-${100 + manualAccounts.length + 1}`;
    setManualAccounts(prev => [...prev, { ...acc, id: newId }]);
  };

  // Handler: Add unserviceable asset
  const handleDiscardAsset = (asset: {
    clientId?: string;
    clientName: string;
    clientPhone?: string;
    equipment: string;
    brand: string;
    model: string;
    serialNumber: string;
    notes: string;
    remunerated: boolean;
    valuePaid: number;
    paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carteira';
    originId?: string;
  }) => {
    const newId = `ATV-${1000 + inserviceableAssets.length + 1}`;
    const newAsset: InserviceableAsset = {
      id: newId,
      clientId: asset.clientId,
      clientName: asset.clientName,
      clientPhone: asset.clientPhone,
      equipment: asset.equipment,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      entryDate: new Date().toISOString().split('T')[0],
      origin: asset.originId ? 'ordem_servico' : 'direto',
      originId: asset.originId,
      remunerated: asset.remunerated,
      valuePaid: asset.valuePaid,
      status: 'recebido',
      notes: asset.notes
    };

    setInserviceableAssets(prev => [newAsset, ...prev]);

    // If remunerated, post expense to financial manual accounts
    if (asset.remunerated && asset.valuePaid > 0) {
      handleAddManualAccount({
        type: 'pagar',
        description: `Compra de Sucata p/ Descarte - ${asset.equipment} (${asset.clientName})`,
        category: 'Compra de Ativos para Sucata',
        amount: asset.valuePaid,
        dueDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'pago',
        paymentMethod: asset.paymentMethod || 'dinheiro',
        clientOrSupplierName: asset.clientName,
        originId: newId
      });
    }
  };

  // Handler: Add client
  const handleAddClient = (newClientFields: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newId = `C-00${clients.length + 1}`;
    const newClient: Client = {
      ...newClientFields,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    alert(`Cliente ${newClient.name} cadastrado com sucesso!`);
    return newClient;
  };

  // Handler: Update client details
  const handleUpdateClient = (id: string, updatedFields: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    
    // Propagate changes to orders
    if (updatedFields.name || updatedFields.phone) {
      setOrders(prev => prev.map(o => {
        if (o.clientId === id) {
          return {
            ...o,
            clientName: updatedFields.name || o.clientName,
            clientPhone: updatedFields.phone || o.clientPhone
          };
        }
        return o;
      }));
    }
    alert('Cadastro do cliente atualizado com sucesso!');
  };

  // Handler: Add Order
  const handleAddOrder = (newOrderFields: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'payments' | 'isPaid'>) => {
    const newId = `OS-${1000 + orders.length + 1}`;
    const initialHistory = [
      {
        timestamp: new Date().toISOString(),
        status: 'aguardando_orcamento' as OSStatus,
        note: `Ordem de Serviço criada com prazo em ${new Date(newOrderFields.dueDate || '').toLocaleDateString('pt-BR')}.`
      }
    ];

    const newOrder: ServiceOrder = {
      ...newOrderFields,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: initialHistory,
      payments: [],
      isPaid: false
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedOrderId(newId);
    
    // Auto-generate a push notification for this client intake
    const newNotification: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Aparelho Recebido na Oficina',
      body: `Nova OS ${newId} gerada para ${newOrder.clientName}. Notificação push enviada.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    alert(`Ordem de serviço ${newId} cadastrada com sucesso!`);
  };

  // Handler: Update Order details/diagnostics/parts
  const handleUpdateOrder = (id: string, updatedFields: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatedFields } : o));
  };

  // Handler: Multi-split Payment settlement confirmation
  const handleConfirmPayment = (
    orderId: string,
    payments: PaymentItem[],
    updatedWalletBalance?: number,
    updatedEquipmentDetails?: { equipment: string; brand: string; model: string; serialNumber: string }
  ) => {
    // 1. Mark order as paid and transition status
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const historyNote = `Conta liquidada na oficina. Formas de pagamento: ${payments.map(p => p.method.toUpperCase()).join(', ')}.`;
        const newHistoryEvent = {
          timestamp: new Date().toISOString(),
          status: o.status === 'pronto' ? 'entregue' as OSStatus : o.status,
          note: historyNote
        };
        return {
          ...o,
          isPaid: true,
          status: o.status === 'pronto' ? 'entregue' : o.status,
          payments: payments,
          paymentDate: new Date().toISOString(),
          history: [...o.history, newHistoryEvent],
          updatedAt: new Date().toISOString(),
          ...(updatedEquipmentDetails || {})
        };
      }
      return o;
    }));

    // 2. If client wallet balance was altered, update it
    const activeOS = orders.find(o => o.id === orderId);
    if (activeOS && updatedWalletBalance !== undefined) {
      setClients(prev => prev.map(c => c.id === activeOS.clientId ? { ...c, walletBalance: updatedWalletBalance } : c));
    }

    // 3. Trigger a success push notification
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Pagamento Confirmado',
      body: `A OS ${orderId} foi liquidada com sucesso. Recibo enviado por WhatsApp/Impressão.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Handler: Update Client Wallet balance directly (ledger addition)
  const handleUpdateClientWallet = (id: string, addition: number) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, walletBalance: c.walletBalance + addition } : c));
    alert(`Crédito de ${formatBRL(addition)} adicionado à carteira própria do cliente!`);
  };

  // Handler: Single-Click Bank Reconciliation match
  const handleReconcile = (transactionId: string, orderId: string, method: string, amount: number) => {
    // 1. Mark bank transaction as reconciled
    setBankTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, status: 'conciliado', matchedOsId: orderId } : tx));

    // 2. Clear outstanding payment on the order
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const historyNote = `CONCILIAÇÃO BANCÁRIA AUTOMÁTICA: Pagamento de ${formatBRL(amount)} baixado via API Open Finance.`;
        const newEvent = {
          timestamp: new Date().toISOString(),
          status: 'pronto' as OSStatus, // Advance status to ready automatically on payment
          note: historyNote
        };
        return {
          ...o,
          isPaid: true,
          status: 'pronto',
          paymentDate: new Date().toISOString(),
          payments: [{ method: method === 'pix' ? 'pix' : 'cartao_credito', amount, timestamp: new Date().toISOString() }],
          history: [...o.history, newEvent],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // 3. Create push notifications
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Conciliação Realizada',
      body: `Pagamento recebido na API bancária conciliado com sucesso para a OS ${orderId}.`,
      type: 'reconciliation',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert(`Conciliação finalizada! Ordem de serviço ${orderId} atualizada para PAGO.`);
  };

  // Handler: Simulated webhook/Open Finance transaction reload
  const handleRefreshTransactions = () => {
    // Mock new transaction arriving
    const newTx: BankTransaction = {
      id: `TX-00${bankTransactions.length + 1}`,
      timestamp: new Date().toISOString(),
      description: 'PIX Recebido - ANA PAULA LIMA',
      amount: 270.00,
      method: 'pix',
      status: 'pendente'
    };
    setBankTransactions(prev => [newTx, ...prev]);
  };

  // Handler: Trigger push notifications for clients from dashboard controls
  const handleTriggerNotification = (type: 'billing' | 'payment_pending') => {
    const id = `N-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    let title = '';
    let body = '';

    if (type === 'billing') {
      title = 'Lembrete de Cobrança Recorrente';
      body = 'Notificação push enviada para Roberto de Oliveira: Assinatura do plano de manutenção mensal vence em 5 dias.';
    } else {
      title = 'Aviso de Pagamento Pendente';
      body = 'Notificação push de cobrança enviada para Carlos Eduardo (OS-1003): Orçamento pronto aguardando liquidação.';
    }

    const newNotif: PushNotification = {
      id,
      timestamp,
      title,
      body,
      type,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Handler: Client decides on quote from public portal
  const handleClientDecision = (orderId: string, approved: boolean) => {
    const newStatus = approved ? 'orcamento_aprovado' : 'orcamento_rejeitado';
    const decisionText = approved ? 'APROVADO PELO CLIENTE VIA PORTAL' : 'REJEITADO PELO CLIENTE VIA PORTAL';
    
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newHistoryEvent = {
          timestamp: new Date().toISOString(),
          status: newStatus as OSStatus,
          note: `Decisão do cliente via portal: Orçamento ${approved ? 'Aprovado' : 'Rejeitado'}.`
        };
        return {
          ...o,
          status: newStatus as OSStatus,
          history: [...o.history, newHistoryEvent],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // Trigger notification
    const newNotif: PushNotification = {
      id: `N-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: approved ? 'Orçamento Aprovado' : 'Orçamento Rejeitado',
      body: `O cliente respondeu ao orçamento da ${orderId}: ${approved ? 'Aprovou' : 'Recusou'} o valor.`,
      type: 'status_update',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert(`Sua resposta foi enviada com sucesso! O status da OS foi atualizado para: ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  // Active OS to settle payment
  const activePaymentOS = orders.find(o => o.id === activePaymentOSId);

  if (!currentUser) {
    return (
      <LoginView 
        users={users}
        companyProfile={companyProfile}
        onLoginSuccess={(u) => setCurrentUser(u)}
        onDeploySystem={handleDeploySystem}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* TOP AGENDA BAR */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-40 shadow-xs shrink-0 print:hidden">
        <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider font-display shrink-0">
          Agenda Hoje
        </div>
        
        {/* Dynamic horizontal scrollable row of active orders */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 shrink">
          {agendaOrders.length === 0 ? (
            <span className="text-xs text-slate-400 font-medium italic">Nenhuma OS ativa hoje</span>
          ) : (
            agendaOrders.map((os) => {
              // Status Badge color dot
              let dotColor = "bg-slate-300";
              if (os.status === 'aguardando_orcamento') dotColor = "bg-amber-400";
              if (os.status === 'orcamento_aprovado') dotColor = "bg-blue-400";
              if (os.status === 'em_reparo') dotColor = "bg-indigo-500";
              if (os.status === 'pronto') dotColor = "bg-emerald-500";

              return (
                <button
                  key={os.id}
                  onClick={() => handleSelectOrder(os.id)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0 cursor-pointer transition-all"
                >
                  <span className="font-mono font-bold text-indigo-600 text-[11px]">{os.id}</span>
                  <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">
                    {os.clientName.split(' ')[0]}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                </button>
              );
            })
          )}
        </div>

        {/* Sync Status and Notifications on the right */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Conciliação Bancária</div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado • Real-time
            </div>
          </div>
          
          <button 
            onClick={() => {
              setActiveTab('dashboard');
              setTimeout(() => {
                const el = document.getElementById('notificacoes-container');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg relative cursor-pointer transition-colors"
            title="Ver notificações"
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6 print:block print:p-0 print:m-0 print:max-w-none">
        
        {/* Left navigation sidebar panel */}
        <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-4">
          <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="text-white font-black text-xl tracking-tighter font-display flex items-center gap-1">
                ELETRO<span className="text-indigo-400">OS</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Eletrônica</div>
              
              <div className="mt-3 flex">
                {companyProfile.environment === 'producao' ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-850 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    PRODUÇÃO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-400 border border-amber-850 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    HOMOLOGAÇÃO
                  </span>
                )}
              </div>
            </div>
            
            <nav className="p-3 space-y-1 flex flex-col">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'orders' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Wrench size={14} /> Ordens de Serviço
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'clients' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users size={14} /> Clientes / CPFs
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'reconciliation' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 size={14} /> Conciliação Bancária
              </button>
              <button
                onClick={() => setActiveTab('mei')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'mei' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText size={14} /> Relatório MEI
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'financial' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <DollarSign size={14} /> Financeiro & PDV
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'purchases' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers size={14} /> Compras & Estoque
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'services' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Catálogo de Serviços
              </button>

              <button
                onClick={() => setActiveTab('company')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'company' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 size={14} /> Dados Fiscais & Empresa
              </button>
              
              <div className="border-t border-slate-800/80 my-2" />
              
              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'tracker' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-950/60 border border-indigo-900/30'
                }`}
              >
                <Search size={14} /> Portal do Cliente
              </button>

              <button
                onClick={() => setActiveTab('scrap')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'scrap' 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 shadow-rose-600/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldAlert size={14} /> Ativos Inservíveis
              </button>
            </nav>

            {/* User Session Profile Card */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-black text-white text-xs uppercase shrink-0">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize font-semibold mt-0.5">
                    {currentUser.role === 'administrador' ? 'Painel Admin' : currentUser.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  type="button"
                  title="Sair do Sistema"
                  className="p-1.5 hover:bg-slate-800 hover:text-rose-400 text-slate-500 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sidebar MEI faturamento limits card (High Density) */}
            <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/30">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Faturamento MEI (Jul)</div>
                <div className="text-xs font-bold text-white font-mono">{formatBRL(currentMonthRevenue)} / {formatBRL(6750)}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentMonthRevenue / 6750) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1.5 leading-tight font-medium">Limite prudencial: R$ 6.750/mês</p>
              </div>
            </div>
          </div>

          {/* Quick Support Badge */}
          <div className="bg-white text-slate-600 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5 text-xs hidden lg:block">
            <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600 animate-pulse" />
              Ambiente Homologado
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Recursos de faturamento MEI, orçamentos, e conciliação integrados operando em simulação local.
            </p>
          </div>
        </aside>

        {/* Content Area panel */}
        <main className="flex-1 min-w-0">
          
          {/* Integrated Top Calendar Panel (Visible only on Dashboard) */}
          {activeTab === 'dashboard' && (
            <CalendarHeader 
              orders={orders} 
              onSelectOrder={handleSelectOrder} 
            />
          )}

          {/* View Router */}
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              notifications={notifications}
              onTriggerNotification={handleTriggerNotification}
              onClearNotifications={handleClearNotifications}
              onNavigateToTab={setActiveTab}
              onSelectOrder={handleSelectOrder}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManagementView
              orders={orders}
              clients={clients}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onPayOrder={(id) => setActivePaymentOSId(id)}
              products={products}
              setProducts={setProducts}
              serviceTemplates={serviceTemplates}
              onDiscardAsset={handleDiscardAsset}
              onAddClient={handleAddClient}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesAndStockView
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              products={products}
              setProducts={setProducts}
              purchases={purchases}
              setPurchases={setPurchases}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeTab === 'services' && (
            <ServicesCatalogView
              serviceTemplates={serviceTemplates}
              setServiceTemplates={setServiceTemplates}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeTab === 'clients' && (
            <ClientDirectoryView
              clients={clients}
              orders={orders}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onUpdateClientWallet={handleUpdateClientWallet}
              onSelectOrder={setSelectedOrderId}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'reconciliation' && (
            <BankReconciliationView
              transactions={bankTransactions}
              orders={orders}
              onReconcile={handleReconcile}
              onRefreshTransactions={handleRefreshTransactions}
            />
          )}

          {activeTab === 'mei' && (
            <MeiReportView 
              orders={orders} 
              companyProfile={companyProfile}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialModuleView
              orders={orders}
              setOrders={setOrders}
              clients={clients}
              setClients={setClients}
              products={products}
              setProducts={setProducts}
              purchases={purchases}
              setPurchases={setPurchases}
              onTriggerNotification={handleTriggerNotification}
              manualAccounts={manualAccounts}
              setManualAccounts={setManualAccounts}
            />
          )}

          {activeTab === 'tracker' && (
            <ClientTracker
              orders={orders}
              onClientDecision={handleClientDecision}
            />
          )}

          {activeTab === 'scrap' && (
            <InserviceableAssetsView
              assets={inserviceableAssets}
              setAssets={setInserviceableAssets}
              clients={clients}
              onAddManualAccount={handleAddManualAccount}
            />
          )}

          {activeTab === 'company' && (
            <CompanyProfileView
              companyProfile={companyProfile}
              setCompanyProfile={setCompanyProfile}
              onResetSystem={handleResetSystem}
            />
          )}

        </main>

      </div>

      {/* Payment Settlement Modal Container */}
      {activePaymentOS && (
        <PaymentModal
          order={activePaymentOS}
          clients={clients}
          onClose={() => setActivePaymentOSId(null)}
          onConfirmPayment={(orderId, payments, balance, updatedEquip) => {
            handleConfirmPayment(orderId, payments, balance, updatedEquip);
            setActivePaymentOSId(null);
          }}
        />
      )}

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] text-slate-400 font-medium shrink-0 print:hidden">
        EletroOS © 2026 • Ferramenta Completa de Orçamentos, Pagamentos e Controle Financeiro MEI • Versão 2.4.0
      </footer>

    </div>
  );
}
