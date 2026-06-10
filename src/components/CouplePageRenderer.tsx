import { Link } from 'react-router-dom';
import type { CouplePage } from '../shared/index';
import { useCounter, pad } from '../hooks/useCounter';
import VinylPlayer from './VinylPlayer';
import styles from '../pages/PublicPage.module.css';

interface StoryBlock { date: string; title: string; text: string; }
interface StoryJson {
  eyebrow?: string;
  sinceText?: string;
  storyHeadEyebrow?: string;
  storyHeadTitle?: string;
  blocks?: StoryBlock[];
  closeLine?: string;
  closeSign?: string;
  capCenter?: string;
  caps?: string[];
}

function LiveCounter({ startDate, label }: { startDate: string; label: string }) {
  const { days, hours, mins, secs } = useCounter(new Date(startDate));
  return (
    <div className={styles.ccount}>
      <div className={styles.ccountLabel}><span className={styles.live} />{label}</div>
      <div className={styles.ccountRow}>
        <div className={styles.ccountU}><span className={styles.ccountN}>{days.toLocaleString('pt-BR')}</span><span className={styles.ccountL}>dias</span></div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}><span className={styles.ccountN}>{pad(hours)}</span><span className={styles.ccountL}>horas</span></div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}><span className={styles.ccountN}>{pad(mins)}</span><span className={styles.ccountL}>min</span></div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}><span className={styles.ccountN}>{pad(secs)}</span><span className={styles.ccountL}>seg</span></div>
      </div>
    </div>
  );
}

export default function CouplePageRenderer({
  page,
  copied = false,
  onCopy,
  onShareWhatsapp,
  showChrome = true,
  previewOnly = false,
}: {
  page: CouplePage;
  copied?: boolean;
  onCopy?: () => void;
  onShareWhatsapp?: () => void;
  showChrome?: boolean;
  previewOnly?: boolean;
}) {
  let story: StoryJson = {};
  if (page.storyJson) {
    try { story = JSON.parse(page.storyJson); } catch { story = {}; }
  }

  const eyebrow = story.eyebrow || 'A nossa história';
  const sinceText = story.sinceText || page.mainText || '';
  const storyEyebrow = story.storyHeadEyebrow || '';
  const storyH2 = story.storyHeadTitle || '';
  const blocks = story.blocks || [];
  const closeLine = story.closeLine || '';
  const closeSign = story.closeSign || `${page.personOneName} & ${page.personTwoName}`;
  const capCenter = story.capCenter || '';
  const caps = story.caps || ['', '', ''];

  let theme = 'rose';
  if (page.themeConfigJson) {
    try { theme = JSON.parse(page.themeConfigJson).theme || 'rose'; } catch { theme = 'rose'; }
  }

  const photos = page.assets?.filter((a) => a.type === 'photo') ?? [];
  const photoAt = (pos: number) => photos.find((p) => p.position === pos);
  const centerPhoto = photoAt(0);
  const p1 = photoAt(1);
  const p2 = photoAt(2);
  const p3 = photoAt(3);
  const s1 = photoAt(4);
  const s2 = photoAt(5);
  const hasScene = centerPhoto || p1 || p2 || p3;
  const hasStory = storyEyebrow || storyH2 || blocks.some((b) => b.title || b.text);
  const revealClass = previewOnly ? 'reveal in' : 'reveal';

  return (
    <div data-theme={theme} className={styles.page}>
      {showChrome && (
        <header className={styles.cbar}>
          <div className={`${styles.cwrap} ${styles.cbarIn}`}>
            <Link to="/" className={styles.cbarBrand}>Somos Eternos</Link>
            <div className={styles.cbarShare}>
              {onCopy && <button className={styles.cbarCopy} type="button" onClick={onCopy}>{copied ? '✓ Copiado' : 'Copiar link'}</button>}
              {onShareWhatsapp && <button className={styles.cbarWa} type="button" onClick={onShareWhatsapp}>WhatsApp</button>}
            </div>
          </div>
        </header>
      )}

      <main>
        <section className={styles.chero}>
          <div className={styles.cwrap}>
            <span className={`eyebrow ${styles.cheroEyebrow}`}>{eyebrow}</span>
            <h1 className={styles.cheroNames}>{page.personOneName} <span className={styles.amp}>&amp;</span> {page.personTwoName}</h1>
            {sinceText && <p className={styles.cheroSince}>{sinceText}</p>}
            <LiveCounter startDate={page.startDate} label="Juntos há" />
          </div>
        </section>

        {hasScene && (
          <section>
            <div className={styles.cwrap}>
              <div className={styles.cscene}>
                {p1 && <div className={`polaroid ${styles.cp1} ${revealClass}`}><img style={{ width: 190, height: 160 }} src={p1.url} alt={p1.alt || ''} /><div className="cap">{caps[0]}</div></div>}
                {p2 && <div className={`polaroid ${styles.cp2} ${revealClass}`}><img style={{ width: 170, height: 200 }} src={p2.url} alt={p2.alt || ''} /><div className="cap">{caps[1]}</div></div>}
                {p3 && <div className={`polaroid ${styles.cp3} ${revealClass}`}><img style={{ width: 200, height: 150 }} src={p3.url} alt={p3.alt || ''} /><div className="cap">{caps[2]}</div></div>}
                {centerPhoto && <div className={`polaroid ${styles.cpCenter} ${revealClass}`}><img style={{ width: 300, height: 330 }} src={centerPhoto.url} alt={centerPhoto.alt || ''} /><div className="cap">{capCenter}</div></div>}
              </div>
            </div>
          </section>
        )}

        {hasStory && (
          <section className={styles.cstory}>
            <div className={styles.cwrap}>
              {(storyEyebrow || storyH2) && <div className={`${styles.cstoryHead} ${revealClass}`}>{storyEyebrow && <span className={`eyebrow ${styles.cheroEyebrow}`}>{storyEyebrow}</span>}{storyH2 && <h2 className="h2" style={{ marginTop: 18 }}>{storyH2}</h2>}</div>}
              {blocks.map((block, i) => {
                const photo = i === 0 ? s1 : i === 1 ? s2 : undefined;
                return (
                  <div key={i} className={`${styles.cstoryRow} ${i % 2 === 1 ? styles.flip : ''} ${!photo ? styles.cstoryNoPhoto : ''} ${revealClass}`}>
                    {photo && <div className={styles.cstoryMedia}><img src={photo.url} alt={photo.alt || block.title} /></div>}
                    <div className={styles.cstoryText}>{block.date && <span className={styles.cstoryDate}>{block.date}</span>}{block.title && <h3>{block.title}</h3>}{block.text && <p>{block.text}</p>}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {closeLine && <section className={styles.cclose}><div className={styles.cwrap}><p className={styles.ccloseLine}>{closeLine}</p><p className={styles.ccloseSub}>{closeSign}</p></div></section>}
      </main>

      {showChrome && (
        <footer className={styles.cmade}>
          <div className={styles.cwrap}>
            <span className={styles.cmadeK}>Esta página foi feita no Somos Eternos</span>
            <h2>Toda história de amor merece uma casa própria na internet.</h2>
            <Link to="/entrar" className="btn btn--lg" style={{ background: 'var(--terra)', color: '#fff' }}>Criar a nossa página assim →</Link>
          </div>
        </footer>
      )}

      {page.spotifyTrackId && <VinylPlayer trackId={page.spotifyTrackId} song={page.spotifySong ?? 'A nossa música'} artist={page.spotifyArtist ?? ''} previewOnly={previewOnly} />}
    </div>
  );
}
