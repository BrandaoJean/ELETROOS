import React, { useState } from 'react';
import { 
  Building, 
  FileText, 
  Fingerprint, 
  Search, 
  Check, 
  UploadCloud, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Percent, 
  Info, 
  AlertCircle,
  FileCode,
  ShieldCheck,
  Globe,
  Server,
  Activity
} from 'lucide-react';
import { CompanyProfile } from '../types';

interface CompanyProfileViewProps {
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
}

export default function CompanyProfileView({
  companyProfile,
  setCompanyProfile
}: CompanyProfileViewProps) {
  // Form states matching CompanyProfile structure
  const [cnpj, setCnpj] = useState(companyProfile.cnpj || '');
  const [razaoSocial, setRazaoSocial] = useState(companyProfile.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(companyProfile.nomeFantasia || '');
  const [cnaeCode, setCnaeCode] = useState(companyProfile.cnaeCode || '');
  const [cnaeDesc, setCnaeDesc] = useState(companyProfile.cnaeDesc || '');
  const [taxRegime, setTaxRegime] = useState<CompanyProfile['taxRegime']>(companyProfile.taxRegime || 'mei');
  const [stateRegistration, setStateRegistration] = useState(companyProfile.stateRegistration || '');
  const [municipalRegistration, setMunicipalRegistration] = useState(companyProfile.municipalRegistration || '');
  const [taxRateSimple, setTaxRateSimple] = useState<string>(companyProfile.taxRateSimple?.toString() || '0');
  const [icmsRate, setIcmsRate] = useState<string>(companyProfile.icmsRate?.toString() || '0');
  const [issqnRate, setIssqnRate] = useState<string>(companyProfile.issqnRate?.toString() || '0');
  const [nfeSerie, setNfeSerie] = useState(companyProfile.nfeSerie || '1');
  const [nfeNextNumber, setNfeNextNumber] = useState(companyProfile.nfeNextNumber || '1');
  
  const [cep, setCep] = useState(companyProfile.cep || '');
  const [address, setAddress] = useState(companyProfile.address || '');
  const [number, setNumber] = useState(companyProfile.number || '');
  const [complement, setComplement] = useState(companyProfile.complement || '');
  const [neighborhood, setNeighborhood] = useState(companyProfile.neighborhood || '');
  const [city, setCity] = useState(companyProfile.city || '');
  const [state, setState] = useState(companyProfile.state || '');
  
  const [phone, setPhone] = useState(companyProfile.phone || '');
  const [email, setEmail] = useState(companyProfile.email || '');
  const [environment, setEnvironment] = useState<'homologacao' | 'producao'>(companyProfile.environment || 'homologacao');

  // Local-only states
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Digital Certificate variables
  const [certUploaded, setCertUploaded] = useState(companyProfile.digitalCertificateUploaded || false);
  const [certFileName, setCertFileName] = useState(companyProfile.digitalCertificateUploaded ? 'certificado_salvo.pfx' : '');
  const [certPassword, setCertPassword] = useState(companyProfile.digitalCertificatePassword || '');
  const [showPassword, setShowPassword] = useState(false);

  // Helper: show feedback helper
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 6000);
  };

  // Format CNPJ as typing (XX.XXX.XXX/XXXX-XX)
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    // Apply CNPJ mask
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
    }
    setCnpj(value);
  };

  // Format CEP as typing (XXXXX-XXX)
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
    }
    setCep(value);
  };

  // Fetch CNPJ data from BrasilAPI
  const fetchCnpjData = async () => {
    const rawCnpj = cnpj.replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
      showFeedback('Por favor, informe um CNPJ válido com 14 dígitos.', 'error');
      return;
    }

    setIsLoadingCnpj(true);
    showFeedback('Consultando Receita Federal via BrasilAPI...', 'info');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
      
      if (!response.ok) {
        throw new Error('Empresa não encontrada ou API indisponível.');
      }

      const data = await response.json();
      
      // Auto fill identification
      setRazaoSocial(data.razao_social || '');
      setNomeFantasia(data.nome_fantasia || data.razao_social || '');
      
      // Auto fill CNAE principal
      if (data.cnae_fiscal) {
        setCnaeCode(data.cnae_fiscal.toString());
        setCnaeDesc(data.cnae_fiscal_descricao || '');
      }

      // Auto fill Address
      setAddress(data.logradouro || '');
      setNumber(data.numero || '');
      setComplement(data.complemento || '');
      setNeighborhood(data.bairro || '');
      setCity(data.municipio || '');
      setState(data.uf || '');
      
      if (data.cep) {
        // format cep
        const formattedCep = data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
        setCep(formattedCep);
      }

      // Auto fill Contact
      if (data.ddd_telefone_1) {
        let cleanPhone = data.ddd_telefone_1.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          cleanPhone = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        } else if (cleanPhone.length === 11) {
          cleanPhone = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else {
          cleanPhone = data.ddd_telefone_1;
        }
        setPhone(cleanPhone);
      }

      if (data.email) {
        setEmail(data.email.toLowerCase());
      }

      // Infer Tax Regime
      if (data.opcao_pelo_mei) {
        setTaxRegime('mei');
        setTaxRateSimple('0'); // MEI is standard DAS fixed value, or custom 0%
      } else if (data.opcao_pelo_simples) {
        setTaxRegime('simples');
        setTaxRateSimple('4.5'); // typical Simples Nacional inicial rate
      } else {
        setTaxRegime('lucro_presumido');
      }

      showFeedback('Dados do CNPJ preenchidos automaticamente com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showFeedback('Falha na consulta. Verifique o CNPJ ou preencha os dados manualmente.', 'error');
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // Fetch CEP Address data from BrasilAPI
  const fetchCepData = async () => {
    const rawCep = cep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      showFeedback('Por favor, informe um CEP válido com 8 dígitos.', 'error');
      return;
    }

    setIsLoadingCep(true);
    
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${rawCep}`);
      if (!response.ok) {
        throw new Error('CEP não encontrado.');
      }
      const data = await response.json();
      
      setAddress(data.street || '');
      setNeighborhood(data.neighborhood || '');
      setCity(data.city || '');
      setState(data.state || '');
      
      showFeedback('Endereço preenchido através do CEP!', 'success');
    } catch (err) {
      console.error(err);
      showFeedback('Não foi possível obter o endereço do CEP informado. Digite manualmente.', 'error');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handle digital certificate upload simulation
  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCertUploaded(true);
      setCertFileName(file.name);
      showFeedback(`Certificado digital "${file.name}" carregado. Insira a senha.`, 'success');
    }
  };

  // Save Company Profile form
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!razaoSocial || !cnpj) {
      showFeedback('Os campos Razão Social e CNPJ são obrigatórios.', 'error');
      return;
    }

    const updatedProfile: CompanyProfile = {
      cnpj,
      razaoSocial,
      nomeFantasia: nomeFantasia || razaoSocial,
      cnaeCode,
      cnaeDesc,
      taxRegime,
      stateRegistration,
      municipalRegistration,
      taxRateSimple: parseFloat(taxRateSimple) || 0,
      icmsRate: parseFloat(icmsRate) || 0,
      issqnRate: parseFloat(issqnRate) || 0,
      digitalCertificateUploaded: certUploaded,
      digitalCertificatePassword: certPassword,
      nfeSerie,
      nfeNextNumber,
      cep,
      address,
      number,
      complement,
      neighborhood,
      city,
      state,
      phone,
      email,
      environment
    };

    setCompanyProfile(updatedProfile);
    showFeedback('Cadastro da empresa e configurações fiscais salvos com sucesso!', 'success');
    alert('Os dados cadastrais e fiscais da empresa foram atualizados e salvos localmente.');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Building className="text-indigo-600" size={24} />
            Configuração de Cadastro & Dados Fiscais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mantenha as informações jurídicas, fiscais e tributárias da sua empresa corretas para emissões e relatórios.
          </p>
        </div>
        
        <button
          onClick={handleSaveProfile}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <Save size={15} /> Salvar Alterações
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all text-xs ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
            : feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-150'
              : 'bg-indigo-50 text-indigo-800 border-indigo-150'
        }`}>
          {feedbackMsg.type === 'success' && <Check className="text-emerald-600 shrink-0 mt-0.5" size={16} />}
          {feedbackMsg.type === 'error' && <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />}
          {feedbackMsg.type === 'info' && <Info className="text-indigo-600 shrink-0 mt-0.5" size={16} />}
          <div>
            <p className="font-semibold">{feedbackMsg.type === 'success' ? 'Sucesso!' : feedbackMsg.type === 'error' ? 'Atenção' : 'Informativo'}</p>
            <p className="mt-0.5 text-slate-600 font-medium leading-relaxed">{feedbackMsg.text}</p>
          </div>
        </div>
      )}

      {/* CONSULTA RÁPIDA DE CNPJ PANEL */}
      <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-900 shadow-lg flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="space-y-1 md:max-w-md">
          <h3 className="font-bold text-sm flex items-center gap-2 text-indigo-200">
            <Search size={16} /> Consulta Expressa de CNPJ
          </h3>
          <p className="text-[11px] text-indigo-300">
            Digite o número do CNPJ para buscar os dados diretamente na Receita Federal via BrasilAPI. Nosso sistema auto-preenche a Razão Social, CNAE, endereço e contatos.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <input
            type="text"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={handleCnpjChange}
            className="bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 border border-indigo-800 rounded-xl px-4 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-indigo-300 w-full md:w-56"
          />
          <button
            type="button"
            disabled={isLoadingCnpj}
            onClick={fetchCnpjData}
            className={`px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50`}
          >
            {isLoadingCnpj ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Search size={14} />
            )}
            Consultar
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: IDENTIFICAÇÃO E LOCALIZAÇÃO */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* IDENTIFICATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building size={14} className="text-indigo-600" /> 1. Identificação da Empresa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Razão Social (Nome de Registro):</label>
                <input
                  type="text"
                  required
                  placeholder="Nome oficial registrado na junta comercial"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Nome Fantasia (Marca):</label>
                <input
                  type="text"
                  placeholder="Nome comercial divulgado ao público"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Código CNAE Principal:</label>
                  <input
                    type="text"
                    placeholder="Ex: 9521-5/00"
                    value={cnaeCode}
                    onChange={(e) => setCnaeCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-700 font-medium"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Atividade Econômica Descrita:</label>
                  <input
                    type="text"
                    placeholder="Descrição da atividade principal econômica"
                    value={cnaeDesc}
                    onChange={(e) => setCnaeDesc(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LOCATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin size={14} className="text-indigo-600" /> 2. Endereço e Localização
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">CEP:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={handleCepChange}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-700 font-medium"
                  />
                  <button
                    type="button"
                    disabled={isLoadingCep}
                    onClick={fetchCepData}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-colors"
                    title="Buscar endereço por CEP"
                  >
                    {isLoadingCep ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Search size={13} />
                    )}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Endereço (Rua/Avenida/Logradouro):</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Número:</label>
                <input
                  type="text"
                  placeholder="Ex: 1500"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Complemento:</label>
                <input
                  type="text"
                  placeholder="Ex: Sala 14"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Bairro:</label>
                <input
                  type="text"
                  placeholder="Ex: Centro"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Cidade:</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Estado (UF):</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="Ex: SP"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-700 font-medium"
                />
              </div>

            </div>
          </div>

          {/* CONTACT INFO CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone size={14} className="text-indigo-600" /> 3. Contatos Institucionais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Telefone da Empresa:</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Ex: (11) 98888-7777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">E-mail da Empresa:</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={14} />
                  <input
                    type="email"
                    placeholder="Ex: administrativo@suaempresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRIBUTÁRIO & FISCAL E CERTIFICADO */}
        <div className="space-y-6">
          
          {/* ENVIRONMENT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Globe size={14} className="text-indigo-600" /> Ambiente do Sistema
            </h2>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Alterne o ambiente para testes de emissão de notas fiscais de serviço e integridade de faturamento sem valor legal ou ative o modo real.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnvironment('homologacao');
                  showFeedback('Ambiente alterado para Homologação (Testes). Lembre-se de salvar as alterações!', 'info');
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  environment === 'homologacao'
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${environment === 'homologacao' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="font-bold text-xs">Homologação</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Ambiente de Testes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnvironment('producao');
                  showFeedback('Ambiente alterado para Produção (Real). Use com cuidado e lembre-se de salvar!', 'info');
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  environment === 'producao'
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${environment === 'producao' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="font-bold text-xs">Produção</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Ambiente Real (Legal)</span>
              </button>
            </div>

            {environment === 'homologacao' ? (
              <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-amber-800 font-medium">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                <span>
                  <strong>Aviso:</strong> Em Homologação, todas as notas fiscais emitidas no sistema serão geradas sem valor jurídico e destinadas apenas a testes fiscais.
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-emerald-800 font-medium">
                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                <span>
                  <strong>Aviso:</strong> Em Produção, todas as emissões fiscais serão reais e transmitidas para a SEFAZ ou Prefeitura com validade jurídica de faturamento.
                </span>
              </div>
            )}
          </div>
          
          {/* TAX AND FISCAL DATA CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileCode size={14} className="text-indigo-600" /> Dados Fiscais & Tributários
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Regime Tributário:</label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs font-bold text-slate-700"
                >
                  <option value="mei">Microempreendedor Individual (MEI)</option>
                  <option value="simples">Simples Nacional</option>
                  <option value="lucro_presumido">Lucro Presumido</option>
                  <option value="lucro_real">Lucro Real</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1" title="Inscrição Estadual">Inscrição Estadual (IE):</label>
                  <input
                    type="text"
                    placeholder="Ex: 123.456.789.110"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1" title="Inscrição Municipal">Inscrição Municipal (IM):</label>
                  <input
                    type="text"
                    placeholder="Ex: 9876543-2"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Alíquotas de Imposto</span>
                
                {(taxRegime === 'mei' || taxRegime === 'simples') && (
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-600 flex items-center gap-1">
                      <Percent size={13} className="text-indigo-500" /> Alíquota do Regime (%):
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxRateSimple}
                      onChange={(e) => setTaxRateSimple(e.target.value)}
                      className="w-16 border border-slate-200 rounded p-1 text-center font-mono font-bold text-slate-700 bg-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <Percent size={13} className="text-indigo-500" /> Alíquota ICMS (%):
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={icmsRate}
                    onChange={(e) => setIcmsRate(e.target.value)}
                    className="w-16 border border-slate-200 rounded p-1 text-center font-mono font-bold text-slate-700 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <Percent size={13} className="text-indigo-500" /> Alíquota ISSQN (%):
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={issqnRate}
                    onChange={(e) => setIssqnRate(e.target.value)}
                    className="w-16 border border-slate-200 rounded p-1 text-center font-mono font-bold text-slate-700 bg-white"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Sequencial de Emissão de NFe</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Série NFe:</label>
                    <input
                      type="text"
                      placeholder="1"
                      value={nfeSerie}
                      onChange={(e) => setNfeSerie(e.target.value)}
                      className="w-full border border-slate-200 rounded p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Próximo Número NFe:</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={nfeNextNumber}
                      onChange={(e) => setNfeNextNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* DIGITAL CERTIFICATE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Fingerprint size={14} className="text-indigo-600" /> Certificado Digital (A1)
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="mx-auto text-slate-400 mb-2" size={24} />
                <p className="font-semibold text-slate-700">Selecione o Certificado Digital</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Formatos suportados: .pfx ou .p12 (A1)</p>
              </div>

              {certUploaded ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-2.5 rounded-lg flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] truncate">{certFileName}</p>
                    <p className="text-[9px] text-emerald-600">Certificado configurado com sucesso</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-semibold border border-slate-200">
                  <Info className="text-slate-400 shrink-0" size={14} />
                  Nenhum certificado digital anexado.
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">Senha do Certificado:</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha de chave privada"
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-8 pr-8 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
