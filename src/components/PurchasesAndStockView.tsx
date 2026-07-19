import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  FileText, 
  Layers, 
  Search, 
  Upload, 
  Check, 
  FileCode, 
  AlertTriangle, 
  Percent, 
  ShoppingBag, 
  TrendingUp, 
  Coins, 
  ArrowRight,
  UserPlus,
  Briefcase,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { Supplier, Product, ProductPurchase, PurchaseItem } from '../types';
import { formatBRL } from '../utils';

interface PurchasesAndStockViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  purchases: ProductPurchase[];
  setPurchases: React.Dispatch<React.SetStateAction<ProductPurchase[]>>;
  onTriggerNotification: (title: string, body: string, type: 'status_update' | 'billing' | 'payment_pending' | 'reconciliation') => void;
}

export default function PurchasesAndStockView({
  suppliers,
  setSuppliers,
  products,
  setProducts,
  purchases,
  setPurchases,
  onTriggerNotification
}: PurchasesAndStockViewProps) {
  // Navigation tabs inside Compras & Estoque
  const [subTab, setSubTab] = useState<'stock' | 'purchases' | 'suppliers' | 'history'>('stock');

  // Search filters
  const [stockSearch, setStockSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Manual & XML Purchase Mode
  const [purchaseMode, setPurchaseMode] = useState<'manual' | 'xml'>('xml');

  // Supplier Quick Create
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');

  // Product Quick Create
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCost, setProdCost] = useState('0');
  const [prodMargin, setProdMargin] = useState('100'); // %
  const [prodSelling, setProdSelling] = useState('0');
  const [prodStock, setProdStock] = useState('0');
  const [prodSupId, setProdSupId] = useState('');

  // Manual Purchase Form States
  const [manInvoice, setManInvoice] = useState('');
  const [manSupId, setManSupId] = useState('');
  const [manDate, setManDate] = useState(new Date().toISOString().split('T')[0]);
  const [manItems, setManItems] = useState<PurchaseItem[]>([]);
  // Item inputs for manual list
  const [manItemName, setManItemName] = useState('');
  const [manItemSku, setManItemSku] = useState('');
  const [manItemQty, setManItemQty] = useState(1);
  const [manItemCost, setManItemCost] = useState('0');
  const [manItemMargin, setManItemMargin] = useState('100'); // %
  const [manItemSelling, setManItemSelling] = useState('0');

  // XML Import states
  const [xmlContent, setXmlContent] = useState('');
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlParsedData, setXmlParsedData] = useState<{
    invoiceNumber: string;
    purchaseDate: string;
    supplierCnpj: string;
    supplierName: string;
    items: PurchaseItem[];
  } | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Auto-calculate selling price or profit margin
  const calculateSellingPrice = (cost: number, margin: number): number => {
    return cost * (1 + margin / 100);
  };

  const calculateProfitMargin = (cost: number, selling: number): number => {
    if (cost <= 0) return 0;
    return ((selling / cost) - 1) * 100;
  };

  // Quick Supplier Creator
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supCnpj) {
      alert('Nome e CNPJ são obrigatórios');
      return;
    }
    const newSup: Supplier = {
      id: 'FORN_' + Date.now(),
      name: supName,
      cnpj: supCnpj,
      phone: supPhone,
      email: supEmail,
      createdAt: new Date().toISOString()
    };
    setSuppliers(prev => [newSup, ...prev]);
    // reset
    setSupName('');
    setSupCnpj('');
    setSupPhone('');
    setSupEmail('');
    setShowAddSupplierModal(false);
  };

  // Quick Product Creator
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) {
      alert('Nome do produto é obrigatório');
      return;
    }
    const cost = parseFloat(prodCost) || 0;
    const margin = parseFloat(prodMargin) || 0;
    const selling = parseFloat(prodSelling) || calculateSellingPrice(cost, margin);

    const matchedSup = suppliers.find(s => s.id === prodSupId);

    const newProd: Product = {
      id: 'PROD_' + Date.now(),
      name: prodName,
      sku: prodSku || 'SKU-' + Math.floor(Math.random() * 100000),
      costPrice: cost,
      profitMargin: margin,
      sellingPrice: selling,
      stock: parseInt(prodStock) || 0,
      supplierId: prodSupId || undefined,
      supplierName: matchedSup?.name || undefined,
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [newProd, ...prev]);
    // reset
    setProdName('');
    setProdSku('');
    setProdCost('0');
    setProdMargin('100');
    setProdSelling('0');
    setProdStock('0');
    setProdSupId('');
    setShowAddProductModal(false);
  };

  // Handle Manual Item Addition
  const handleAddManualItemToList = () => {
    if (!manItemName) {
      alert('Nome da peça é obrigatório');
      return;
    }
    const cost = parseFloat(manItemCost) || 0;
    const margin = parseFloat(manItemMargin) || 0;
    const selling = parseFloat(manItemSelling) || calculateSellingPrice(cost, margin);

    const newItem: PurchaseItem = {
      name: manItemName,
      sku: manItemSku || 'SKU-' + Math.floor(Math.random() * 100000),
      quantity: manItemQty,
      costPrice: cost,
      profitMargin: margin,
      sellingPrice: selling
    };

    setManItems(prev => [...prev, newItem]);
    setManItemName('');
    setManItemSku('');
    setManItemQty(1);
    setManItemCost('0');
    setManItemMargin('100');
    setManItemSelling('0');
  };

  const handleRemoveManualItemFromList = (index: number) => {
    setManItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save manual purchase
  const handleSaveManualPurchase = () => {
    if (!manInvoice) {
      alert('Número da Nota Fiscal de Entrada é obrigatório');
      return;
    }
    if (!manSupId) {
      alert('Fornecedor é obrigatório');
      return;
    }
    if (manItems.length === 0) {
      alert('Adicione pelo menos um item à compra');
      return;
    }

    const matchedSup = suppliers.find(s => s.id === manSupId);
    if (!matchedSup) return;

    const total = manItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    const newPurchase: ProductPurchase = {
      id: 'PUR_' + Date.now(),
      invoiceNumber: manInvoice,
      supplierId: matchedSup.id,
      supplierName: matchedSup.name,
      purchaseDate: manDate + 'T12:00:00Z',
      items: manItems,
      totalAmount: total
    };

    // 1. Add to purchases list
    setPurchases(prev => [newPurchase, ...prev]);

    // 2. Update/Add Products Stock & Price
    setProducts(prev => {
      let updated = [...prev];
      manItems.forEach(item => {
        const existingIdx = updated.findIndex(p => p.sku === item.sku || p.name.toLowerCase() === item.name.toLowerCase());
        if (existingIdx >= 0) {
          // Update Stock and recalculate weighted cost price
          const existing = updated[existingIdx];
          const newStock = existing.stock + item.quantity;
          // Weighted average cost
          const totalCostAmount = (existing.costPrice * existing.stock) + (item.costPrice * item.quantity);
          const newAvgCost = newStock > 0 ? (totalCostAmount / newStock) : item.costPrice;

          updated[existingIdx] = {
            ...existing,
            stock: newStock,
            costPrice: parseFloat(newAvgCost.toFixed(2)),
            profitMargin: item.profitMargin,
            sellingPrice: item.sellingPrice
          };
        } else {
          // Add as new product
          updated.push({
            id: 'PROD_' + Math.floor(Math.random() * 1000000),
            name: item.name,
            sku: item.sku,
            costPrice: item.costPrice,
            profitMargin: item.profitMargin,
            sellingPrice: item.sellingPrice,
            stock: item.quantity,
            supplierId: matchedSup.id,
            supplierName: matchedSup.name,
            createdAt: new Date().toISOString()
          });
        }
      });
      return updated;
    });

    onTriggerNotification(
      'Compra Registrada (Manual)',
      `NF-e #${manInvoice} registrada com sucesso. Estoque atualizado para ${manItems.length} itens.`,
      'status_update'
    );

    // reset forms
    setManInvoice('');
    setManSupId('');
    setManItems([]);
    setSubTab('stock');
    alert('Compra manual registrada com sucesso! Estoque atualizado.');
  };

  // High Fidelity XML NFe Parser
  const parseNFeXML = (xmlString: string) => {
    try {
      setXmlError(null);
      
      // Basic XML parsing utilizing browser DOMParser or robust regex
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Verify parse error
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error('Formato XML inválido ou corrompido.');
      }

      // Extract NFe details
      // Tag names can be lowercase or camelcase depending on files
      const getTagValue = (tagName: string, parent: Element | Document = xmlDoc): string => {
        const els = parent.getElementsByTagName(tagName);
        return els.length > 0 ? els[0].textContent || '' : '';
      };

      // Nota Fiscal Número
      let invoiceNumber = getTagValue("nNF");
      if (!invoiceNumber) {
        // Fallback regex if tag names are different or namespaced
        const match = xmlString.match(/<nNF>([^<]+)<\/nNF>/i);
        invoiceNumber = match ? match[1] : '';
      }

      // Data de Emissão
      let rawDate = getTagValue("dhEmi") || getTagValue("dEmi");
      if (!rawDate) {
        const match = xmlString.match(/<(?:dhEmi|dEmi)>([^<]+)<\/(?:dhEmi|dEmi)>/i);
        rawDate = match ? match[1] : '';
      }
      const purchaseDate = rawDate ? rawDate.substring(0, 10) : new Date().toISOString().split('T')[0];

      // Emitente (Fornecedor)
      let supplierName = '';
      let supplierCnpj = '';

      const emitEls = xmlDoc.getElementsByTagName("emit");
      if (emitEls.length > 0) {
        supplierName = getTagValue("xNome", emitEls[0]);
        supplierCnpj = getTagValue("CNPJ", emitEls[0]);
      } else {
        const nameMatch = xmlString.match(/<emit>[\s\S]*?<xNome>([^<]+)<\/xNome>[\s\S]*?<\/emit>/i);
        const cnpjMatch = xmlString.match(/<emit>[\s\S]*?<CNPJ>([^<]+)<\/CNPJ>[\s\S]*?<\/emit>/i);
        supplierName = nameMatch ? nameMatch[1] : '';
        supplierCnpj = cnpjMatch ? cnpjMatch[1] : '';
      }

      // CNPJ formatting
      if (supplierCnpj && !supplierCnpj.includes('/')) {
        supplierCnpj = supplierCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
      }

      // Extract Items <det>
      const itemsList: PurchaseItem[] = [];
      const detEls = xmlDoc.getElementsByTagName("det");

      if (detEls.length > 0) {
        for (let i = 0; i < detEls.length; i++) {
          const det = detEls[i];
          const prodName = getTagValue("xProd", det);
          const prodSku = getTagValue("cProd", det);
          const qty = parseFloat(getTagValue("qCom", det)) || 1;
          const unitCost = parseFloat(getTagValue("vUnCom", det)) || 0;

          // Default margin 100%
          const margin = 100;
          const selling = unitCost * 2;

          if (prodName) {
            itemsList.push({
              name: prodName,
              sku: prodSku || 'SKU-' + Math.floor(Math.random() * 100000),
              quantity: qty,
              costPrice: parseFloat(unitCost.toFixed(2)),
              profitMargin: margin,
              sellingPrice: parseFloat(selling.toFixed(2))
            });
          }
        }
      } else {
        // Regex Fallback for items
        const prodMatches = xmlString.matchAll(/<det[^>]*>([\s\S]*?)<\/det>/gi);
        for (const match of prodMatches) {
          const detStr = match[1];
          const nameM = detStr.match(/<xProd>([^<]+)<\/xProd>/i);
          const skuM = detStr.match(/<cProd>([^<]+)<\/cProd>/i);
          const qtyM = detStr.match(/<qCom>([^<]+)<\/qCom>/i);
          const costM = detStr.match(/<vUnCom>([^<]+)<\/vUnCom>/i);

          if (nameM) {
            const name = nameM[1];
            const sku = skuM ? skuM[1] : 'SKU-' + Math.floor(Math.random() * 100000);
            const qty = qtyM ? parseFloat(qtyM[1]) : 1;
            const cost = costM ? parseFloat(costM[1]) : 0;
            const margin = 100;
            const selling = cost * 2;

            itemsList.push({
              name,
              sku,
              quantity: qty,
              costPrice: parseFloat(cost.toFixed(2)),
              profitMargin: margin,
              sellingPrice: parseFloat(selling.toFixed(2))
            });
          }
        }
      }

      if (!invoiceNumber || itemsList.length === 0) {
        throw new Error('Não foi possível extrair dados válidos da NF-e (Verifique se é uma NF-e de entrada brasileira).');
      }

      setXmlParsedData({
        invoiceNumber,
        purchaseDate,
        supplierCnpj: supplierCnpj || '00.000.000/0001-00',
        supplierName: supplierName || 'FORNECEDOR XML SIMULADO',
        items: itemsList
      });

    } catch (err: any) {
      setXmlError(err.message || 'Erro inesperado ao processar arquivo XML.');
      setXmlParsedData(null);
    }
  };

  // XML File Upload Trigger
  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setXmlFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setXmlContent(text);
        parseNFeXML(text);
      };
      reader.readAsText(file);
    }
  };

  // Drag and drop XML handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.xml')) {
      setXmlFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setXmlContent(text);
        parseNFeXML(text);
      };
      reader.readAsText(file);
    } else {
      alert('Por favor, faça upload de um arquivo .xml de NF-e.');
    }
  };

  // Simulate a highly accurate Brazilian NF-e XML
  const handleSimulateExampleNFe = () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260798765432000110550010000104821000104824" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00010482</cNF>
        <natOp>COMPRA DE COMPONENTES DE ASSISTENCIA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>12948</nNF>
        <dhEmi>2026-07-14T10:15:30-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>98765432000110</CNPJ>
        <xNome>Sinal &amp; Imagem Peças de Reposição Ltda</xNome>
        <xFant>Sinal e Imagem Distribuidora</xFant>
        <enderEmit>
          <xLgr>Rua dos Lustres Eletronicos</xLgr>
          <n>420</n>
          <xBairro>Santa Efigenia</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>LED-SAM-55-UN</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>Kit Barras LED Samsung 55" UN55AU7700</xProd>
          <NCM>85299020</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>85.0000</vUnCom>
          <vProd>850.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MAG-ELECT-UNI</cProd>
          <cEAN>7891234567891</cEAN>
          <xProd>Magnetron Microondas Electrolux Universal</xProd>
          <NCM>85407100</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>55.0000</vUnCom>
          <vProd>220.00</vProd>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>CAB-FLAT-LVD-40</cProd>
          <cEAN>7891234567892</cEAN>
          <xProd>Cabo Flat Screen Flex LVDs 40 vias</xProd>
          <NCM>85444900</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>15.0000</qCom>
          <vUnCom>18.0000</vUnCom>
          <vProd>270.00</vProd>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;
    setXmlFile(new File(["sample"], "NFe_Exemplo_Backlight.xml"));
    setXmlContent(sampleXml);
    parseNFeXML(sampleXml);
  };

  // Process XML Import confirmation
  const handleConfirmXmlImport = () => {
    if (!xmlParsedData) return;

    // 1. Ensure supplier exists, if not create it
    let targetSup = suppliers.find(s => s.cnpj.replace(/\D/g, '') === xmlParsedData.supplierCnpj.replace(/\D/g, ''));
    if (!targetSup) {
      targetSup = {
        id: 'FORN_' + Date.now(),
        name: xmlParsedData.supplierName,
        cnpj: xmlParsedData.supplierCnpj,
        phone: '1133334444',
        email: 'contato@' + xmlParsedData.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.br',
        createdAt: new Date().toISOString()
      };
      setSuppliers(prev => [targetSup!, ...prev]);
    }

    const total = xmlParsedData.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    // 2. Register purchase
    const newPurchase: ProductPurchase = {
      id: 'PUR_' + Date.now(),
      invoiceNumber: xmlParsedData.invoiceNumber,
      supplierId: targetSup.id,
      supplierName: targetSup.name,
      purchaseDate: xmlParsedData.purchaseDate + 'T12:00:00Z',
      items: xmlParsedData.items,
      totalAmount: total,
      xmlFileName: xmlFile?.name || 'NFe_importado.xml'
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // 3. Update stock & selling prices in product inventory
    setProducts(prev => {
      let updated = [...prev];
      xmlParsedData.items.forEach(item => {
        const existingIdx = updated.findIndex(p => p.sku === item.sku || p.name.toLowerCase() === item.name.toLowerCase());
        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          const newStock = existing.stock + item.quantity;
          const totalCostAmount = (existing.costPrice * existing.stock) + (item.costPrice * item.quantity);
          const newAvgCost = newStock > 0 ? (totalCostAmount / newStock) : item.costPrice;

          updated[existingIdx] = {
            ...existing,
            stock: newStock,
            costPrice: parseFloat(newAvgCost.toFixed(2)),
            profitMargin: item.profitMargin,
            sellingPrice: item.sellingPrice
          };
        } else {
          updated.push({
            id: 'PROD_' + Math.floor(Math.random() * 1000000),
            name: item.name,
            sku: item.sku,
            costPrice: item.costPrice,
            profitMargin: item.profitMargin,
            sellingPrice: item.sellingPrice,
            stock: item.quantity,
            supplierId: targetSup!.id,
            supplierName: targetSup!.name,
            createdAt: new Date().toISOString()
          });
        }
      });
      return updated;
    });

    onTriggerNotification(
      'NF-e XML Importada',
      `Nota Fiscal #${xmlParsedData.invoiceNumber} importada do fornecedor ${targetSup.name}. Peças cadastradas em estoque.`,
      'status_update'
    );

    // Reset xml states
    setXmlFile(null);
    setXmlParsedData(null);
    setXmlContent('');
    setSubTab('stock');
    alert('Nota Fiscal XML importada com sucesso! Estoque e precificação atualizados.');
  };

  // Helper inside loop to update a parsed item's profit margin
  const handleUpdateXmlItemMargin = (index: number, newMargin: number) => {
    if (!xmlParsedData) return;
    const updatedItems = [...xmlParsedData.items];
    const item = updatedItems[index];
    const newSelling = parseFloat(calculateSellingPrice(item.costPrice, newMargin).toFixed(2));
    
    updatedItems[index] = {
      ...item,
      profitMargin: newMargin,
      sellingPrice: newSelling
    };
    setXmlParsedData({
      ...xmlParsedData,
      items: updatedItems
    });
  };

  // Helper to update parsed item's selling price
  const handleUpdateXmlItemSellingPrice = (index: number, newSelling: number) => {
    if (!xmlParsedData) return;
    const updatedItems = [...xmlParsedData.items];
    const item = updatedItems[index];
    const newMargin = parseFloat(calculateProfitMargin(item.costPrice, newSelling).toFixed(2));

    updatedItems[index] = {
      ...item,
      profitMargin: newMargin,
      sellingPrice: newSelling
    };
    setXmlParsedData({
      ...xmlParsedData,
      items: updatedItems
    });
  };

  // Delete product
  const handleDeleteProduct = (prodId: string) => {
    if (confirm('Deseja realmente remover esta peça do estoque?')) {
      setProducts(prev => prev.filter(p => p.id !== prodId));
    }
  };

  // Delete supplier
  const handleDeleteSupplier = (supId: string) => {
    if (confirm('Deseja realmente remover este fornecedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== supId));
    }
  };

  // Filtered lists for rendering
  const filteredProducts = useMemo(() => {
    const search = (stockSearch || '').toLowerCase().trim();
    return products.filter(p => {
      const nameMatch = p.name ? String(p.name).toLowerCase().includes(search) : false;
      const skuMatch = p.sku ? String(p.sku).toLowerCase().includes(search) : false;
      const supplierMatch = p.supplierName ? String(p.supplierName).toLowerCase().includes(search) : false;
      return nameMatch || skuMatch || supplierMatch;
    });
  }, [products, stockSearch]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 5);
  }, [products]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
             s.cnpj.includes(supplierSearch) ||
             s.email.toLowerCase().includes(supplierSearch.toLowerCase());
    });
  }, [suppliers, supplierSearch]);

  const filteredHistory = useMemo(() => {
    return purchases.filter(p => {
      return p.invoiceNumber.includes(historySearch) ||
             p.supplierName.toLowerCase().includes(historySearch.toLowerCase());
    });
  }, [purchases, historySearch]);

  // Overall Inventory Stats
  const stockStats = useMemo(() => {
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const totalSellingValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const totalProfitEst = totalSellingValue - totalCostValue;

    return {
      totalItems,
      totalCostValue,
      totalSellingValue,
      totalProfitEst,
      avgMargin: products.length > 0 ? (products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length) : 0
    };
  }, [products]);

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION WITH STATS */}
      <div className="bg-white border-b border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Painel Integrado
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
              <Layers className="text-indigo-600" size={20} /> Compras & Estoque de Peças
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Módulo de entrada de NF-e, controle de fornecedores, precificação de venda com margem de lucro e controle automático de almoxarifado.
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setSubTab('purchases');
                setPurchaseMode('xml');
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Upload size={14} /> Importar XML NF-e
            </button>
            <button
              onClick={() => {
                setSubTab('purchases');
                setPurchaseMode('manual');
              }}
              className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={14} /> Registrar Compra Manual
            </button>
          </div>
        </div>

        {/* Dashboard mini-bento grid stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unidades em Estoque</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stockStats.totalItems}</p>
            <span className="text-[10px] text-indigo-600 font-semibold">{products.length} itens catalogados</span>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor do Estoque (Custo)</p>
            <p className="text-2xl font-black text-amber-600 font-mono mt-1">{formatBRL(stockStats.totalCostValue)}</p>
            <span className="text-[10px] text-slate-500 font-medium">Investido em fornecedores</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potencial de Venda (Receita)</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{formatBRL(stockStats.totalSellingValue)}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Lucro bruto: +{formatBRL(stockStats.totalProfitEst)}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Margem Média Geral</p>
            <p className="text-2xl font-black text-slate-800 font-mono mt-1">{stockStats.avgMargin.toFixed(1)}%</p>
            <span className="text-[10px] text-indigo-600 font-semibold">Coeficiente multiplicador médio</span>
          </div>
        </div>
      </div>

      {/* VIEW TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white mt-4 px-4 gap-1 rounded-t-2xl">
        <button
          onClick={() => setSubTab('stock')}
          className={`px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            subTab === 'stock' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Almoxarifado & Estoque
        </button>
        <button
          onClick={() => setSubTab('purchases')}
          className={`px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            subTab === 'purchases' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lançar Compra / NF-e
        </button>
        <button
          onClick={() => setSubTab('suppliers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            subTab === 'suppliers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fornecedores
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            subTab === 'history' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Histórico de Entradas
        </button>
      </div>

      {/* CORE VIEW CONTENTS */}
      <div className="py-6">
        
        {/* SUBTAB 1: STOCK & ALMOXARIFADO */}
        {subTab === 'stock' && (
          <div className="space-y-4">
            
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-xl space-y-2 shadow-xs" id="low-stock-alert-banner">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-600 animate-bounce" size={18} />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-850">Alerta de Estoque Baixo para Reposição</h4>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                  Os seguintes itens estão com estoque crítico (5 unidades ou menos) e necessitam de reposição:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {lowStockProducts.map(p => (
                    <span key={p.id} className="bg-amber-100 border border-amber-250 px-2 py-1 rounded text-[10px] font-bold text-amber-950 flex items-center gap-1.5 shadow-xs hover:scale-102 transition-transform">
                      ⚠️ {p.name} (SKU: {p.sku}) • <strong className="font-extrabold text-rose-700">{p.stock} un restante(s)</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Quick Add */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar por nome da peça, SKU ou fornecedor..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="w-full md:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Novo Produto Avulso
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Peça / Produto</th>
                      <th className="p-4">SKU / Identificador</th>
                      <th className="p-4 text-center">Nível Estoque</th>
                      <th className="p-4 text-right">Preço Custo</th>
                      <th className="p-4 text-center">Margem Lucro</th>
                      <th className="p-4 text-right">Preço Venda</th>
                      <th className="p-4">Fornecedor Preferencial</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          Nenhuma peça ou produto encontrado para a busca atual.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        // Stock warning colors
                        let stockBadge = "bg-rose-50 text-rose-700 border-rose-100";
                        let stockMsg = "Sem estoque";
                        if (p.stock > 5) {
                          stockBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                          stockMsg = `${p.stock} un (Saudável)`;
                        } else if (p.stock > 0) {
                          stockBadge = "bg-amber-50 text-amber-700 border-amber-100";
                          stockMsg = `${p.stock} un (Crítico)`;
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">Cadastrado em {new Date(p.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4 font-mono font-semibold text-indigo-600">{p.sku}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${stockBadge}`}>
                                {stockMsg}
                              </span>
                            </td>
                            <td className="p-4 text-right font-semibold text-slate-600 font-mono">{formatBRL(p.costPrice)}</td>
                            <td className="p-4 text-center font-bold text-slate-500 font-mono">
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {p.profitMargin.toFixed(0)}% <Percent size={9} />
                              </span>
                            </td>
                            <td className="p-4 text-right font-black text-indigo-700 font-mono">{formatBRL(p.sellingPrice)}</td>
                            <td className="p-4 text-slate-600 truncate max-w-[150px]">{p.supplierName || 'Avulso/Não especificado'}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => {
                                    // Set editing and open modal
                                    setProdName(p.name);
                                    setProdSku(p.sku);
                                    setProdCost(String(p.costPrice));
                                    setProdMargin(String(p.profitMargin));
                                    setProdSelling(String(p.sellingPrice));
                                    setProdStock(String(p.stock));
                                    setProdSupId(p.supplierId || '');
                                    // Remove old product upon edit to keep it simple or update it
                                    setProducts(prev => prev.filter(item => item.id !== p.id));
                                    setShowAddProductModal(true);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Deletar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: REGISTER INVOICE / PURCHASE */}
        {subTab === 'purchases' && (
          <div className="space-y-6">
            
            {/* Mode Switcher Banner */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Escolha o Método de Entrada:</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPurchaseMode('xml')}
                  className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    purchaseMode === 'xml' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Importação XML da NF-e
                </button>
                <button
                  onClick={() => setPurchaseMode('manual')}
                  className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    purchaseMode === 'manual' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Lançamento Manual
                </button>
              </div>
            </div>

            {/* MODE 1: HIGH FIDELITY XML IMPORT */}
            {purchaseMode === 'xml' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Drag Area and Upload */}
                <div className="lg:col-span-1 space-y-4">
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 shadow-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <FileCode size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Arraste seu XML de NF-e aqui</p>
                      <p className="text-[10px] text-slate-400 mt-1">Ou clique para navegar nas pastas</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleXmlFileUpload} 
                      accept=".xml" 
                      className="hidden" 
                    />
                    
                    {xmlFile && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-3 py-1 text-[10px] font-mono mt-2 truncate w-full">
                        {xmlFile.name}
                      </div>
                    )}
                  </div>

                  {/* Simulator Trigger */}
                  <div className="bg-indigo-950 text-slate-300 p-4 rounded-xl border border-indigo-900 shadow-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-xs">
                      <Sparkles size={14} /> Sandbox de Alta Fidelidade
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Não possui uma chave NF-e ou arquivo XML de peças no momento? Use nosso gerador para processar um XML de alta fidelidade simulado.
                    </p>
                    <button
                      onClick={handleSimulateExampleNFe}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Carregar XML de Peças Exemplo
                    </button>
                  </div>

                  {xmlError && (
                    <div className="bg-rose-50 text-rose-800 border border-rose-100 p-3 rounded-xl text-xs flex gap-1.5">
                      <AlertTriangle size={15} className="shrink-0" />
                      <div>
                        <p className="font-bold">Falha no Processamento</p>
                        <p className="text-[11px] mt-0.5 leading-tight">{xmlError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* XML Items Preview and Margins Adjuster */}
                <div className="lg:col-span-2">
                  {!xmlParsedData ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic text-xs shadow-xs">
                      Aguardando upload ou simulação de XML da NF-e para exibir os produtos de compra...
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-6 p-6">
                      
                      {/* NFe Header metadata */}
                      <div className="border-b border-slate-100 pb-4">
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-mono font-black px-2 py-0.5 rounded w-max uppercase mb-3">
                          Dados da NF-e Processados com Sucesso
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">NF-e Número</span>
                            <span className="font-mono font-black text-slate-800 text-sm">#{xmlParsedData.invoiceNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Emissão da Nota</span>
                            <span className="font-bold text-slate-700 text-xs">{new Date(xmlParsedData.purchaseDate).toLocaleDateString()}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Emitente / Fornecedor</span>
                            <span className="font-bold text-slate-800 text-xs block truncate" title={xmlParsedData.supplierName}>
                              {xmlParsedData.supplierName}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold">{xmlParsedData.supplierCnpj}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items loop with margin settings */}
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-wider mb-3">
                          Peças e Componentes na Nota Fiscal (Defina Margens de Venda)
                        </h4>
                        
                        <div className="space-y-3.5">
                          {xmlParsedData.items.map((item, index) => {
                            const subtotal = item.costPrice * item.quantity;
                            return (
                              <div key={index} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                {/* Item Metadata */}
                                <div className="sm:col-span-4">
                                  <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded font-mono block w-max uppercase mb-1">
                                    {item.sku}
                                  </span>
                                  <p className="text-xs font-bold text-slate-800 leading-snug">{item.name}</p>
                                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    Qtd: <strong className="text-slate-700">{item.quantity} un</strong> • Custo Unit: <strong className="text-slate-700">{formatBRL(item.costPrice)}</strong>
                                  </div>
                                </div>

                                {/* Cost & Subtotal */}
                                <div className="sm:col-span-2 text-left sm:text-right">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Subtotal Custo</span>
                                  <span className="font-mono text-xs font-black text-slate-700">{formatBRL(subtotal)}</span>
                                </div>

                                {/* Profit Margin Editor */}
                                <div className="sm:col-span-3">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Margem de Lucro (%)</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.profitMargin}
                                      onChange={(e) => handleUpdateXmlItemMargin(index, parseFloat(e.target.value) || 0)}
                                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded p-1 pr-5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                    <Percent size={11} className="absolute right-1.5 top-2 text-slate-400" />
                                  </div>
                                </div>

                                {/* Selling Price Editor */}
                                <div className="sm:col-span-3">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Preço Sugerido de Venda</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.sellingPrice}
                                      onChange={(e) => handleUpdateXmlItemSellingPrice(index, parseFloat(e.target.value) || 0)}
                                      className="w-full text-xs font-black bg-white border border-indigo-200 text-indigo-700 rounded p-1 pl-5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                    <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">R$</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary and Import Button */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Total da Nota de Entrada</p>
                          <p className="text-lg font-black text-slate-900 font-mono">
                            {formatBRL(xmlParsedData.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0))}
                          </p>
                        </div>

                        <button
                          onClick={handleConfirmXmlImport}
                          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider"
                        >
                          <Check size={14} /> Confirmar Importação e Abastecer Almoxarifado
                        </button>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}

            {/* MODE 2: MANUAL ENTRY */}
            {purchaseMode === 'manual' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form header details */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    Identificação da Nota & Fornecedor
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500">Nota Fiscal de Entrada (NFe) Nº:</label>
                      <input
                        type="text"
                        placeholder="Ex: 10483"
                        value={manInvoice}
                        onChange={(e) => setManInvoice(e.target.value)}
                        className="mt-1 w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-bold text-slate-500">Fornecedor Emissor:</label>
                        <button
                          onClick={() => setShowAddSupplierModal(true)}
                          className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <UserPlus size={10} /> Novo Fornecedor
                        </button>
                      </div>
                      <select
                        value={manSupId}
                        onChange={(e) => setManSupId(e.target.value)}
                        className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione o fornecedor...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.cnpj})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500">Data de Entrada:</label>
                      <input
                        type="date"
                        value={manDate}
                        onChange={(e) => setManDate(e.target.value)}
                        className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* List builder of items */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                      Adicionar Itens e Precificar Margem
                    </h3>

                    {/* Inline Item adder */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Produto / Peça</label>
                        <input
                          type="text"
                          placeholder="Ex: Teclado Notebook Dell Inspiron"
                          value={manItemName}
                          onChange={(e) => setManItemName(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SKU / Código do Fornecedor</label>
                        <input
                          type="text"
                          placeholder="Ex: TEC-DEL-15R"
                          value={manItemSku}
                          onChange={(e) => setManItemSku(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          value={manItemQty}
                          onChange={(e) => setManItemQty(parseInt(e.target.value) || 1)}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preço de Custo (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manItemCost}
                          onChange={(e) => setManItemCost(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margem de Lucro (%)</label>
                        <input
                          type="number"
                          value={manItemMargin}
                          onChange={(e) => {
                            setManItemMargin(e.target.value);
                            const cost = parseFloat(manItemCost) || 0;
                            const margin = parseFloat(e.target.value) || 0;
                            setManItemSelling(String(calculateSellingPrice(cost, margin)));
                          }}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preço de Venda (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={manItemSelling}
                            onChange={(e) => {
                              setManItemSelling(e.target.value);
                              const cost = parseFloat(manItemCost) || 0;
                              const selling = parseFloat(e.target.value) || 0;
                              setManItemMargin(String(calculateProfitMargin(cost, selling).toFixed(1)));
                            }}
                            className="w-full border border-indigo-200 bg-white text-indigo-700 font-bold rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddManualItemToList}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold cursor-pointer transition-all flex items-center justify-center h-[32px]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                    </div>

                    {/* Manual item list display */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Itens nesta Compra</h4>
                      {manItems.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">Nenhum item adicionado ainda. Preencha o formulário acima e clique em "+".</p>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {manItems.map((item, index) => (
                            <div key={index} className="p-3 bg-slate-50 flex justify-between items-center hover:bg-slate-100/40 transition-colors">
                              <div>
                                <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-600 px-1 rounded mr-2 uppercase">{item.sku}</span>
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {item.quantity} un x {formatBRL(item.costPrice)} • Lucro: <strong className="text-indigo-600">{item.profitMargin}%</strong> • Preço Venda: <strong className="text-emerald-600">{formatBRL(item.sellingPrice)}</strong>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="font-bold font-mono text-slate-700">{formatBRL(item.costPrice * item.quantity)}</span>
                                <button
                                  onClick={() => handleRemoveManualItemFromList(index)}
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

                    {/* Register manual total footer */}
                    {manItems.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total da Compra</p>
                          <p className="text-lg font-black text-slate-900 font-mono">
                            {formatBRL(manItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0))}
                          </p>
                        </div>
                        <button
                          onClick={handleSaveManualPurchase}
                          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 uppercase"
                        >
                          <Check size={14} /> Registrar Nota & Atualizar Estoque
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* SUBTAB 3: SUPPLIERS DIRECTORY */}
        {subTab === 'suppliers' && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar por fornecedor, CNPJ ou email..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="w-full md:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Cadastrar Fornecedor
              </button>
            </div>

            {/* Suppliers Grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-slate-400 italic text-xs bg-white border border-slate-200 rounded-2xl">
                  Nenhum fornecedor cadastrado ou encontrado.
                </div>
              ) : (
                filteredSuppliers.map((s) => {
                  const supProducts = products.filter(p => p.supplierId === s.id);
                  return (
                    <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-200 transition-colors flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 leading-tight">{s.name}</h4>
                            <span className="font-mono text-[9px] text-slate-400 font-bold block mt-0.5">{s.cnpj}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="border-t border-slate-100/85 my-2 pt-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Telefone:</span>
                            <span className="font-semibold text-slate-700">{s.phone || 'Não informado'}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>E-mail:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={s.email}>{s.email || 'Não informado'}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Produtos em estoque:</span>
                            <span className="font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{supProducts.length} peças</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex justify-end">
                        <span className="text-[10px] text-slate-400 font-medium">Desde {new Date(s.createdAt || '2026-07-14').toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* SUBTAB 4: HISTORIC OF PURCHASES */}
        {subTab === 'history' && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar pelo número da nota ou fornecedor..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* List of registered purchase invoices */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">
                  Nenhuma NF-e de entrada ou compra registrada anteriormente.
                </div>
              ) : (
                filteredHistory.map((pur) => (
                  <div key={pur.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    
                    {/* Header bar of purchase card */}
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-800">Nota Fiscal #{pur.invoiceNumber}</span>
                          {pur.xmlFileName && (
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5" title={pur.xmlFileName}>
                              <FileCode size={9} /> XML Importado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Fornecedor: <strong className="text-slate-700">{pur.supplierName}</strong></p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Valor Total</span>
                        <span className="font-mono text-sm font-black text-indigo-700">{formatBRL(pur.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Items table of purchase card */}
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                            <th className="pb-2">SKU</th>
                            <th className="pb-2">Nome do Item</th>
                            <th className="pb-2 text-center">Qtd Compra</th>
                            <th className="pb-2 text-right">Preço de Custo</th>
                            <th className="pb-2 text-center">Margem</th>
                            <th className="pb-2 text-right">Preço de Venda</th>
                            <th className="pb-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pur.items.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/20">
                              <td className="py-2.5 font-mono text-[10px] text-indigo-600 font-bold">{item.sku}</td>
                              <td className="py-2.5 font-bold text-slate-700">{item.name}</td>
                              <td className="py-2.5 text-center font-bold text-slate-600">{item.quantity} un</td>
                              <td className="py-2.5 text-right font-mono text-slate-500">{formatBRL(item.costPrice)}</td>
                              <td className="py-2.5 text-center font-bold text-slate-400 font-mono">{item.profitMargin.toFixed(0)}%</td>
                              <td className="py-2.5 text-right font-black text-indigo-600 font-mono">{formatBRL(item.sellingPrice)}</td>
                              <td className="py-2.5 text-right font-black text-slate-800 font-mono">{formatBRL(item.costPrice * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50/50 p-3 px-4 border-t border-slate-100 text-right">
                      <span className="text-[10px] text-slate-400 font-medium">Registrado no sistema em {new Date(pur.purchaseDate || '2026-07-14').toLocaleString()}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-1.5">
                <UserPlus className="text-indigo-600" size={16} /> Cadastrar Novo Fornecedor
              </h3>
            </div>
            <form onSubmit={handleAddSupplierSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600">Razão Social / Nome Fantasia:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sinal e Imagem Distribuidora Ltda"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600">CNPJ do Fornecedor:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 98.765.432/0001-10"
                  value={supCnpj}
                  onChange={(e) => setSupCnpj(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600">Telefone:</label>
                  <input
                    type="text"
                    placeholder="Ex: 11999998888"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600">E-mail:</label>
                  <input
                    type="email"
                    placeholder="Ex: vendas@fornecedor.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold cursor-pointer"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-1.5">
                <Briefcase className="text-indigo-600" size={16} /> Cadastrar / Editar Peça em Estoque
              </h3>
            </div>
            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600">Descrição do Componente / Peça:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conector HDMI Original PS5"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600">SKU / Identificador:</label>
                  <input
                    type="text"
                    placeholder="Ex: HDM-PS5-OEM"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600">Estoque Inicial (un):</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-600">Custo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodCost}
                    onChange={(e) => {
                      setProdCost(e.target.value);
                      const cost = parseFloat(e.target.value) || 0;
                      const margin = parseFloat(prodMargin) || 0;
                      setProdSelling(String(calculateSellingPrice(cost, margin)));
                    }}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600">Margem (%):</label>
                  <input
                    type="number"
                    value={prodMargin}
                    onChange={(e) => {
                      setProdMargin(e.target.value);
                      const cost = parseFloat(prodCost) || 0;
                      const margin = parseFloat(e.target.value) || 0;
                      setProdSelling(String(calculateSellingPrice(cost, margin)));
                    }}
                    className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600">Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodSelling}
                    onChange={(e) => {
                      setProdSelling(e.target.value);
                      const cost = parseFloat(prodCost) || 0;
                      const selling = parseFloat(e.target.value) || 0;
                      setProdMargin(String(calculateProfitMargin(cost, selling).toFixed(1)));
                    }}
                    className="mt-1 w-full border border-indigo-200 text-indigo-700 font-bold rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600">Fornecedor Preferencial:</label>
                <select
                  value={prodSupId}
                  onChange={(e) => setProdSupId(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white text-xs"
                >
                  <option value="">Selecione o fornecedor (Opcional)...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
