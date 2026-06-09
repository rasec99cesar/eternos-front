import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import { useCounter, pad } from '../hooks/useCounter';
import type { CouplePage, PageAsset } from '../shared/index';
import styles from './Editor.module.css';

// Live preview counter
function PreviewCounter({ startDate }: { startDate: string | null }) {
  const d = startDate ? new Date(startDate) : null;
  const { days, hours, mins, secs } = useCounter(d);
  if (!d) return <div className={styles.counterEmpty}>Escolha uma data para ver o contador</div>;
  return (
    <div className={styles.previewCounter}>
      <div className={styles.pcUnit}><span className={styles.pcNum}>{days.toLocaleString('pt-BR')}</span><span className={styles.pcLab}>dias</span></div>
      <span className={styles.pcSep}>:</span>
      <div className={styles.pcUnit}><span className={styles.pcNum}>{pad(hours)}</span><span className={styles.pcLab}>horas</span></div>
      <span className={styles.pcSep}>:</span>
      <div className={styles.pcUnit}><span className={styles.pcNum}>{pad(mins)}</span><span className={styles.pcLab}>min</span></div>
      <span className={styles.pcSep}>:</span>
      <div className={styles.pcUnit}><span className={styles.pcNum}>{pad(secs)}</span><span className={styles.pcLab}>seg</span></div>
    </div>
  );
}

export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const isNew = !pageId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [personOne, setPersonOne] = useState('');
  const [personTwo, setPersonTwo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [mainText, setMainText] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [templateId, setTemplateId] = useState('');
  const [assets, setAssets] = useState<PageAsset[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Load existing page
  useEffect(() => {
    if (!pageId) return;
    api.pages.get(pageId)
      .then((page) => {
        setTitle(page.title);
        setSlug(page.slug);
        setPersonOne(page.personOneName);
        setPersonTwo(page.personTwoName);
        setStartDate(page.startDate ? page.startDate.slice(0, 10) : '');
        setMainText(page.mainText ?? '');
        setPrivacy(page.privacy as 'public' | 'private');
        setTemplateId(page.templateId ?? '');
        setAssets(page.assets ?? []);
      })
      .catch(() => setError('Não foi possível carregar a página.'))
      .finally(() => setLoading(false));
  }, [pageId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isNew || slug) return;
    const generated = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
    setSlug(generated);
  }, [title]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { available } = await api.slugs.check(slug);
        setSlugStatus(available ? 'available' : 'taken');
        trackEvent(available ? 'publish_slug_available' : 'publish_slug_unavailable');
      } catch { setSlugStatus('idle'); }
    }, 600);
    return () => clearTimeout(t);
  }, [slug]);

  async function handleSave() {
    setSaving(true);
    setError('');
    trackEvent('editor_save');
    try {
      const data = {
        title: title.trim(),
        slug: slug.trim(),
        personOneName: personOne.trim(),
        personTwoName: personTwo.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        mainText,
        privacy,
        templateId: templateId || undefined,
      };

      let saved: CouplePage;
      if (pageId) {
        saved = await api.pages.update(pageId, data);
      } else {
        saved = await api.pages.create(data);
        navigate(`/editor/${saved.id}`, { replace: true });
      }
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
      await api.pages.validatePublish(pageId);
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
      const asset = await api.uploads.upload(pageId, file, 'photo', position);
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

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <span className="spinner spinner--dark" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Top bar ───────────────────────── */}
      <header className={styles.topBar}>
        <Link to="/minhas-paginas" className={styles.backBtn}>← Minhas páginas</Link>
        <span className={styles.topTitle}>{title || 'Nova página'}</span>
        <div className={styles.topActions}>
          {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
          <button className={`btn btn--ghost-dark`} style={{ minHeight: 40, padding: '10px 18px', fontSize: 14 }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner spinner--dark" /> : 'Salvar'}
          </button>
          <button className="btn btn--primary" style={{ minHeight: 40, padding: '10px 22px', fontSize: 14 }} onClick={handlePublish} disabled={publishing}>
            {publishing ? <span className="spinner" /> : 'Publicar →'}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── Form panel ─────────────────── */}
        <div className={styles.formPanel}>
          {error && <div className={styles.errBanner}>{error} <button onClick={() => setError('')}>×</button></div>}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>O casal</h2>
            <div className={styles.grid2}>
              <div className="field">
                <label className="label">Nome da pessoa 1</label>
                <input className="input" value={personOne} onChange={(e) => setPersonOne(e.target.value)} placeholder="Ana" />
              </div>
              <div className="field">
                <label className="label">Nome da pessoa 2</label>
                <input className="input" value={personTwo} onChange={(e) => setPersonTwo(e.target.value)} placeholder="Bruno" />
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="label">Título da página</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ana & Bruno" />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>A data especial</h2>
            <div className="field">
              <label className="label">Data do primeiro beijo / início do relacionamento</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); trackEvent('start_date_selected'); }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <PreviewCounter startDate={startDate ? new Date(startDate).toISOString() : null} />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>O endereço da página</h2>
            <div className="field">
              <label className="label">contigo.page/p/<strong>{slug || 'seu-casal'}</strong></label>
              <input
                className={`input ${slugStatus === 'taken' ? 'input--error' : ''}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ana-e-bruno"
                maxLength={60}
              />
              <div className={styles.slugStatus}>
                {slugStatus === 'checking' && <span style={{ color: 'var(--ink-3)' }}>Verificando...</span>}
                {slugStatus === 'available' && <span style={{ color: '#3a9e5f' }}>✓ Disponível</span>}
                {slugStatus === 'taken' && <span style={{ color: '#e03c3c' }}>✗ Já está em uso</span>}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Fotos</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', fontFamily: 'var(--ui)', marginBottom: 16 }}>
              Envie até 4 fotos. A primeira será a foto central; as outras ficam nos Polaroids.
            </p>
            <div className={styles.photoGrid}>
              {[0, 1, 2, 3].map((pos) => {
                const asset = assets.find((a) => a.position === pos);
                return (
                  <label key={pos} className={styles.photoSlot}>
                    {asset ? (
                      <img src={asset.url} alt={asset.alt || `Foto ${pos + 1}`} className={styles.photoImg} />
                    ) : (
                      <div className={styles.photoEmpty}>
                        {uploadingIdx === pos ? <span className="spinner spinner--dark" /> : (
                          <><span className={styles.photoPlus}>+</span><span className={styles.photoLabel}>Foto {pos + 1}</span></>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUpload(e, pos)}
                      disabled={!pageId || uploadingIdx !== null}
                    />
                  </label>
                );
              })}
            </div>
            {!pageId && <p style={{ fontSize: 13, color: 'var(--terra)', fontFamily: 'var(--ui)', marginTop: 10 }}>Salve a página primeiro para enviar fotos.</p>}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Texto principal</h2>
            <div className="field">
              <textarea
                className="input"
                style={{ minHeight: 120, resize: 'vertical' }}
                value={mainText}
                onChange={(e) => { setMainText(e.target.value); trackEvent('story_edited'); }}
                placeholder="Um texto curto sobre vocês..."
                maxLength={600}
              />
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--ui)' }}>{mainText.length}/600</span>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacidade</h2>
            <div className={styles.privacyRow}>
              {(['private', 'public'] as const).map((v) => (
                <label key={v} className={`${styles.privOpt} ${privacy === v ? styles.privActive : ''}`}>
                  <input type="radio" name="privacy" value={v} checked={privacy === v} onChange={() => setPrivacy(v)} style={{ display: 'none' }} />
                  <span className={styles.privIcon}>{v === 'private' ? '🔒' : '🌐'}</span>
                  <span className={styles.privLabel}>{v === 'private' ? 'Privado (só quem tem o link)' : 'Público'}</span>
                </label>
              ))}
            </div>
          </section>

          <div className={styles.bottomActions}>
            <button className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePublish} disabled={publishing}>
              {publishing ? <span className="spinner" /> : 'Publicar e escolher plano →'}
            </button>
          </div>
        </div>

        {/* ── Preview panel ────────────────── */}
        <div className={styles.previewPanel}>
          <div className={styles.previewLabel}>Prévia</div>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <h2 className={styles.previewTitle}>{title || 'Ana & Bruno'}</h2>
              <p className={styles.previewSub}>{personOne || 'Pessoa 1'} & {personTwo || 'Pessoa 2'}</p>
            </div>
            <PreviewCounter startDate={startDate ? new Date(startDate).toISOString() : null} />
            {mainText && <p className={styles.previewText}>{mainText}</p>}
            {assets[0] && (
              <div className={styles.previewPhotos}>
                <div className="polaroid" style={{ transform: 'rotate(-3deg)' }}>
                  <img src={assets[0].url} alt="" style={{ width: 160, height: 200, objectFit: 'cover' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
