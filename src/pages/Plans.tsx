import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import styles from './Plans.module.css';

const PLANS = [
  {
    key: 'sempre' as const,
    name: 'Somos Eternos',
    price: 'R$ 27,90/ano',
    pitch: '"Escolha a frase perfeita — a nossa equipe já escreveu as melhores para você."',
    features: [
      'Frases escritas com carinho para cada momento',
      '3 fotos especiais + foto central',
      'Contador ao vivo e música no Spotify',
      'Link exclusivo · 12 meses inclusos · garantia 7 dias',
    ],
  },
  {
    key: 'eterno' as const,
    name: 'Eterno',
    price: 'R$ 37,90/ano',
    featured: true,
    pitch: '"Cada palavra escrita por você — porque só você sabe como foi o começo de vocês."',
    features: [
      'Escreva cada título e texto com as suas palavras',
      '3 fotos especiais + foto central',
      'Contador ao vivo e música no Spotify',
      'Link exclusivo · 12 meses inclusos · garantia 7 dias',
    ],
  },
];

export default function PlansPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'sempre' | 'eterno'>('eterno');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pageId) sessionStorage.setItem('checkout_page_id', pageId);
  }, [pageId]);

  async function handleCheckout() {
    if (!pageId) return;
    setLoading(true);
    setError('');
    trackEvent('checkout_start');
    trackEvent('plan_select', { plan: selected });

    try {
      const { url, sessionId } = await api.checkout.createSession({
        pageId,
        plan: selected,
      });
      sessionStorage.setItem('checkout_page_id', pageId);
      sessionStorage.setItem('checkout_session_id', sessionId);
      sessionStorage.setItem('selected_plan', selected);
      trackEvent('publish_checkout_created');
      trackEvent('publish_checkout_redirect');
      window.location.href = url;
    } catch (err: unknown) {
      trackEvent('checkout_error');
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão de pagamento.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <Link to="/criar" className={styles.back}>← Trocar template</Link>
        <span className={styles.brand}>Somos Eternos</span>
        <span />
      </nav>

      <div className={styles.inner}>
        <div className={styles.head}>
          <span className="eyebrow eyebrow--center">Escolha seu plano</span>
          <h1 className="h2" style={{ marginTop: 20, textAlign: 'center' }}>
            Dois jeitos de contar<br />a mesma história.
          </h1>
          <p className="lede" style={{ textAlign: 'center', margin: '16px auto 0', maxWidth: '52ch' }}>
            A página final é idêntica. O que muda é quem escreve os textos — nós ou você.
          </p>
        </div>

        <div className={styles.plansGrid}>
          {PLANS.map((p) => (
            <button
              key={p.key}
              className={`${styles.planCard} ${selected === p.key ? styles.planSelected : ''} ${p.featured ? styles.planFeatured : ''}`}
              onClick={() => { setSelected(p.key); trackEvent('plan_select', { plan: p.key }); }}
            >
              {p.featured && <span className={styles.badge}>♥ Mais escolhido</span>}
              <div className={styles.planName}>{p.name}</div>
              <div className={styles.planPrice}>{p.price}</div>
              <p className={styles.planPitch}>{p.pitch}</p>
              <ul className={styles.planFeatures}>
                {p.features.map((f) => <li key={f}><span style={{ color: 'var(--terra)' }}>✓</span> {f}</li>)}
              </ul>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Plano {selected === 'sempre' ? 'Somos Eternos' : 'Eterno'}</span>
            <span>{selected === 'sempre' ? 'R$ 27,90/ano' : 'R$ 37,90/ano'}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total (cobrança anual)</span>
            <span>{selected === 'sempre' ? 'R$ 27,90' : 'R$ 37,90'}</span>
          </div>
        </div>

        {error && <div className={styles.err}>{error}</div>}

        <button
          className="btn btn--primary btn--lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : `Pagar e liberar editor →`}
        </button>

        <p style={{ textAlign: 'center', fontFamily: 'var(--ui)', fontSize: 13, color: 'var(--ink-3)', marginTop: 16 }}>
          🔒 Pagamento 100% seguro via Stripe · O editor libera após confirmação
        </p>
      </div>
    </div>
  );
}
