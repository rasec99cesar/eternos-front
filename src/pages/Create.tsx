import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import styles from './Create.module.css';

type TemplateKey = 'namoro' | 'casamento' | 'viagem';
type ThemeKey = 'rose' | 'bordo' | 'terracota' | 'lavanda' | 'champagne' | 'marinho' | 'oceano' | 'sage';

const TEMPLATES: Array<{
  key: TemplateKey;
  name: string;
  desc: string;
  color: ThemeKey;
  dots: string[];
  image: string;
  alt: string;
}> = [
  {
    key: 'namoro',
    name: 'Namoro',
    desc: 'Romântico, moderno e acolhedor. Para quem está construindo a história agora.',
    color: 'rose',
    dots: ['#BC4257', '#A85077', '#C4614A'],
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=640&h=480&fit=crop&q=80',
    alt: 'casal abraçado ao entardecer',
  },
  {
    key: 'casamento',
    name: 'Casamento',
    desc: 'Elegante, sofisticado e atemporal. Para celebrar o sim e tudo que vem depois.',
    color: 'bordo',
    dots: ['#A6293A', '#A6802F', '#3A5687'],
    image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=640&h=480&fit=crop&q=80',
    alt: 'casal de noivos',
  },
  {
    key: 'viagem',
    name: 'Viagem',
    desc: 'Leve, aventureiro e memorável. Para os quilômetros e os lugares que viraram nosso.',
    color: 'terracota',
    dots: ['#C4614A', '#1F8079', '#5F7D3E'],
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=640&h=480&fit=crop&q=80',
    alt: 'casal viajando de barco entre montanhas',
  },
];

function slugBase(template: TemplateKey) {
  return `nossa-historia-${template}-${Date.now().toString(36).slice(-6)}`;
}

export default function CreatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TemplateKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('create_page_start');
    const plan = params.get('plan');
    if (plan === 'sempre' || plan === 'eterno') sessionStorage.setItem('selected_plan', plan);
  }, [params]);

  async function continueToPlans() {
    if (!selected) return;
    const tpl = TEMPLATES.find((t) => t.key === selected)!;
    setLoading(true);
    setError('');
    trackEvent('template_select');
    try {
      const page = await api.pages.create({
        title: 'Nossa história',
        slug: slugBase(tpl.key),
        personOneName: 'Nome 1',
        personTwoName: 'Nome 2',
        startDate: new Date().toISOString(),
        mainText: '',
        storyJson: JSON.stringify({
          eyebrow: 'A nossa história',
          sinceText: '',
          storyHeadEyebrow: 'Como chegamos aqui',
          storyHeadTitle: 'A história de nós dois.',
          blocks: [
            { date: '', title: '', text: '' },
            { date: '', title: '', text: '' },
          ],
          closeLine: '',
          closeSign: '',
        }),
        themeConfigJson: JSON.stringify({ theme: tpl.color, template: tpl.key }),
        privacy: 'public',
      });
      sessionStorage.setItem('checkout_page_id', page.id);
      sessionStorage.setItem('selected_template', tpl.key);
      navigate(`/planos/${page.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o rascunho.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.brand}>Somos Eternos</Link>
        <span className={styles.secure}>Criação segura</span>
      </header>

      <main className={styles.stage}>
        <ol className={styles.steps}>
          <li className={styles.done}><span>✓</span>Entrar</li>
          <i />
          <li className={styles.on}><span>2</span>Template</li>
          <i />
          <li><span>3</span>Plano</li>
          <i />
          <li><span>4</span>Criar</li>
        </ol>

        <div className={styles.head}>
          <span className="eyebrow eyebrow--center">Por onde começar</span>
          <h1>Escolha o template<br />da história de vocês.</h1>
          <p>Cada template traz um clima e um conjunto de cores pensados para o momento. Você ajusta as cores e tudo mais no editor depois do pagamento.</p>
        </div>

        <div className={styles.tplGrid}>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              className={`${styles.tplCard} ${selected === tpl.key ? styles.tplOn : ''}`}
              onClick={() => setSelected(tpl.key)}
            >
              <span className={styles.tplThumb}>
                <span className={styles.tag}>{tpl.name}</span>
                <span className={styles.pick}>✓</span>
                <img src={tpl.image} alt={tpl.alt} />
              </span>
              <span className={styles.tplBody}>
                <strong>{tpl.name}</strong>
                <span>{tpl.desc}</span>
                <span className={styles.tplColors}>
                  <span>Cores</span>
                  <span className={styles.dots}>{tpl.dots.map((d) => <i key={d} style={{ background: d }} />)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        {error && <div className={styles.err}>{error}</div>}

        <div className={styles.foot}>
          <button className="btn btn--primary btn--lg" type="button" onClick={continueToPlans} disabled={!selected || loading}>
            {loading ? <span className="spinner" /> : selected ? `Continuar com ${TEMPLATES.find((t) => t.key === selected)?.name} →` : 'Selecione um template →'}
          </button>
          <span>Você poderá trocar template e cor no editor depois da confirmação do pagamento.</span>
        </div>
      </main>
    </div>
  );
}
