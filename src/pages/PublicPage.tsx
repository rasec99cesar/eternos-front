import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import type { CouplePage } from '../shared/index';
import CouplePageRenderer from '../components/CouplePageRenderer';
import styles from './PublicPage.module.css';

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
        document.title = `${p.personOneName} & ${p.personTwoName} — Sempre`;
        document.querySelector('meta[name="description"]')?.setAttribute('content', p.mainText ?? p.title);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${p.personOneName} & ${p.personTwoName}`);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', p.mainText ?? '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [page]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('public_page_share_click');
  }

  function shareWhatsapp() {
    const title = page ? `${page.personOneName} & ${page.personTwoName}` : '';
    const text = encodeURIComponent(`${title} 🤍 ${window.location.href}`);
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

  return <CouplePageRenderer page={page} copied={copied} onCopy={copyLink} onShareWhatsapp={shareWhatsapp} />;
}
