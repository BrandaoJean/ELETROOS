import React, { useState } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  Lock, 
  ShieldAlert, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Sparkles,
  Server,
  AlertTriangle
} from 'lucide-react';
import { CompanyProfile, User } from '../types';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  users: User[];
  companyProfile: CompanyProfile;
  onLoginSuccess: (user: User) => void;
  onDeploySystem: (companyData: Partial<CompanyProfile>, adminUser: Partial<User>) => void;
}

export default function LoginView({ 
  users, 
  companyProfile, 
  onLoginSuccess, 
  onDeploySystem 
}: LoginViewProps) {
  // Mode selection
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(1);
  
  // Login credentials states
  const [loginCnpj, setLoginCnpj] = useState(companyProfile.cnpj || '');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Deployment form states
  const [depCompanyName, setDepCompanyName] = useState('');
  const [depCompanyTrade, setDepCompanyTrade] = useState('');
  const [depCompanyCnpj, setDepCompanyCnpj] = useState('');
  const [depCompanyEmail, setDepCompanyEmail] = useState('');
  const [depCompanyPhone, setDepCompanyPhone] = useState('');

  // Deployment admin states
  const [depAdminName, setDepAdminName] = useState('');
  const [depAdminUsername, setDepAdminUsername] = useState('');
  const [depAdminEmail, setDepAdminEmail] = useState('');
  const [depAdminPassword, setDepAdminPassword] = useState('');
  const [showDepPassword, setShowDepPassword] = useState(false);
  const [deployError, setDeployError] = useState('');

  // Mask function for CNPJ
  const maskCnpj = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 14);
    return raw
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginCnpj(maskCnpj(e.target.value));
  };

  const handleDepCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepCompanyCnpj(maskCnpj(e.target.value));
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginCnpj || !loginUsername || !loginPassword) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    const cleanInputCnpj = loginCnpj.replace(/\D/g, '');
    const cleanCompanyCnpj = companyProfile.cnpj.replace(/\D/g, '');

    if (cleanInputCnpj !== cleanCompanyCnpj) {
      setLoginError('Empresa não cadastrada com este CNPJ no sistema.');
      return;
    }

    // Search user
    const foundUser = users.find(
      u => (u.username.toLowerCase() === loginUsername.toLowerCase() || 
            u.email.toLowerCase() === loginUsername.toLowerCase()) && 
           u.password === loginPassword
    );

    if (!foundUser) {
      setLoginError('Usuário ou senha incorretos.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (googleUser && googleUser.email) {
        let foundUser = users.find(u => u.email.toLowerCase() === googleUser.email!.toLowerCase());

        if (!foundUser) {
          // Auto-onboard or default role setup
          const defaultCnpj = companyProfile.cnpj || '12.345.678/0001-90';
          if (googleUser.email.toLowerCase() === 'brandao.jean@gmail.com') {
            foundUser = {
              id: googleUser.uid,
              name: 'Jean Brandão',
              username: 'jean',
              email: googleUser.email,
              role: 'administrador',
              companyCnpj: defaultCnpj
            };
          } else {
            foundUser = {
              id: googleUser.uid,
              name: googleUser.displayName || 'Operador EletroOS',
              username: googleUser.email.split('@')[0],
              email: googleUser.email,
              role: users.length === 0 ? 'administrador' : 'tecnico',
              companyCnpj: defaultCnpj
            };
          }

          try {
            await setDoc(doc(db, 'users', googleUser.uid), foundUser);
          } catch (e) {
            console.error("Erro ao salvar usuário no Firestore:", e);
          }
        }

        onLoginSuccess(foundUser);
      }
    } catch (error: any) {
      console.error(error);
      setLoginError('Falha ao autenticar com o Google: ' + (error.message || error));
    }
  };

  // Wizard flow
  const handleDeployNext = () => {
    setDeployError('');
    if (deployStep === 1) {
      if (!depCompanyName || !depCompanyCnpj || !depCompanyEmail || !depCompanyPhone) {
        setDeployError('Por favor, preencha todos os dados da empresa.');
        return;
      }
      if (depCompanyCnpj.replace(/\D/g, '').length !== 14) {
        setDeployError('O CNPJ informado é inválido.');
        return;
      }
      setDeployStep(2);
    }
  };

  // Submit deployment
  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeployError('');

    if (!depAdminName || !depAdminUsername || !depAdminEmail || !depAdminPassword) {
      setDeployError('Por favor, preencha todos os dados do administrador.');
      return;
    }

    if (depAdminPassword.length < 4) {
      setDeployError('A senha do administrador deve ter pelo menos 4 caracteres.');
      return;
    }

    // Call deployment routine in App.tsx
    onDeploySystem(
      {
        cnpj: depCompanyCnpj,
        razaoSocial: depCompanyName,
        nomeFantasia: depCompanyTrade || depCompanyName,
        email: depCompanyEmail,
        phone: depCompanyPhone,
        environment: 'homologacao'
      },
      {
        name: depAdminName,
        username: depAdminUsername,
        email: depAdminEmail,
        password: depAdminPassword,
        role: 'administrador'
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative gradient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-indigo-600 text-white rounded-2xl w-14 h-14 shadow-lg shadow-indigo-600/20 mb-3">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex justify-center items-center gap-1.5 font-display">
            ELETRO<span className="text-indigo-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-widest">
            Gestão Eletrônica & Controle de OS
          </p>
        </div>

        {!isDeploying ? (
          /* STANDARD LOGIN INTERFACE */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-200">Acesso ao Painel</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Insira as credenciais para acessar a conta da sua assistência técnica.
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <ShieldAlert className="shrink-0 mt-0.5" size={15} />
                <span>{loginError}</span>
              </div>
            )}

            {/* CNPJ Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                CNPJ da Assistência Técnica
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={loginCnpj}
                  onChange={handleCnpjChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Username/Email Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="admin ou seu_email@exemplo.com"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={14} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-9 py-3 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Entrar no Sistema <ArrowRight size={14} />
            </button>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-slate-900 hover:bg-slate-950 text-slate-100 border border-slate-700/60 font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com o Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-5 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              <span className="h-px bg-slate-700/60 flex-1" />
              <span>Instalação Limpa</span>
              <span className="h-px bg-slate-700/60 flex-1" />
            </div>

            {/* System Deployment Option */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-3.5 space-y-2 text-center">
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Deseja iniciar com um <strong>banco de dados totalmente limpo</strong> e configurar sua própria empresa?
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsDeploying(true);
                  setDeployStep(1);
                  setDeployError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline transition-all"
              >
                <Server size={13} /> Implantar Novo Sistema (Limpar Banco)
              </button>
            </div>

            {/* Fast login instructions */}
            <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-400">Acesso Rápido de Teste:</span>
              <br />
              • CNPJ: <span className="font-mono font-bold text-slate-400">{companyProfile.cnpj}</span>
              <br />
              • Usuário: <span className="font-bold text-slate-400">admin</span> ou <span className="font-bold text-slate-400">brandao.jean@gmail.com</span>
              <br />
              • Senha: <span className="font-mono font-bold text-slate-400">admin</span>
            </div>
          </form>
        ) : (
          /* SYSTEM DEPLOYMENT WIZARD */
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
              <div className="space-y-0.5">
                <h2 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider text-indigo-400">
                  <Server size={14} /> Implantação
                </h2>
                <p className="text-[10px] text-slate-400">
                  Passo {deployStep} de 2
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeploying(false)}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} /> Cancelar
              </button>
            </div>

            {deployError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <ShieldAlert className="shrink-0 mt-0.5" size={15} />
                <span>{deployError}</span>
              </div>
            )}

            {deployStep === 1 ? (
              /* STEP 1: COMPANY DATA */
              <div className="space-y-3.5">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300 leading-relaxed flex gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5 text-amber-400" size={16} />
                  <span>
                    <strong>ATENÇÃO:</strong> Concluir este assistente irá <strong>WIPER (APAGAR) permanentemente</strong> todos os dados de testes (clientes, ordens de serviço, produtos, contas e transações financeiras) para iniciar do zero!
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dados Fiscais da Assistência
                  </h3>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Jean Brandão Assistência Técnica Ltda"
                      value={depCompanyName}
                      onChange={(e) => setDepCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome Fantasia (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: EletroOS Assistência"
                      value={depCompanyTrade}
                      onChange={(e) => setDepCompanyTrade(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1 col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        CNPJ da Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={depCompanyCnpj}
                        onChange={handleDepCnpjChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Telefone
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={depCompanyPhone}
                        onChange={(e) => setDepCompanyPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        placeholder="contato@empresa.com"
                        value={depCompanyEmail}
                        onChange={(e) => setDepCompanyEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeployNext}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 mt-2"
                >
                  Prosseguir para Administrador <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              /* STEP 2: ADMINISTRATOR ACCOUNT */
              <form onSubmit={handleDeploySubmit} className="space-y-3.5">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Conta do Administrador Principal
                  </h3>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Jean Brandão"
                      value={depAdminName}
                      onChange={(e) => setDepAdminName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome de Usuário (Username)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: admin ou jean"
                      value={depAdminUsername}
                      onChange={(e) => setDepAdminUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      E-mail do Administrador
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: brandao.jean@gmail.com"
                      value={depAdminEmail}
                      onChange={(e) => setDepAdminEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <input
                        type={showDepPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha forte"
                        value={depAdminPassword}
                        onChange={(e) => setDepAdminPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDepPassword(!showDepPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showDepPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeployStep(1);
                      setDeployError('');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs py-3.5 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Voltar
                  </button>

                  <button
                    type="submit"
                    className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    <CheckCircle size={14} /> Concluir Implantação
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Footer Branding */}
      <p className="text-[10px] text-slate-500 font-medium text-center mt-6 relative z-10 select-none">
        EletroOS Eletrônica e Manutenção • Versão Estável 2.4.0 • Distribuição Licenciada
      </p>
    </div>
  );
}
