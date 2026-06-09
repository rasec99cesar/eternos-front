import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCounter, pad } from '../hooks/useCounter';
import { trackEvent } from '../utils/analytics';
import type { CouplePage } from '../shared/index';
import styles from './PublicPage.module.css';

function LiveCounter({ startDate }: { startDate: string }) {
  const { days, hours, mins, secs } = useCounter(new Date(startDate));
  return (
    <div className={styles.counter}>
      <div className={styles.unit}><span className={styles.num}>{days.toLocaleString('pt-BR')}</span><span className={styles.lab}>dias</span></div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}><span className={styles.num}>{pad(hours)}</span><span className={styles.lab}>horas</span></div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}><span className={styles.num}>{pad(mins)}</span><span className={styles.lab}>min</span></div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}><span className={styles.num}>{pad(secs)}</span><span className={styles.lab}>seg</span></div>
    </div>
  );
}

export default function PublicPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CouplePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.public.getPage(slug)
      .then((p) => {
        setPage(p);
        trackEvent('public_page_view');
        // Update meta tags
        document.title = `${p.title} — Sempre`;
        document.querySelector('meta[name="description"]')?.setAttribute('content', p.mainText ?? p.title);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', p.title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', p.mainText ?? '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('public_page_share_click');
  }

  function shareWhatsapp() {
    const text = encodeURIComponent(`${page?.title} 🤍 ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackEvent('public_page_whatsapp_click');
  }

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <span className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (notFound) return (
    <div className={styles.notFound}>
      <div className={styles.nfIcon}>♥</div>
      <h1 className={styles.nfTitle}>Esta página não existe</h1>
      <p className={styles.nfSub}>O link pode estar errado ou a página foi removida.</p>
      <Link to="/" className="btn btn--primary">Criar a minha página →</Link>
    </div>
  );

  if (!page) return null;

  const photos = page.assets?.filter((a) => a.type === 'photo').sort((a, b) => a.position - b.position) ?? [];
  const mainPhoto = photos[0];
  const polaroids = photos.slice(1, 4);

  const config = page.themeConfigJson ? JSON.parse(page.themeConfigJson) : {};
  const theme = config.theme || 'rose';

  return (
    <div data-theme={theme === 'rose' ? undefined : theme} className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <Link to="/" className={styles.poweredBy}>feito com Sempre<span style={{ color: 'var(--terra)' }}>.</span></Link>
        </div>
        <div className={styles.shareRow}>
          <button className={styles.shareBtn} onClick={copyLink}>
            {copied ? '✓ Copiado' : '🔗 Copiar link'}
          </button>
          <button className={styles.whatsappBtn} onClick={shareWhatsapp}>
            📱 WhatsApp
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Names & Title */}
        <section className={styles.hero}>
          <div className="eyebrow eyebrow--center" style={{ marginBottom: 20 }}>a história de vocês</div>
          <h1 className={`display ${styles.heroTitle}`}>{page.title}</h1>
          <p className={styles.heroNames}>{page.personOneName} & {page.personTwoName}</p>
        </section>

        {/* Live counter */}
        <section className={styles.counterSec}>
          <div className="wrap center">
            <p className={styles.counterLabel}>juntos há</p>
            <LiveCounter startDate={page.startDate} />
            <p className={styles.counterSince}>
              desde {new Date(page.startDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Main photo */}
        {mainPhoto && (
          <section className={styles.mainPhoto}>
            <div className="wrap center">
              <div className={`polaroid ${styles.mainPolaroid}`}>
                <img src={mainPhoto.url} alt={mainPhoto.alt || page.title} style={{ width: '100%', maxWidth: 320, height: 400, objectFit: 'cover' }} />
                <div className="cap">{page.personOneName} & {page.personTwoName}</div>
              </div>
            </div>
          </section>
        )}

        {/* Main text */}
        {page.mainText && (
          <section className={styles.textSec}>
            <div className="wrap">
              <div className={styles.textCard}>
                <p className={styles.mainText}>{page.mainText}</p>
              </div>
            </div>
          </section>
        )}

        {/* Polaroid gallery */}
        {polaroids.length > 0 && (
          <section className={styles.gallerySec}>
            <div className="wrap">
              <div className={styles.galleryGrid}>
                {polaroids.map((p, i) => (
                  <div key={p.id} className="polaroid" style={{ transform: `rotate(${[-4, 3, -2][i] ?? 0}deg)` }}>
                    <img src={p.url} alt={p.alt || `Foto ${i + 2}`} style={{ width: 200, height: 240, objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Share CTA */}
        <section className={styles.shareSec}>
          <div className="wrap center">
            <p className={styles.shareText}>Compartilhe com quem ama</p>
            <div className={styles.shareActions}>
              <button className="btn btn--primary" onClick={copyLink}>{copied ? '✓ Copiado!' : '🔗 Copiar link'}</button>
              <button className={styles.waBtn} onClick={shareWhatsapp}>📱 WhatsApp</button>
            </div>
            <div className={styles.createOwn}>
              <p className="micro" style={{ margin: '24px 0 8px' }}>Quer criar uma página assim para o seu relacionamento?</p>
              <Link to="/" className="btn btn--ghost-dark">Criar a nossa página →</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
