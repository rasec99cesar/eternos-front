import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import type { CheckoutStatusResponse } from '../shared/index';
import styles from './PaymentApproved.module.css';

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20;

export default function PaymentApprovedPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  const [status, setStatus] = useState<CheckoutStatusResponse | null>(null);
  const [polls, setPolls] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // We need the pageId — fetch it from session storage or URL if available
  // In production the backend webhook sets the page to published.
  // We poll /checkout/status/:pageId. Since we only have session_id here,
  // we look for a stored pageId that was set before redirect.
  const pageId = sessionStorage.getItem('checkout_page_id') || params.get('page_id') || '';

  useEffect(() => {
    trackEvent('payment_success_page_view');

    if (!pageId) return;

    async function poll() {
      try {
        const s = await api.checkout.getStatus(pageId);
        setStatus(s);
        setPolls((p) => p + 1);

        if (s.status === 'paid') {
          trackEvent('payment_confirmed');
          trackEvent('publish_success');
          clearInterval(pollRef.current!);
        } else if (s.status === 'failed' || s.status === 'expired') {
          trackEvent('payment_failed');
          clearInterval(pollRef.current!);
        } else {
          trackEvent('payment_pending');
        }
      } catch {}
    }

    poll();
    pollRef.current = setInterval(() => {
      setPolls((p) => {
        if (p >= MAX_POLLS) { clearInterval(pollRef.current!); return p; }
        return p;
      });
      poll();
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current!);
  }, [pageId]);

  async function copyLink() {
    if (!status?.publicUrl) return;
    await navigator.clipboard.writeText(status.publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_public_link');
  }

  function shareWhatsapp() {
    if (!status?.publicUrl) return;
    const text = encodeURIComponent(`A nossa história 🤍 ${status.publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackEvent('share_whatsapp_click');
  }

  const isPaid = status?.status === 'paid';
  const isFailed = status?.status === 'failed' || status?.status === 'expired';
  const isPending = !isPaid && !isFailed;
  const timedOut = polls >= MAX_POLLS && isPending;

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <Link to="/" className={styles.brand}>Sempre<span style={{ color: 'var(--terra)' }}>.</span></Link>
      </nav>

      <div className={styles.card}>
        {isFailed ? (
          <>
            <div className={styles.iconFail}>✕</div>
            <h1 className={styles.title}>Pagamento não confirmado</h1>
            <p className={styles.sub}>Não foi possível confirmar o seu pagamento. Por favor, tente novamente ou entre em contato.</p>
            <Link to={`/planos/${pageId}`} className="btn btn--primary btn--lg" style={{ marginTop: 24, justifyContent: 'center' }}>
              Tentar novamente
            </Link>
          </>
        ) : isPaid && status?.publicUrl ? (
          <>
            <div className={styles.iconSuccess}>♥</div>
            <h1 className={styles.title}>Sua página está no ar!</h1>
            <p className={styles.sub}>
              A memória de vocês agora tem um endereço permanente na internet.
            </p>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>{status.publicUrl}</span>
            </div>

            <div className={styles.actions}>
              <button className="btn btn--primary btn--lg" onClick={copyLink} style={{ flex: 1, justifyContent: 'center' }}>
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </button>
              <a
                href={status.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost-dark btn--lg"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => trackEvent('open_public_link')}
              >
                Abrir página →
              </a>
            </div>

            <button className={styles.whatsapp} onClick={shareWhatsapp}>
              <span>📱</span> Compartilhar no WhatsApp
            </button>

            <div className={styles.confetti} aria-hidden>
              {['♥','✦','♥','✦','♥'].map((s, i) => (
                <span key={i} className={styles.confettiPiece} style={{ animationDelay: `${i * 0.2}s` }}>{s}</span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.spinner}>
              <span className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
            </div>
            <h1 className={styles.title}>
              {timedOut ? 'Quase lá...' : 'Confirmando pagamento...'}
            </h1>
            <p className={styles.sub}>
              {timedOut
                ? 'O pagamento está sendo processado. Você receberá um e-mail quando a página estiver no ar.'
                : 'Aguarde enquanto confirmamos o seu pagamento. Isso leva apenas alguns segundos.'}
            </p>
            {timedOut && (
              <p className={styles.hint}>
                Se você não receber o e-mail em alguns minutos, entre em contato conosco.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
