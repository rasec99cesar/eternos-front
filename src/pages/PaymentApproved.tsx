import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { isPlanKey, trackEvent, trackMetaPurchase } from '../utils/analytics';
import type { CheckoutConfirmationResponse } from '../shared/index';
import styles from './PaymentApproved.module.css';

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 45000;

export default function PaymentApprovedPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id') || sessionStorage.getItem('checkout_session_id') || '';
  const initialPageId = params.get('page_id') || sessionStorage.getItem('checkout_page_id') || '';

  const [pageId, setPageId] = useState(initialPageId);
  const [status, setStatus] = useState<CheckoutConfirmationResponse | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const checkPayment = useCallback(async (manual = false) => {
    clearTimer();
    if (!sessionId && !pageId) {
      setChecking(false);
      setError('Não encontramos os dados do pagamento. Volte aos planos e tente novamente.');
      return;
    }

    setChecking(true);
    if (manual) {
      setError('');
      setTimedOut(false);
      startedAtRef.current = Date.now();
    }

    try {
      const result = await api.checkout.confirmSession(sessionId || undefined, pageId || undefined);
      if (stoppedRef.current) return;

      setStatus(result);
      if (result.pageId && result.pageId !== pageId) {
        setPageId(result.pageId);
        sessionStorage.setItem('checkout_page_id', result.pageId);
      }

      if (result.status === 'paid') {
        trackEvent('payment_confirmed');
        const paidPageId = result.pageId || pageId;
        const selectedPlan = sessionStorage.getItem('selected_plan');
        const purchaseKey = `meta_purchase_tracked:${sessionId || paidPageId || 'unknown'}`;
        if (isPlanKey(selectedPlan) && !sessionStorage.getItem(purchaseKey)) {
          trackMetaPurchase(selectedPlan, paidPageId || undefined);
          sessionStorage.setItem(purchaseKey, '1');
        }
        sessionStorage.removeItem('checkout_session_id');
        const target = result.editorUrl || `/editor/${result.pageId || pageId}`;
        navigate(target, { replace: true });
        return;
      }

      if (result.status === 'failed' || result.status === 'expired' || result.status === 'refunded') {
        trackEvent('payment_failed');
        setChecking(false);
        return;
      }

      if (result.status === 'invalid_session' || result.status === 'missing_data' || result.status === 'not_found' || result.status === 'mismatch') {
        setChecking(false);
        setError(result.message || 'Não foi possível confirmar este pagamento.');
        return;
      }

      trackEvent('payment_pending');
      if (Date.now() - startedAtRef.current >= MAX_WAIT_MS) {
        setTimedOut(true);
        setChecking(false);
        return;
      }

      timerRef.current = setTimeout(() => checkPayment(false), POLL_INTERVAL_MS);
    } catch (err: unknown) {
      if (stoppedRef.current) return;
      setChecking(false);
      setError(err instanceof Error ? err.message : 'Não foi possível falar com o servidor.');
    }
  }, [sessionId, pageId, navigate]);

  useEffect(() => {
    trackEvent('payment_success_page_view');
    stoppedRef.current = false;
    checkPayment(false);
    return () => {
      stoppedRef.current = true;
      clearTimer();
    };
  }, [checkPayment]);

  const effectivePageId = status?.pageId || pageId;
  const isFailed = status?.status === 'failed' || status?.status === 'expired' || status?.status === 'refunded';
  const pendingMessage = timedOut
    ? 'Seu pagamento pode já ter sido recebido, mas a confirmação ainda não chegou ao sistema.'
    : 'Assim que o pagamento for confirmado, você será levado para o editor da sua página.';

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <Link to="/" className={styles.brand}>Somos Eternos</Link>
      </nav>

      <div className={styles.card}>
        {error ? (
          <>
            <div className={styles.iconFail}>!</div>
            <h1 className={styles.title}>Pagamento não confirmado</h1>
            <p className={styles.sub}>{error}</p>
            <div className={styles.actions}>
              <button type="button" className="btn btn--primary btn--lg" onClick={() => checkPayment(true)} disabled={checking}>
                {checking ? 'Verificando...' : 'Verificar novamente'}
              </button>
              <Link to="/minhas-paginas" className="btn btn--ghost-dark">Ir para minhas páginas</Link>
              <Link to={effectivePageId ? `/planos/${effectivePageId}` : '/criar'} className="btn-text">Voltar aos planos</Link>
            </div>
          </>
        ) : isFailed ? (
          <>
            <div className={styles.iconFail}>✕</div>
            <h1 className={styles.title}>Pagamento não confirmado</h1>
            <p className={styles.sub}>O pagamento falhou ou expirou. O editor continua bloqueado até a confirmação.</p>
            <div className={styles.actions}>
              <Link to={effectivePageId ? `/planos/${effectivePageId}` : '/criar'} className="btn btn--primary btn--lg">Tentar novamente</Link>
              <Link to="/minhas-paginas" className="btn btn--ghost-dark">Ir para minhas páginas</Link>
            </div>
          </>
        ) : (
          <>
            {checking && !timedOut && (
              <div className={styles.spinner}>
                <span className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
              </div>
            )}
            <h1 className={styles.title}>{timedOut ? 'Pagamento em processamento' : 'Confirmando pagamento...'}</h1>
            <p className={styles.sub}>{pendingMessage}</p>
            {timedOut && (
              <div className={styles.actions}>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => checkPayment(true)} disabled={checking}>
                  {checking ? 'Verificando...' : 'Verificar novamente'}
                </button>
                <Link to="/minhas-paginas" className="btn btn--ghost-dark">Ir para minhas páginas</Link>
                <Link to={effectivePageId ? `/planos/${effectivePageId}` : '/criar'} className="btn-text">Voltar aos planos</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
