import { useState } from 'react';
import { generateStoryImage } from '../utils/storyImage';
import { trackEvent } from '../utils/analytics';
import styles from '../pages/PublicPage.module.css';

function readColor(el: HTMLElement, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export default function ShareStoryButton({
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
  sinceText?: string;
  photoUrl?: string | null;
  pageUrl: string;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    trackEvent('public_page_story_click');
    try {
      const el = containerRef.current;
      const colors = {
        bg: el ? readColor(el, '--bg', '#FBF3F1') : '#FBF3F1',
        bgCard: el ? readColor(el, '--bg-card', '#FFFBFA') : '#FFFBFA',
        ink: el ? readColor(el, '--ink', '#2A151A') : '#2A151A',
        ink2: el ? readColor(el, '--ink-2', '#6E3B43') : '#6E3B43',
        terra: el ? readColor(el, '--terra', '#BC4257') : '#BC4257',
        terraLight: el ? readColor(el, '--terra-light', '#E8AEB7') : '#E8AEB7',
      };

      const blob = await generateStoryImage({
        personOneName,
        personTwoName,
        startDate,
        sinceText,
        photoUrl,
        pageUrl,
        colors,
      });
      if (!blob) throw new Error('story image generation failed');

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
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={styles.cbarStory} onClick={handleClick} disabled={loading}>
        {loading ? (
          <span className="spinner spinner--dark" style={{ width: 14, height: 14 }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="15" height="15" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.3" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
          </svg>
        )}
        <span className={styles.cbarStoryLabel}>Stories</span>
      </button>
      {toast && <div className={styles.storyToast}>{toast}</div>}
    </>
  );
}
