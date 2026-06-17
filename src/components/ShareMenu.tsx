import { useState, useRef, useEffect } from 'react';
import QrCodeModal from './QrCodeModal';
import { generateStoryImage } from '../utils/storyImage';
import { trackEvent } from '../utils/analytics';
import styles from '../pages/PublicPage.module.css';

function readColor(el: HTMLElement | null, name: string, fallback: string): string {
  if (!el) return fallback;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export default function ShareMenu({
  personOneName,
  personTwoName,
  startDate,
  sinceText,
  photoUrl,
  pageUrl,
  containerRef,
}: {
  personOneName: string;
  personTwoName: string;
  startDate: string;
  sinceText?: string | null;
  photoUrl?: string | null;
  pageUrl: string;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [toast, setToast] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleCopy() {
    setOpen(false);
    await navigator.clipboard.writeText(pageUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    trackEvent('public_page_share_click');
  }

  function handleWhatsApp() {
    setOpen(false);
    const text = encodeURIComponent(`${personOneName} & ${personTwoName} 🤍 ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackEvent('public_page_whatsapp_click');
  }

  async function handleStory() {
    setOpen(false);
    if (storyLoading) return;
    setStoryLoading(true);
    trackEvent('public_page_story_click');
    try {
      const el = containerRef.current;
      const colors = {
        bg: readColor(el, '--bg', '#FBF3F1'),
        bgCard: readColor(el, '--bg-card', '#FFFBFA'),
        ink: readColor(el, '--ink', '#2A151A'),
        ink2: readColor(el, '--ink-2', '#6E3B43'),
        terra: readColor(el, '--terra', '#BC4257'),
        terraLight: readColor(el, '--terra-light', '#E8AEB7'),
      };
      const blob = await generateStoryImage({
        personOneName, personTwoName, startDate, sinceText, photoUrl, pageUrl, colors,
      });
      if (!blob) throw new Error('failed');

      const fileName = `${personOneName}-${personTwoName}-stories.png`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9.-]+/g, '-');
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${personOneName} & ${personTwoName}`,
            text: 'Vem ver a nossa história ♥',
          });
          trackEvent('public_page_story_share');
        } catch (err) {
          if (!(err instanceof Error) || err.name !== 'AbortError') throw err;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        trackEvent('public_page_story_download');
        showToast('Imagem baixada! Abra o Instagram e poste nos Stories.');
      }
    } catch {
      trackEvent('public_page_story_error');
      showToast('Não foi possível gerar a imagem agora. Tente novamente.');
    } finally {
      setStoryLoading(false);
    }
  }

  function handleQr() {
    setOpen(false);
    setShowQr(true);
    trackEvent('qr_code_open');
  }

  const accentColor = readColor(containerRef.current, '--terra', '#BC4257');

  return (
    <div className={styles.shareMenuWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.shareMenuBtn}
        onClick={() => setOpen((o) => !o)}
        disabled={storyLoading}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {storyLoading ? (
          <span className="spinner spinner--dark" style={{ width: 13, height: 13 }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
        <span className={styles.shareMenuLabel}>Compartilhar</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.shareDropdown} role="menu">
          <button type="button" className={styles.shareDropItem} onClick={handleCopy} role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {copied ? '✓ Copiado!' : 'Copiar link'}
          </button>
          <button type="button" className={styles.shareDropItem} onClick={handleWhatsApp} role="menuitem">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.418A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.046-1.107l-.29-.172-3.006.861.862-2.939-.19-.302A7.953 7.953 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
            </svg>
            WhatsApp
          </button>
          <button type="button" className={`${styles.shareDropItem} ${styles.shareDropItemStory}`} onClick={handleStory} disabled={storyLoading} role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="15" height="15" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.3" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
            </svg>
            Stories
          </button>
          <button type="button" className={styles.shareDropItem} onClick={handleQr} role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h3v3h-3zM17 17h3v3M17 14h3" />
            </svg>
            QR Code
          </button>
        </div>
      )}

      {toast && <div className={styles.storyToast}>{toast}</div>}

      {showQr && (
        <QrCodeModal
          url={pageUrl}
          accentColor={accentColor}
          personOne={personOneName}
          personTwo={personTwoName}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}
