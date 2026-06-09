import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import { useCounter, pad } from '../hooks/useCounter';
import type { CouplePage, PageAsset, PageStatus } from '../shared/index';
import CouplePageRenderer from '../components/CouplePageRenderer';
import styles from './Editor.module.css';

/* ── types ──────────────────────────────────────────────────────── */
interface StoryBlock {
  date: string;
  title: string;
  text: string;
}

interface StoryJson {
  eyebrow: string;
  sinceText: string;
  storyHeadEyebrow: string;
  storyHeadTitle: string;
  blocks: StoryBlock[];
  closeLine: string;
  closeSign: string;
  capCenter?: string;
  caps?: string[];
}

interface ThemeConfig {
  theme: string;
  template?: TemplateKey;
  // legacy fields kept for backward-compat reading (pre-0002_spotify pages)
  spotifyUrl?: string;
  songName?: string;
  artistName?: string;
}

/* ── helpers ────────────────────────────────────────────────────── */

// Fonte: editor.js — parseTrack()
function parseTrackId(url: string): string {
  if (!url) return '';
  const m = url.match(/track[/:]([A-Za-z0-9]{22})/);
  return m ? m[1] : '';
}

// Fonte: editor.js — tryOEmbed()
async function tryOEmbed(url: string, onTitle: (t: string) => void): Promise<void> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data?.title) onTitle(data.title);
  } catch { /* ignore */ }
}

const THEMES = [
  { key: 'rose',      name: 'Rosê',      chips: ['#FBF3F1', '#C0888D', '#BC4257'] },
  { key: 'bordo',     name: 'Bordô',     chips: ['#FAF4EF', '#B07C6C', '#A6293A'] },
  { key: 'terracota', name: 'Terracota', chips: ['#FAF7F2', '#8B6B4A', '#C4614A'] },
  { key: 'lavanda',   name: 'Lavanda',   chips: ['#F8F4F7', '#B284A8', '#A85077'] },
  { key: 'champagne', name: 'Champagne', chips: ['#FAF6EE', '#9A7B45', '#A6802F'] },
  { key: 'marinho',   name: 'Marinho',   chips: ['#F4F5F8', '#5E6B80', '#3A5687'] },
  { key: 'oceano',    name: 'Oceano',    chips: ['#F1F6F6', '#4E817A', '#1F8079'] },
  { key: 'sage',      name: 'Sage',      chips: ['#F4F6F0', '#74804F', '#5F7D3E'] },
] as const;

type ThemeKey = typeof THEMES[number]['key'];
type TemplateKey = 'namoro' | 'casamento' | 'viagem';

const TEMPLATE_META: Record<TemplateKey, {
  name: string;
  desc: string;
  colors: ThemeKey[];
  image: string;
  alt: string;
}> = {
  namoro: {
    name: 'Namoro',
    desc: 'Romântico, moderno e acolhedor',
    colors: ['rose', 'lavanda', 'terracota'],
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=640&h=480&fit=crop&q=80',
    alt: 'casal abraçado ao entardecer',
  },
  casamento: {
    name: 'Casamento',
    desc: 'Elegante, sofisticado e atemporal',
    colors: ['bordo', 'champagne', 'marinho'],
    image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=640&h=480&fit=crop&q=80',
    alt: 'casal de noivos',
  },
  viagem: {
    name: 'Viagem',
    desc: 'Leve, aventureiro e memorável',
    colors: ['terracota', 'oceano', 'sage'],
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=640&h=480&fit=crop&q=80',
    alt: 'casal viajando de barco entre montanhas',
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
    .replace(/^-+|-+$/g, '');
}

const SINCE_PRESETS = [
  'A nossa história, contada em tempo real.',
  'Cada segundo desde que viramos nós dois.',
  'Do primeiro encontro até agora — e sem parar.',
  'Um amor que o tempo só faz crescer.',
  'Tudo começou num dia comum. E nunca mais foi comum.',
];

const STORY_TITLE_PRESETS = [
  'Desde o primeiro olhar',
  'Quando tudo começou',
  'A história de nós dois',
  'O dia que mudou tudo',
  'Onde começou',
];

const STORY_TEXT_PRESETS = [
  'Foi num instante, mas foi para sempre.',
  'A gente não escolheu — simplesmente aconteceu.',
  'Não era o momento certo. Mas foi o momento real.',
  'Antes de saber seu nome, já sabia que era você.',
  'Tinha tudo para não dar certo. E deu.',
];

const CAP_CENTER_PRESETS = [
  'A nossa favorita',
  'Quando vi você pela primeira vez',
  'Amor à primeira vista — e a certeza veio depois',
  'O dia que eu não esqueci mais',
  'A minha pessoa preferida no mundo',
  'Hoje, e sempre',
];

const CAP_PRESETS = [
  ['O nosso começo', 'Quando tudo era novidade', 'Onde tudo começou', 'O primeiro de muitos'],
  ['A nossa viagem inesquecível', 'O mundo era só nosso', 'Longe de casa, perto de você', 'O melhor dia de todos'],
  ['Hoje, e sempre', 'O nosso agora', 'E a melhor parte ainda vem', 'O nosso para sempre'],
];

const CLOSE_LINE_PRESETS = [
  'Uma vida inteira pra celebrar.',
  'E a melhor parte ainda está por vir.',
  'Que o contador nunca pare.',
  'Pra sempre começa hoje.',
  'O nosso para sempre começou aqui.',
];

/* ── live preview counter ────────────────────────────────────────── */
function PreviewCounter({ startDate }: { startDate: string | null }) {
  const d = startDate ? new Date(startDate) : null;
  const { days, hours, mins, secs } = useCounter(d);
  if (!d) return <p className={styles.pvEmpty}>Escolha uma data para ver o contador</p>;
  return (
    <div className={styles.pvCount}>
      <div className={styles.pvCountLabel}><span className={styles.live} />Juntos há</div>
      <div className={styles.pvCountRow}>
        <div className={styles.pvUnit}><span className={styles.pvNum}>{days.toLocaleString('pt-BR')}</span><span className={styles.pvLab}>dias</span></div>
        <span className={styles.pvSep}>:</span>
        <div className={styles.pvUnit}><span className={styles.pvNum}>{pad(hours)}</span><span className={styles.pvLab}>horas</span></div>
        <span className={styles.pvSep}>:</span>
        <div className={styles.pvUnit}><span className={styles.pvNum}>{pad(mins)}</span><span className={styles.pvLab}>min</span></div>
        <span className={styles.pvSep}>:</span>
        <div className={styles.pvUnit}><span className={styles.pvNum}>{pad(secs)}</span><span className={styles.pvLab}>seg</span></div>
      </div>
    </div>
  );
}

/* ── photo upload zone ───────────────────────────────────────────── */
function PhotoUpload({
  asset,
  uploading,
  onUpload,
  onRemove,
  disabled,
  label,
}: {
  asset: PageAsset | undefined;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void | Promise<void>;
  disabled: boolean;
  label: string;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div className={`${styles.edUp} ${asset ? styles.hasImg : ''} ${drag ? styles.isDrag : ''}`}>
      <input
        type="file"
        accept="image/*"
        onChange={onUpload}
        disabled={disabled}
        onDragEnter={() => setDrag(true)}
        onDragLeave={() => setDrag(false)}
        onDrop={() => setDrag(false)}
      />
      {asset && (
        <button type="button" className={styles.edUpX} onClick={onRemove} aria-label={`Remover ${label}`}>✕</button>
      )}
      {asset && <img src={asset.url} alt={asset.alt || label} className={styles.edUpImg} />}
      {!asset && (
        <div className={styles.edUpPh}>
          {uploading ? (
            <span className="spinner spinner--dark" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="24" height="24">
                <path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="8.5" cy="8.5" r="1.5" /><rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span>{label}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── accordion section ───────────────────────────────────────────── */
function AccordionSec({
  num,
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  num: string;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`${styles.edSec} ${open ? styles.open : ''}`}>
      <button className={styles.edSecHead} type="button" onClick={onToggle}>
        <span className={styles.edSecNum}>{num}</span>
        <span className={styles.edSecT}>
          <b>{title}</b>
          <span>{sub}</span>
        </span>
        <span className={styles.edSecChev}>⌄</span>
      </button>
      <div className={styles.edSecBody}>{children}</div>
    </section>
  );
}

/* ── ed-vary: select (Sempre) vs textarea/input (Eterno) ─────────── */
function VarySelect({
  id,
  label,
  presets,
  value,
  onChange,
  isEterno,
  placeholder,
  maxLength,
  multiline,
}: {
  id: string;
  label: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
  isEterno: boolean;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <div className={styles.edField}>
      <label className={styles.edLabel} htmlFor={id}>{label}</label>
      {isEterno ? (
        multiline ? (
          <textarea
            id={id}
            className={styles.edTextarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        ) : (
          <input
            id={id}
            className={styles.edInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )
      ) : (
        <select
          id={id}
          className={styles.edSelect}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Escolha uma opção…</option>
          {presets.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
    </div>
  );
}

/* ── main editor component ───────────────────────────────────────── */
export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const isNew = !pageId;

  const selectedPlan = typeof sessionStorage !== 'undefined'
    ? (sessionStorage.getItem('selected_plan') ?? 'sempre')
    : 'sempre';
  const isEterno = selectedPlan === 'eterno';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [openSecs, setOpenSecs] = useState<Set<number>>(new Set([1, 2]));
  const [pageStatus, setPageStatus] = useState<PageStatus>('draft');

  /* form state */
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [personOne, setPersonOne] = useState('');
  const [personTwo, setPersonTwo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [eyebrow, setEyebrow] = useState('');
  const [sinceText, setSinceText] = useState('');
  const [mainText, setMainText] = useState('');
  const [template, setTemplate] = useState<TemplateKey>('namoro');
  const [showTemplates, setShowTemplates] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>('rose');
  const [assets, setAssets] = useState<PageAsset[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  /* captions */
  const [capCenter, setCapCenter] = useState('');
  const [caps, setCaps] = useState(['', '', '']);

  /* story */
  const [storyHeadEyebrow, setStoryHeadEyebrow] = useState('');
  const [storyHeadTitle, setStoryHeadTitle] = useState('');
  const [storyBlocks, setStoryBlocks] = useState<StoryBlock[]>([
    { date: '', title: '', text: '' },
    { date: '', title: '', text: '' },
  ]);
  const [closeLine, setCloseLine] = useState('');
  const [closeSign, setCloseSign] = useState('');

  /* music */
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyTrackId, setSpotifyTrackId] = useState('');
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');

  const splitRef = useRef<HTMLDivElement>(null);

  function toggleSec(n: number) {
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  /* load existing page */
  useEffect(() => {
    if (!pageId) return;
    api.pages.get(pageId)
      .then((page) => {
        setPageStatus(page.status);
        setTitle(page.title);
        setSlug(page.slug);
        setPersonOne(page.personOneName);
        setPersonTwo(page.personTwoName);
        setStartDate(page.startDate ? page.startDate.slice(0, 10) : '');
        setStartTime(page.startDate?.slice(11, 16) || '12:00');
        setMainText(page.mainText ?? '');
        if (page.storyJson) {
          try {
            const s: StoryJson = JSON.parse(page.storyJson);
            setEyebrow(s.eyebrow ?? '');
            setSinceText(s.sinceText ?? '');
            setStoryHeadEyebrow(s.storyHeadEyebrow ?? '');
            setStoryHeadTitle(s.storyHeadTitle ?? '');
            if (s.blocks?.length) setStoryBlocks(s.blocks);
            setCloseLine(s.closeLine ?? '');
            setCloseSign(s.closeSign ?? '');
            setCapCenter(s.capCenter ?? '');
            if (s.caps?.length) setCaps([s.caps[0] ?? '', s.caps[1] ?? '', s.caps[2] ?? '']);
            setCapCenter(s.capCenter ?? '');
            if (s.caps?.length) setCaps([s.caps[0] ?? '', s.caps[1] ?? '', s.caps[2] ?? '']);
          } catch { /* malformed json */ }
        }
        if (page.themeConfigJson) {
          try {
            const tc: ThemeConfig = JSON.parse(page.themeConfigJson);
            const nextTemplate = tc.template && TEMPLATE_META[tc.template] ? tc.template : 'namoro';
            setTemplate(nextTemplate);
            setTheme(TEMPLATE_META[nextTemplate].colors.includes(tc.theme as ThemeKey) ? (tc.theme as ThemeKey) : TEMPLATE_META[nextTemplate].colors[0]);
            // Legacy fallback: use themeConfigJson spotify fields only if dedicated fields absent
            if (page.spotifyTrackUrl === null && tc.spotifyUrl) {
              setSpotifyUrl(tc.spotifyUrl);
              setSongName(tc.songName ?? '');
              setArtistName(tc.artistName ?? '');
              setSpotifyTrackId(parseTrackId(tc.spotifyUrl));
            }
          } catch { /* malformed json */ }
        }
        // Dedicated spotify fields (post-migration pages take priority)
        if (page.spotifyTrackUrl !== null && page.spotifyTrackUrl !== undefined) {
          setSpotifyUrl(page.spotifyTrackUrl);
          setSongName(page.spotifySong ?? '');
          setArtistName(page.spotifyArtist ?? '');
          setSpotifyTrackId(parseTrackId(page.spotifyTrackUrl));
        }
        setAssets(page.assets ?? []);
      })
      .catch(() => setError('Não foi possível carregar a página.'))
      .finally(() => setLoading(false));
  }, [pageId]);

  /* auto-generate internal slug from names; this is intentionally not shown in the UI */
  useEffect(() => {
    if (!isNew || slug) return;
    const base = slugify(`${personOne || 'pagina'}${personTwo ? ` e ${personTwo}` : ''}`);
    if (base) setSlug(base);
  }, [isNew, slug, personOne, personTwo]);

  /* auto-generate title from names */
  useEffect(() => {
    if (!isNew || title) return;
    if (personOne && personTwo) setTitle(`${personOne} & ${personTwo}`);
  }, [personOne, personTwo]);

  /* build story json */
  function buildStoryJson(): string {
    const s: StoryJson = {
      eyebrow,
      sinceText,
      storyHeadEyebrow,
      storyHeadTitle,
      blocks: storyBlocks,
      closeLine,
      closeSign: closeSign || `${personOne} & ${personTwo}`,
      capCenter,
      caps,
    };
    return JSON.stringify(s);
  }

  function buildStartDateIso(): string {
    if (!startDate) return new Date().toISOString();
    return new Date(`${startDate}T${startTime || '12:00'}:00`).toISOString();
  }

  /* build theme config json — only persists theme; spotify uses dedicated DB fields */
  function buildThemeJson(): string {
    return JSON.stringify({ theme, template });
  }

  async function buildInternalSlug(): Promise<string> {
    const base = slug || slugify(`${personOne || title || 'pagina'}${personTwo ? ` e ${personTwo}` : ''}`) || `pagina-${Date.now()}`;
    if (!isNew) return base;

    try {
      const { available } = await api.slugs.check(base);
      if (available) return base;
    } catch { /* save will surface any remaining backend validation error */ }
    return `${base.slice(0, 40)}-${Date.now().toString(36).slice(-5)}`;
  }

  function handleTemplateSelect(nextTemplate: TemplateKey) {
    setTemplate(nextTemplate);
    setTheme(TEMPLATE_META[nextTemplate].colors[0]);
    setShowTemplates(false);
    trackEvent('template_select');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    trackEvent('editor_save');
    try {
      const internalSlug = await buildInternalSlug();
      setSlug(internalSlug);
      const baseData = {
        title: title.trim() || `${personOne} & ${personTwo}`,
        slug: internalSlug,
        personOneName: personOne.trim(),
        personTwoName: personTwo.trim(),
        startDate: buildStartDateIso(),
        mainText: sinceText || mainText,
        storyJson: buildStoryJson(),
        themeConfigJson: buildThemeJson(),
        privacy: 'public' as const,
      };

      let saved: CouplePage;
      if (pageId) {
        const trackId = parseTrackId(spotifyUrl);
        saved = await api.pages.update(pageId, {
          ...baseData,
          spotifyTrackId:  trackId || undefined,
          spotifyTrackUrl: spotifyUrl || undefined,
          spotifySong:     songName   || undefined,
          spotifyArtist:   artistName || undefined,
        });
      } else {
        saved = await api.pages.create(baseData);
        navigate(`/editor/${saved.id}`, { replace: true });
      }
      setPageStatus(saved.status);
      setSaveMsg('Salvo!');
      setTimeout(() => setSaveMsg(''), 2000);
      trackEvent('page_title_filled');
    } catch (err: unknown) {
      trackEvent('editor_save_error');
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!pageId) { await handleSave(); return; }
    setPublishing(true);
    trackEvent('publish_click');
    try {
      await handleSave();
      await api.pages.validatePublish(pageId);
      if (pageStatus === 'paid') {
        const published = await api.pages.publish(pageId);
        setPageStatus(published.status);
        trackEvent('publish_success');
        navigate(`/p/${published.slug}`);
        return;
      }
      if (pageStatus === 'published') {
        navigate(`/p/${slug}`);
        return;
      }
      navigate(`/planos/${pageId}`);
    } catch (err: unknown) {
      trackEvent('publish_validation_error');
      setError(err instanceof Error ? err.message : 'Preencha todos os campos obrigatórios.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, position: number) {
    const file = e.target.files?.[0];
    if (!file || !pageId) return;
    setUploadingIdx(position);
    trackEvent('photo_upload_start');
    try {
      const replacedAssets = assets.filter((a) => a.position === position);
      const asset = await api.uploads.upload(pageId, file, 'photo', position);
      await Promise.allSettled(replacedAssets.map((a) => api.uploads.delete(a.id)));
      setAssets((prev) => {
        const next = prev.filter((a) => a.position !== position);
        return [...next, asset].sort((a, b) => a.position - b.position);
      });
      trackEvent('photo_upload_success');
    } catch {
      trackEvent('photo_upload_error');
      setError('Erro ao enviar imagem.');
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleRemoveAsset(position: number) {
    const removed = assets.filter((a) => a.position === position);
    if (!removed.length) return;
    setAssets((prev) => prev.filter((a) => a.position !== position));
    try {
      await Promise.all(removed.map((a) => api.uploads.delete(a.id)));
    } catch (err: unknown) {
      setAssets((prev) => [...prev, ...removed].sort((a, b) => a.position - b.position));
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem.');
    }
  }

  function updateStoryBlock(idx: number, field: keyof StoryBlock, value: string) {
    setStoryBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  }

  function updateCap(idx: number, value: string) {
    setCaps((prev) => prev.map((c, i) => i === idx ? value : c));
  }

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <span className="spinner spinner--dark" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (pageId && pageStatus !== 'paid' && pageStatus !== 'published') return (
    <div className={styles.edBody}>
      <header className={styles.edTop}>
        <Link to="/minhas-paginas" className={styles.edTopBrand}>
          Sempre<span className={styles.pt}>.</span>
          <span className={styles.edTopStep}>Editor bloqueado</span>
        </Link>
        <div className={styles.edTopActions}>
          <Link className="btn btn--primary" to={`/planos/${pageId}`}>Ir para pagamento</Link>
        </div>
      </header>
      <main className={styles.lockedEditor}>
        <div className={styles.lockedCard}>
          <span className="eyebrow eyebrow--center">Pagamento necessário</span>
          <h1>Finalize o pagamento para editar a página.</h1>
          <p>O template escolhido foi salvo no rascunho. Depois da confirmação do pagamento, o editor completo será liberado com esse template selecionado.</p>
          <Link className="btn btn--primary btn--lg" to={`/planos/${pageId}`}>Escolher plano e pagar <span className="arrow">→</span></Link>
        </div>
      </main>
    </div>
  );

  const currentTemplate = TEMPLATE_META[template];
  const availableThemes = currentTemplate.colors
    .map((key) => THEMES.find((t) => t.key === key))
    .filter((t): t is typeof THEMES[number] => Boolean(t));
  const currentThemeData = THEMES.find((t) => t.key === theme) ?? availableThemes[0] ?? THEMES[0];
  const planLabel = isEterno ? 'Plano Eterno · R$ 37,90' : 'Plano Sempre · R$ 27,90';
  const saveStatus = saving ? 'Salvando rascunho' : saveMsg ? 'Rascunho salvo' : '';
  const previewStartIso = startDate ? new Date(`${startDate}T${startTime || '12:00'}:00`).toISOString() : new Date().toISOString();
  const previewPage: CouplePage = {
    id: pageId ?? 'preview',
    userId: 'preview',
    title: title || `${personOne || 'Nome'} & ${personTwo || 'Nome'}`,
    slug: slug || 'preview',
    personOneName: personOne || 'Nome',
    personTwoName: personTwo || 'Nome',
    startDate: previewStartIso,
    mainText: sinceText || mainText || null,
    storyJson: buildStoryJson(),
    templateId: null,
    themeConfigJson: buildThemeJson(),
    spotifyTrackId: spotifyTrackId || null,
    spotifyTrackUrl: spotifyUrl || null,
    spotifySong: songName || null,
    spotifyArtist: artistName || null,
    privacy: 'public',
    status: pageStatus,
    publicUrl: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assets,
  };

  return (
    <div className={styles.edBody}>
      {/* ── top bar ──────────────────────────────────────────── */}
      <header className={styles.edTop}>
        <Link to="/minhas-paginas" className={styles.edTopBrand}>
          Sempre<span className={styles.pt}>.</span>
          <span className={styles.edTopStep}>Editor da sua página</span>
        </Link>
        <span className={styles.edPlanPill}>♥ {planLabel}</span>
        <div className={styles.edTopActions}>
          {saveStatus && (
            <span className={`${styles.edTopSave} ${saving ? styles.isSaving : ''}`} aria-live="polite">
              <span className={styles.saveDot} />{saveStatus}
            </span>
          )}
          <div className={`${styles.edTabToggle}`}>
            <button
              className={activeTab === 'edit' ? styles.tabOn : ''}
              type="button"
              onClick={() => { setActiveTab('edit'); if (splitRef.current) splitRef.current.dataset.view = 'edit'; }}
            >Editar</button>
            <button
              className={activeTab === 'preview' ? styles.tabOn : ''}
              type="button"
              onClick={() => { setActiveTab('preview'); if (splitRef.current) splitRef.current.dataset.view = 'preview'; }}
            >Prévia</button>
          </div>
          <button
            className="btn btn--primary"
            style={{ minHeight: 40, padding: '10px 22px', fontSize: 14 }}
            type="button"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? <span className="spinner" /> : <>Publicar <span className="arrow">→</span></>}
          </button>
        </div>
      </header>

      {/* ── split layout ─────────────────────────────────────── */}
      <div className={styles.edSplit} data-view="edit" ref={splitRef}>

        {/* ── form rail ──────────────────── */}
        <aside className={styles.edForm}>
          <div className={styles.edIntro}>
            <h1>A página de vocês começa em branco.</h1>
            <p>Preencha os campos abaixo e veja tudo ganhar vida na prévia ao lado. Quando estiver do jeito de vocês, é só publicar.</p>
          </div>

          {error && (
            <div className={styles.errBanner}>
              {error}
              <button type="button" onClick={() => setError('')} aria-label="Fechar mensagem de erro">×</button>
            </div>
          )}

          {/* 1 · Template e cores */}
          <AccordionSec num="1" title="Template e cores" sub="A cara da página de vocês" open={openSecs.has(1)} onToggle={() => toggleSec(1)}>
            <div className={styles.edTplbar}>
              <div className={styles.edTplbarL}>
                <span className={styles.edTplbarTag}>{currentTemplate.name}</span>
                <span className={styles.edTplbarDesc}>{currentTemplate.desc}</span>
              </div>
              <button
                type="button"
                className={styles.edTplbarSwap}
                onClick={() => setShowTemplates((v) => !v)}
                aria-expanded={showTemplates}
              >
                Trocar template
              </button>
            </div>

            {showTemplates && (
              <div className={styles.tplGrid}>
                {(Object.entries(TEMPLATE_META) as Array<[TemplateKey, typeof TEMPLATE_META[TemplateKey]]>).map(([key, tpl]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.tplCard} ${template === key ? styles.tplOn : ''}`}
                    onClick={() => handleTemplateSelect(key)}
                  >
                    <span className={styles.tplThumb}>
                      <span className={styles.tplTag}>{tpl.name}</span>
                      <span className={styles.tplPick}>✓</span>
                      <img src={tpl.image} alt={tpl.alt} />
                    </span>
                    <span className={styles.tplBody}>
                      <strong>{tpl.name}</strong>
                      <span>{tpl.desc}.</span>
                      <span className={styles.tplColors}>
                        <span>Cores</span>
                        <span className={styles.tplDots}>
                          {tpl.colors.map((colorKey) => {
                            const color = THEMES.find((t) => t.key === colorKey)?.chips[2] ?? 'var(--terra)';
                            return <i key={colorKey} style={{ background: color }} />;
                          })}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <label className={styles.edLabel} style={{ margin: '16px 0 8px', display: 'block' }}>Cores deste template</label>
            <div className={styles.edThemes}>
              {availableThemes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.edTheme} ${theme === t.key ? styles.isOn : ''}`}
                  onClick={() => { setTheme(t.key); trackEvent('template_select'); }}
                >
                  <span className={styles.chips}>
                    {t.chips.map((c) => <i key={c} style={{ background: c }} />)}
                  </span>
                  {t.name}
                </button>
              ))}
            </div>
          </AccordionSec>

          {/* 2 · Vocês dois */}
          <AccordionSec num="2" title="Vocês dois" sub="Nomes, data e o contador" open={openSecs.has(2)} onToggle={() => toggleSec(2)}>
            <div className={styles.edField}>
              <label className={styles.edLabel} htmlFor="fEyebrow">
                Chamada do topo <span className={styles.opt}>· opcional</span>
              </label>
              <input
                id="fEyebrow"
                className={styles.edInput}
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="A nossa história"
                maxLength={40}
              />
            </div>
            <div className={styles.edRow}>
              <div className={styles.edField}>
                <label className={styles.edLabel} htmlFor="fName1">Nome 1</label>
                <input
                  id="fName1"
                  className={styles.edInput}
                  value={personOne}
                  onChange={(e) => setPersonOne(e.target.value)}
                  placeholder="Marina"
                  maxLength={22}
                />
              </div>
              <div className={styles.edField}>
                <label className={styles.edLabel} htmlFor="fName2">Nome 2</label>
                <input
                  id="fName2"
                  className={styles.edInput}
                  value={personTwo}
                  onChange={(e) => setPersonTwo(e.target.value)}
                  placeholder="Thiago"
                  maxLength={22}
                />
              </div>
            </div>
            <VarySelect
              id="fSince"
              label="Frase de abertura"
              presets={SINCE_PRESETS}
              value={sinceText}
              onChange={setSinceText}
              isEterno={isEterno}
              placeholder="Casados desde o nosso sim — e contando cada segundo de vida a dois."
              maxLength={160}
              multiline
            />
            <div className={styles.edRow}>
              <div className={styles.edField}>
                <label className={styles.edLabel} htmlFor="fDate">Data de início</label>
                <input
                  id="fDate"
                  className={styles.edInput}
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); trackEvent('start_date_selected'); }}
                />
              </div>
              <div className={styles.edField}>
                <label className={styles.edLabel} htmlFor="fTime">
                  Horário <span className={styles.opt}>· opcional</span>
                </label>
                <input
                  id="fTime"
                  className={styles.edInput}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <p className={styles.edHint}>É a partir daqui que o contador começa a correr — o primeiro encontro, o pedido, o casamento. Você escolhe.</p>
          </AccordionSec>

          {/* 3 · As fotos de vocês */}
          <AccordionSec num="3" title="As fotos de vocês" sub="Quatro fotos em estilo Polaroid" open={openSecs.has(3)} onToggle={() => toggleSec(3)}>
            {!pageId && (
              <p className={styles.edHint} style={{ color: 'var(--terra)', marginBottom: 12 }}>
                Salve a página primeiro para enviar fotos.
              </p>
            )}
            <div className={styles.edPhoto}>
              <label className={styles.edLabel}>Foto principal (central)</label>
              <PhotoUpload
                asset={assets.find((a) => a.position === 0)}
                uploading={uploadingIdx === 0}
                onUpload={(e) => handleUpload(e, 0)}
                onRemove={() => handleRemoveAsset(0)}
                disabled={!pageId || uploadingIdx !== null}
                label="Clique ou arraste a foto favorita"
              />
              <VarySelect
                id="capCenter"
                label=""
                presets={CAP_CENTER_PRESETS}
                value={capCenter}
                onChange={setCapCenter}
                isEterno={isEterno}
                placeholder="a nossa favorita"
                maxLength={40}
              />
            </div>
            <div className={styles.edRow}>
              {[1, 2].map((pos) => (
                <div className={styles.edPhoto} key={pos}>
                  <label className={styles.edLabel}>Foto {pos + 1}</label>
                  <PhotoUpload
                    asset={assets.find((a) => a.position === pos)}
                    uploading={uploadingIdx === pos}
                    onUpload={(e) => handleUpload(e, pos)}
                    onRemove={() => handleRemoveAsset(pos)}
                    disabled={!pageId || uploadingIdx !== null}
                    label="Foto"
                  />
                  <VarySelect
                    id={`cap${pos}`}
                    label=""
                    presets={CAP_PRESETS[pos - 1] ?? []}
                    value={caps[pos - 1]}
                    onChange={(v) => updateCap(pos - 1, v)}
                    isEterno={isEterno}
                    placeholder="Legenda"
                    maxLength={34}
                  />
                </div>
              ))}
            </div>
            <div className={styles.edPhoto}>
              <label className={styles.edLabel}>Foto 4</label>
              <PhotoUpload
                asset={assets.find((a) => a.position === 3)}
                uploading={uploadingIdx === 3}
                onUpload={(e) => handleUpload(e, 3)}
                onRemove={() => handleRemoveAsset(3)}
                disabled={!pageId || uploadingIdx !== null}
                label="Foto"
              />
              <VarySelect
                id="cap3"
                label=""
                presets={CAP_PRESETS[2] ?? []}
                value={caps[2]}
                onChange={(v) => updateCap(2, v)}
                isEterno={isEterno}
                placeholder="Legenda"
                maxLength={34}
              />
            </div>
          </AccordionSec>

          {/* 4 · A história de vocês */}
          <AccordionSec num="4" title="A história de vocês" sub="Dois blocos com foto e texto" open={openSecs.has(4)} onToggle={() => toggleSec(4)}>
            <div className={styles.edField}>
              <label className={styles.edLabel} htmlFor="fStoryEyebrow">
                Chamada da seção <span className={styles.opt}>· opcional</span>
              </label>
              <input
                id="fStoryEyebrow"
                className={styles.edInput}
                value={storyHeadEyebrow}
                onChange={(e) => setStoryHeadEyebrow(e.target.value)}
                placeholder="Como chegamos aqui"
                maxLength={40}
              />
            </div>
            <VarySelect
              id="fStoryTitle"
              label="Título da seção"
              presets={['De um match até o altar.', 'Como chegamos até aqui.', 'A história de nós dois.']}
              value={storyHeadTitle}
              onChange={setStoryHeadTitle}
              isEterno={isEterno}
              placeholder="De um match até o altar."
              maxLength={80}
            />

            {storyBlocks.map((block, idx) => (
              <div key={idx} className={styles.storyBlock}>
                {idx > 0 && <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 18 }} />}
                <div className={styles.edPhoto}>
                  <label className={styles.edLabel}>Capítulo {idx + 1} — foto</label>
                  <PhotoUpload
                    asset={assets.find((a) => a.position === 4 + idx)}
                    uploading={uploadingIdx === 4 + idx}
                    onUpload={(e) => handleUpload(e, 4 + idx)}
                    onRemove={() => handleRemoveAsset(4 + idx)}
                    disabled={!pageId || uploadingIdx !== null}
                    label={`Foto do capítulo ${idx + 1}`}
                  />
                </div>
                <div className={styles.edField}>
                  <label className={styles.edLabel} htmlFor={`fS${idx + 1}Date`}>Capítulo {idx + 1} — data</label>
                  <input
                    id={`fS${idx + 1}Date`}
                    className={styles.edInput}
                    value={block.date}
                    onChange={(e) => updateStoryBlock(idx, 'date', e.target.value)}
                    placeholder={idx === 0 ? 'Março de 2019' : '14 de dezembro de 2024'}
                    maxLength={30}
                  />
                </div>
                <VarySelect
                  id={`fS${idx + 1}Title`}
                  label={`Capítulo ${idx + 1} — título`}
                  presets={STORY_TITLE_PRESETS}
                  value={block.title}
                  onChange={(v) => updateStoryBlock(idx, 'title', v)}
                  isEterno={isEterno}
                  placeholder={idx === 0 ? 'Onde tudo começou' : 'O dia do sim'}
                  maxLength={50}
                />
                <VarySelect
                  id={`fS${idx + 1}Text`}
                  label={`Capítulo ${idx + 1} — texto`}
                  presets={STORY_TEXT_PRESETS}
                  value={block.text}
                  onChange={(v) => updateStoryBlock(idx, 'text', v)}
                  isEterno={isEterno}
                  placeholder={idx === 0 ? 'Conte como vocês se conheceram…' : 'Conte um momento marcante…'}
                  maxLength={320}
                  multiline
                />
              </div>
            ))}
          </AccordionSec>

          {/* 5 · O encerramento */}
          <AccordionSec num="5" title="O encerramento" sub="A frase final da página" open={openSecs.has(5)} onToggle={() => toggleSec(5)}>
            <VarySelect
              id="fCloseLine"
              label="Frase final"
              presets={CLOSE_LINE_PRESETS}
              value={closeLine}
              onChange={setCloseLine}
              isEterno={isEterno}
              placeholder="Uma vida inteira pra celebrar."
              maxLength={140}
              multiline
            />
            <div className={styles.edField}>
              <label className={styles.edLabel} htmlFor="fCloseSign">Assinatura</label>
              <input
                id="fCloseSign"
                className={styles.edInput}
                value={closeSign}
                onChange={(e) => setCloseSign(e.target.value)}
                placeholder="Marina & Thiago"
                maxLength={40}
              />
            </div>
          </AccordionSec>

          {/* 6 · A música de vocês */}
          <AccordionSec num="6" title="A música de vocês" sub="Toca sozinha quando a página abre" open={openSecs.has(6)} onToggle={() => toggleSec(6)}>
            <div className={styles.edField}>
              <label className={styles.edLabel} htmlFor="fSpotify">Link da música no Spotify</label>
              <input
                id="fSpotify"
                className={styles.edInput}
                value={spotifyUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setSpotifyUrl(val);
                  const id = parseTrackId(val.trim());
                  setSpotifyTrackId(id);
                  if (id) tryOEmbed(val.trim(), (title) => { if (!songName) setSongName(title); });
                }}
                placeholder="https://open.spotify.com/track/..."
                inputMode="url"
              />
              <p className={styles.edHint}>
                No Spotify, abra a música → <b>Compartilhar</b> → <b>Copiar link</b> e cole aqui.
              </p>
              {/* hidden by default, shown when track ID is valid — Fonte: editor.css .ed-music-found.show */}
              <div className={`${styles.edMusicFound} ${spotifyTrackId ? styles.edMusicFoundVisible : ''}`}>
                <span className={styles.musicOk}>♪</span>
                <span>Música conectada — vai tocar ao abrir a página</span>
              </div>
            </div>
            <div className={styles.edMusicMeta}>
              <div className={styles.edField} style={{ margin: 0 }}>
                <label className={styles.edLabel} htmlFor="fSong">Nome da música</label>
                <input
                  id="fSong"
                  className={styles.edInput}
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="Perfect"
                  maxLength={40}
                />
              </div>
              <div className={styles.edField} style={{ margin: 0 }}>
                <label className={styles.edLabel} htmlFor="fArtist">Artista</label>
                <input
                  id="fArtist"
                  className={styles.edInput}
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Ed Sheeran"
                  maxLength={40}
                />
              </div>
            </div>
          </AccordionSec>

          <div className={styles.bottomActions}>
            <button
              className="btn btn--ghost-dark"
              style={{ marginRight: 12 }}
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <span className="spinner spinner--dark" /> : 'Salvar rascunho'}
            </button>
            <button
              className="btn btn--primary btn--lg"
              style={{ flex: 1, justifyContent: 'center' }}
              type="button"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? <span className="spinner" /> : <>Publicar página <span className="arrow">→</span></>}
            </button>
          </div>
        </aside>

        {/* ── live preview ───────────────── */}
        <div className={styles.edPreview}>
          <div className={styles.edPreviewBar}>
            <span className={styles.live} />Prévia ao vivo
          </div>
          <div className={styles.edPreviewScroll}>
            <div className={styles.edPreviewFrame}>
              <CouplePageRenderer page={previewPage} showChrome={false} previewOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Fonte: editor.css */
