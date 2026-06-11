import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { applySeo, getRouteSeo } from './utils/seo';
import { trackMetaPageView, trackRedditPageVisit } from './utils/analytics';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    applySeo(getRouteSeo(pathname));
  }, [pathname]);
  return null;
}

function MetaPixelPageView() {
  const { pathname, search } = useLocation();
  const didSkipInitialPageView = useRef(false);

  useEffect(() => {
    if (!window.fbq) return;
    if (!didSkipInitialPageView.current) {
      didSkipInitialPageView.current = true;
      return;
    }
    trackMetaPageView();
  }, [pathname, search]);
  return null;
}

function RedditPixelPageVisit() {
  const { pathname, search } = useLocation();
  const didSkipInitialPageVisit = useRef(false);

  useEffect(() => {
    if (!window.rdt) return;
    if (!didSkipInitialPageVisit.current) {
      didSkipInitialPageVisit.current = true;
      return;
    }
    trackRedditPageVisit();
  }, [pathname, search]);
  return null;
}

import LandingPage from './pages/Landing';
import AuthPage from './pages/Auth';
import CreatePage from './pages/Create';
import EditorPage from './pages/Editor';
import PlansPage from './pages/Plans';
import PaymentApprovedPage from './pages/PaymentApproved';
import MyPagesPage from './pages/MyPages';
import PublicPageView from './pages/PublicPage';
import ExamplePage from './pages/ExamplePage';
import NotFoundPage from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <SeoManager />
          <MetaPixelPageView />
          <RedditPixelPageVisit />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/entrar" element={<AuthPage />} />
            <Route path="/p/:slug" element={<PublicPageView />} />
            <Route path="/exemplos/:slug" element={<ExamplePage />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* Protected */}
            <Route path="/criar" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
            <Route path="/editor/:pageId" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/planos/:pageId" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
            <Route path="/pagamento/aprovado" element={<ProtectedRoute><PaymentApprovedPage /></ProtectedRoute>} />
            <Route path="/minhas-paginas" element={<ProtectedRoute><MyPagesPage /></ProtectedRoute>} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
