import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
// Add page imports here
import Panorama from './pages/Panorama';
import Financeiro from './pages/Financeiro';
import Comercial from './pages/Comercial';
import RH from './pages/RH';
import ModuloPlaceholder from './pages/ModuloPlaceholder';
import BensRecebidos from './pages/BensRecebidos';
import PlanejamentoTributario from './pages/PlanejamentoTributario';
import Fiscal from './pages/Fiscal';
import Veiculos from './pages/Veiculos';
import Obras from './pages/Obras';
import SimuladorLucro from './pages/SimuladorLucro';
import Agronegocio from './pages/Agronegocio';
import EngFinanceira from './pages/EngFinanceira';
import AdminMaster from './pages/AdminMaster';
import ModuloNFe from './pages/ModuloNFe';
import Estoques from './pages/Estoques';
import Planos from './pages/Planos';
import Demo from './pages/Demo';
import TesteProfissional from './pages/TesteProfissional';
import PainelCliente from './pages/PainelCliente';
import Calendario from './pages/Calendario';
import Certidoes from './pages/Certidoes';
import LinksGoverno from './pages/LinksGoverno';
import Manual from './pages/Manual';
import Integracoes from './pages/Integracoes';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const publicPaths = ['/planos', '/demo', '/teste-10-dias', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.includes(window.location.pathname);

  if (authError && !isPublicPath) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Panorama />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/comercial" element={<Comercial />} />
        <Route path="/rh" element={<RH />} />
        <Route path="/bens-recebidos" element={<BensRecebidos />} />
        <Route path="/planejamento-tributario" element={<PlanejamentoTributario />} />
        <Route path="/fiscal" element={<Fiscal />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/agronegocio" element={<Agronegocio />} />
        <Route path="/eng-financeira" element={<EngFinanceira />} />
        <Route path="/simulador" element={<SimuladorLucro />} />
        <Route path="/admin-master" element={<AdminMaster />} />
        <Route path="/modulo-nfe" element={<ModuloNFe />} />
        <Route path="/estoques" element={<Estoques />} />
        <Route path="/meu-painel" element={<PainelCliente />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/certidoes" element={<Certidoes />} />
        <Route path="/links-governo" element={<LinksGoverno />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/integracoes" element={<Integracoes />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/planos" element={<Planos />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/teste-10-dias" element={<TesteProfissional />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  // Complete pure gray update
  // Forçando atualização da pré-visualização para o usuário
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App