import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import styles from './Plans.module.css';

const PLANS = [
  {
    key: 'sempre' as const,
    name: 'Sempre',
    price: 'R$ 27,90',
    pitch: '"Escolha a frase perfeita — a nossa equipe já escreveu as melhores para você."',
    features: [
      'Frases escritas com carinho para cada momento',
      '3 fotos Polaroid + foto central',
      'Contador ao vivo e música no Spotify',
      'Link exclusivo · acesso vitalício · garantia 7 dias',
    ],
  },
  {
    key: 'eterno' as const,
    name: 'Eterno',
    price: 'R$ 37,90',
    featured: true,
    pitch: '"Cada palavra escrita por você — porque só você sabe como foi o começo de vocês."',
    features: [
      'Escreva cada título e texto com as suas palavras',
      '3 fotos Polaroid + foto central',
      'Contador ao vivo e música no Spotify',
      'Link exclusivo · acesso vitalício · garantia 7 dias',
    ],
  },
];

export default function PlansPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'sempre' | 'eterno'>('eterno');
  const [bump, setBump] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!pageId) return;
    setLoading(true);
    setError('');
    trackEvent('checkout_start');
    trackEvent('plan_select', { plan: selected });
    if (bump) trackEvent('order_bump_select');

    try {
      const { url } = await api.checkout.createSession({
        pageId,
        plan: selected,
        includeOrderBump: bump,
      });
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
        <Link to={`/editor/${pageId}`} className={styles.back}>← Voltar ao editor</Link>
        <span className={styles.brand}>Sempre<span style={{ color: 'var(--terra)' }}>.</span></span>
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

        {/* Order bump */}
        <label className={`${styles.bump} ${bump ? styles.bumpOn : ''}`}>
          <input type="checkbox" checked={bump} onChange={(e) => { setBump(e.target.checked); trackEvent(e.target.checked ? 'order_bump_select' : 'order_bump_remove'); }} style={{ display: 'none' }} />
          <div className={styles.bumpCheck}>{bump ? '✓' : ''}</div>
          <div>
            <div className={styles.bumpTitle}>+ Moldura especial de Dia dos Namorados</div>
            <div className={styles.bumpSub}>Uma moldura exclusiva para tornar a página ainda mais especial. <strong>R$ 9,90</strong></div>
          </div>
        </label>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Plano {selected === 'sempre' ? 'Sempre' : 'Eterno'}</span>
            <span>{selected === 'sempre' ? 'R$ 27,90' : 'R$ 37,90'}</span>
          </div>
          {bump && (
            <div className={styles.summaryRow}>
              <span>Moldura especial</span>
              <span>R$ 9,90</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>
              R$ {((selected === 'sempre' ? 27.9 : 37.9) + (bump ? 9.9 : 0)).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {error && <div className={styles.err}>{error}</div>}

        <button
          className="btn btn--primary btn--lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : `Pagar e publicar →`}
        </button>

        <p style={{ textAlign: 'center', fontFamily: 'var(--ui)', fontSize: 13, color: 'var(--ink-3)', marginTop: 16 }}>
          🔒 Pagamento 100% seguro via Stripe · Garantia de 7 dias
        </p>
      </div>
    </div>
  );
}
