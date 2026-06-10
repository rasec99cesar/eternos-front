import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';
import { useCounter, pad } from '../hooks/useCounter';
import { trackEvent } from '../utils/analytics';
import styles from './Landing.module.css';

// Demo start date — 15 sep 2018 at 21:30
const DEMO_START = new Date('2018-09-15T21:30:00');
const THEME_STORAGE_KEY = 'sempre-theme';
type LandingTheme = 'rose' | 'bordo' | 'terracota' | 'lavanda';
const LANDING_PALETTES: Array<{ key: LandingTheme; name: string; chips: string[] }> = [
  { key: 'rose', name: 'Rose', chips: ['#FFF7F5', '#E8A0A7', '#BC4257'] },
  { key: 'bordo', name: 'Bordo', chips: ['#FAF4EF', '#B07C6C', '#A6293A'] },
  { key: 'terracota', name: 'Terracota', chips: ['#FAF7F2', '#D19A85', '#C4614A'] },
  { key: 'lavanda', name: 'Lavanda', chips: ['#F8F4F7', '#B284A8', '#A85077'] },
];
const isLandingTheme = (value: string | null): value is LandingTheme =>
  value === 'rose' || value === 'bordo' || value === 'terracota' || value === 'lavanda';

function BigCounter() {
  const { days, hours, mins, secs } = useCounter(DEMO_START);
  return (
    <div className={styles.bigcount}>
      <div className={styles.unit}>
        <span className={styles.num}>{days.toLocaleString('pt-BR')}</span>
        <div className={styles.lab}>dias</div>
      </div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}>
        <span className={styles.num}>{pad(hours)}</span>
        <div className={styles.lab}>horas</div>
      </div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}>
        <span className={styles.num}>{pad(mins)}</span>
        <div className={styles.lab}>min</div>
      </div>
      <span className={styles.sep}>:</span>
      <div className={styles.unit}>
        <span className={styles.num}>{pad(secs)}</span>
        <div className={styles.lab}>seg</div>
      </div>
    </div>
  );
}

function MiniCounter() {
  const { days, hours, mins } = useCounter(DEMO_START);
  return (
    <div className={styles.miniCounter}>
      <div className={styles.miniUnit}><div className={styles.miniNum}>{days.toLocaleString('pt-BR')}</div><div className={styles.miniLab}>dias</div></div>
      <div className={styles.miniUnit}><div className={styles.miniNum}>{pad(hours)}</div><div className={styles.miniLab}>horas</div></div>
      <div className={styles.miniUnit}><div className={styles.miniNum}>{pad(mins)}</div><div className={styles.miniLab}>min</div></div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
      <button
        className={styles.faqQ}
        onClick={() => {
          setOpen(!open);
          if (!open) trackEvent('faq_open');
        }}
      >
        {q}
        <span className={styles.pm}>{open ? '−' : '+'}</span>
      </button>
      <div className={styles.faqA} style={{ maxHeight: open ? 300 : 0 }}>
        <div className={styles.faqAIn}>{a}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [proofCount, setProofCount] = useState(7432);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [landingTheme, setLandingTheme] = useState<LandingTheme>('rose');

  const applyLandingTheme = (theme: LandingTheme) => {
    setLandingTheme(theme);
    if (theme === 'rose') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = theme;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyLandingTheme(isLandingTheme(savedTheme) ? savedTheme : 'rose');
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!paletteRef.current?.contains(event.target as Node)) {
        setPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [paletteOpen]);

  useEffect(() => {
    trackEvent('landing_view');

    // Proof counter increment
    const id = setInterval(() => {
      setProofCount((n) => n + (Math.random() < 0.6 ? 1 : 0));
    }, 4200);

    // Reveal observer
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    const pricingObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          trackEvent('pricing_view');
          pricingObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    if (pricingRef.current) pricingObserver.observe(pricingRef.current);

    // Sticky CTA
    const heroEl = document.querySelector('#hero-section');
    const onScroll = () => {
      const heroBottom = heroEl ? (heroEl as HTMLElement).offsetTop + (heroEl as HTMLElement).offsetHeight : 600;
      setShowSticky(window.scrollY > heroBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearInterval(id);
      observer.disconnect();
      pricingObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div ref={pageRef}>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className={styles.hero} id="hero-section">
        <div className="wrap">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className="eyebrow">Dia dos Namorados · 12 de junho</span>
              <h1 className={`display ${styles.heroDisplay}`}>
                Quantos dias vocês<br />já estão <em className="terra">juntos?</em>
              </h1>
              <p className={`lede ${styles.heroSub}`}>
                Você provavelmente não sabe o número exato. Mas cada um desses dias aconteceu de verdade — e merecia ter sido guardado.
              </p>
              <div className={styles.heroCtaRow}>
                <Link
                  to="/criar"
                  className="btn btn--primary btn--lg"
                  onClick={() => trackEvent('hero_cta_click')}
                >
                  Criar a nossa página <span className="arrow">→</span>
                </Link>
                <a
                  href="#exemplos"
                  className="btn-text"
                  onClick={() => trackEvent('secondary_cta_click')}
                >
                  <span className="dot">▸</span> Ver como fica antes de comprar
                </a>
              </div>
              <div className={styles.heroProof}>
                <div className={styles.avatars}>
                  {['1500648767791-00dcc994a43e','1494790108377-be9c29b29330','1507003211169-0a1dd7228f2d','1573497019940-1c28c88b4f3e'].map((id) => (
                    <span key={id} className={styles.av} style={{ backgroundImage: `url(https://images.unsplash.com/photo-${id}?w=80&h=80&fit=facearea&facepad=3&q=70)` }} />
                  ))}
                </div>
                <span className="micro">
                  <strong style={{ color: 'var(--ink)' }}>{proofCount.toLocaleString('pt-BR')}</strong> casais já criaram a página deles nesse Dia dos Namorados.
                </span>
              </div>
            </div>

            {/* Collage */}
            <div className={styles.collage}>
              <div className={`polaroid ${styles.polyMain}`}>
                <img style={{ width: 230, height: 270 }} src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=460&h=540&fit=crop&q=80" alt="casal abraçado" />
                <div className="cap">o nosso começo</div>
              </div>
              <div className={`polaroid ${styles.poly2}`}>
                <img style={{ width: 150, height: 185 }} src="https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&h=370&fit=crop&q=80" alt="casal ao pôr do sol" />
              </div>
              <div className={`polaroid ${styles.poly3}`}>
                <img style={{ width: 160, height: 130 }} src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=320&h=260&fit=crop&q=80" alt="mãos formando coração" />
              </div>
              <div className={styles.counterChip}>
                <div className={styles.chipLabel}><span className="pulse-dot" />juntos há</div>
                <MiniCounter />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COUNTER (dark section) ─────────────────────────────────── */}
      <section className={styles.counterSec} id="contador">
        <div className="wrap center">
          <span className="eyebrow eyebrow--center eyebrow--light reveal">A grande ideia</span>
          <p className={`${styles.counterQuote} reveal`}>
            O amor não se conta em anos.<br />Conta em <em className="terra">segundos.</em>
          </p>
          <div className="reveal">
            <BigCounter />
          </div>
          <p className={styles.counterSince}>desde 15 de setembro de 2018 · o primeiro beijo</p>
          <div className={`${styles.counterCta} reveal`}>
            <Link to="/criar" className="btn btn--primary btn--lg" onClick={() => trackEvent('secondary_cta_click')}>
              Quero um counter assim para nós <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── A IDEIA / table-sec ─────────────────────────────────────── */}
      <section className={`section ${styles.tableSec}`} id="como">
        <div className="wrap">
          <div className="measure reveal">
            <span className="eyebrow">A ideia</span>
            <h2 className="h2" style={{ margin: '24px 0 18px' }}>
              Tem uma foto no celular de vocês que nunca foi deletada. Ela merece mais do que o rolo da câmera.
            </h2>
            <p className="lede">
              Redes sociais somem, algoritmos enterram, contas são desativadas — e nada que você posta é seu de verdade. O <em className="terra">Somos Eternos</em> é a página exclusiva do relacionamento de vocês: um lugar permanente, com endereço próprio e um contador que não para nunca. Pronto em 5 minutos.
            </p>
          </div>

          <div className={styles.tableScene}>
            <div className={`polaroid ${styles.polyA} reveal`}>
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=380&h=320&fit=crop&q=80" alt="casal com balões" />
              <div className="cap">tudo era novidade</div>
            </div>
            <div className={`polaroid ${styles.polyB} reveal`}>
              <img src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=340&h=400&fit=crop&q=80" alt="mãos com alianças" />
              <div className="cap">a viagem</div>
            </div>
            <div className={`polaroid ${styles.polyC} reveal`}>
              <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop&q=80" alt="mãos segurando coração" />
              <div className="cap">hoje</div>
            </div>
            <div className={`polaroid ${styles.polyCenter} reveal`}>
              <img src="https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=600&h=660&fit=crop&q=80" alt="casal ao pôr do sol" />
              <div className="cap">a nossa favorita</div>
            </div>
          </div>

          <div className={styles.demoFeature}>
            {[
              { n: '01', title: 'Fotos especiais', desc: 'Espalhadas como se estivessem em cima de uma mesa.' },
              { n: '02', title: 'Uma foto central', desc: 'A favorita de vocês, no centro de tudo.' },
              { n: '03', title: 'A história de vocês', desc: 'Fotos e texto. Você escreve o que quiser.' },
              { n: '04', title: 'Contador em tempo real', desc: 'Agora mesmo, enquanto você lê isso, ele já está rodando.' },
            ].map((f) => (
              <div key={f.title} className={`${styles.feat} reveal`}>
                <div className={styles.featN}>{f.n}</div>
                <h4 className={styles.featTitle}>{f.title}</h4>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXEMPLOS REAIS ──────────────────────────────────────────── */}
      <section className="section" id="exemplos">
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow">Exemplos reais</span>
            <h2 className="h2" style={{ margin: '22px 0 16px' }}>
              Não é só pra namoro. É pra <em className="terra">toda história que merece durar.</em>
            </h2>
            <p className="lede" style={{ maxWidth: '54ch' }}>
              Cada momento pede um tom. Veja três páginas de verdade — clique e sinta o contador correndo em cada uma delas.
            </p>
          </div>
          <div className={styles.examplesGrid}>
            {[
              {
                href: '/exemplos/casamento',
                terra: '#A6293A',
                tint: '#FAF4EF',
                tag: 'Casamento',
                chips: ['#FAF4EF', '#B07C6C', '#A6293A'],
                img: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=640&h=480&fit=crop&q=80',
                imgAlt: 'casal de noivos abraçados',
                mini: 'Casados há 1 ano · tema Bordô',
                h3: 'Marina & Thiago',
                p: 'Do "sim" diante de todo mundo ao "pra sempre" que só os dois entendem. Um ano depois, o contador continua marcando cada segundo de vida a dois.',
                link: 'Abrir a página deles →',
              },
              {
                href: '/exemplos/viagem',
                terra: '#C4614A',
                tint: '#FAF7F2',
                tag: 'Viagem',
                chips: ['#FAF7F2', '#8B6B4A', '#C4614A'],
                img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=640&h=480&fit=crop&q=80',
                imgAlt: 'casal de barco em lago entre montanhas',
                mini: '30 dias de estrada · tema Terracota',
                h3: 'Bea & Léo',
                p: 'Dois mochilões, mil quilômetros e a certeza de que casa é onde um está com o outro. A viagem acabou — a memória dela nunca para.',
                link: 'Abrir a página deles →',
              },
              {
                href: '/exemplos/pedido',
                terra: '#A85077',
                tint: '#F8F4F7',
                tag: 'Pedido de namoro',
                chips: ['#F8F4F7', '#B284A8', '#A85077'],
                img: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=640&h=480&fit=crop&q=80',
                imgAlt: 'casal ao pôr do sol no momento do pedido',
                mini: 'Juntos há 3 meses · tema Lavanda',
                h3: 'Júlia & Pedro',
                p: 'O joelho no chão, a voz tremendo e um "sim" que ecoou no pôr do sol. Foi ali que o contador começou — e ele não parou mais.',
                link: 'Abrir a página deles →',
              },
            ].map((card) => (
              <Link
                key={card.href}
                to={card.href}
                className={`${styles.exCard} reveal`}
                style={{ '--terra': card.terra, '--tint': card.tint } as React.CSSProperties}
                onClick={() => trackEvent('example_click')}
              >
                <div className={styles.exCardImg}>
                  <span className={styles.exCardTag}>{card.tag}</span>
                  <span className={styles.exCardChip}>
                    {card.chips.map((c) => <i key={c} style={{ background: c }} />)}
                  </span>
                  <img src={card.img} alt={card.imgAlt} />
                </div>
                <div className={styles.exCardBody}>
                  <div className={styles.exCardMini}><span className={styles.live} />{ card.mini}</div>
                  <h3>{card.h3}</h3>
                  <p>{card.p}</p>
                  <span className={styles.exCardLink}>{card.link}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="center reveal">
            <span className="eyebrow eyebrow--center">Quem já criou</span>
            <h2 className="h2" style={{ marginTop: 20 }}>A reação é sempre a mesma:<br />um silêncio, e depois lágrimas.</h2>
          </div>
          <div className={styles.testGrid}>
            {[
              {
                q: 'Rafael M., 31 anos · São Paulo',
                t: '"Criei escondido e mandei o link às 00h do Dia dos Namorados. Ela ficou vendo o contador por uns 10 minutos em silêncio. Depois me ligou chorando."',
                img: 'photo-1500648767791-00dcc994a43e',
              },
              {
                q: 'Camila R., 34 anos · Belo Horizonte',
                t: '"A gente tá junto há 8 anos. Coloquei a data do primeiro encontro e quando vi 2.912 dias na tela travei. Nunca tinha pensado assim."',
                img: 'photo-1494790108377-be9c29b29330',
              },
              {
                q: 'Lucas F., 27 anos · Curitiba',
                t: '"Comprei como teste. Ela colocou no link da bio e já abrimos juntos umas 30 vezes. Valeu muito mais do que imaginava."',
                img: 'photo-1547425260-76bcadfb4f2c',
              },
            ].map((t) => (
              <div key={t.q} className={`${styles.test} reveal`}>
                <div className="stars">★★★★★</div>
                <blockquote className={styles.quote}>{t.t}</blockquote>
                <div className={styles.who}>
                  <span className={styles.av} style={{ backgroundImage: `url(https://images.unsplash.com/${t.img}?w=120&h=120&fit=facearea&facepad=3&q=75)` }} />
                  <span className={styles.whoName}>{t.q}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────── */}
      <section className="section" id="beneficios">
        <div className="wrap">
          <div className="measure reveal">
            <span className="eyebrow">Por que importa</span>
            <h2 className="h2" style={{ marginTop: 22 }}>Um presente que você dá uma vez<br />e recebe de volta todos os dias.</h2>
          </div>
          <div className={styles.benGrid}>
            {[
              { idx: 'PRA QUEM DÁ DE PRESENTE', title: 'Não chegar de mãos vazias', body: 'Algo que a pessoa abre no trabalho, manda pro grupo da família, coloca no link da bio, e guarda pra sempre.' },
              { idx: 'PRA QUEM CRIA PRA SI', title: 'Um lugar pro que importa', body: 'Você finalmente tem onde guardar o que importa. Organizado, bonito, fácil de achar.' },
              { idx: 'PRO RELACIONAMENTO', title: 'Vocês construíram algo real', body: 'Um lembrete de que merece ser celebrado — não só hoje, mas em qualquer dia de semana.' },
              { idx: 'PRO FUTURO', title: 'Vai existir daqui a anos', body: 'O contador vai mostrar um número muito maior. E vocês vão lembrar de quando criaram isso — juntos.' },
            ].map((b) => (
              <div key={b.idx} className={`${styles.ben} reveal`}>
                <div className={styles.benIdx}>{b.idx}</div>
                <h3 className={styles.benTitle}>{b.title}</h3>
                <p className={styles.benBody}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFER ───────────────────────────────────────────────────── */}
      <section className={styles.offerSec} id="oferta">
        <div className="wrap">
          <div ref={pricingRef} className="center reveal">
            <span className="eyebrow eyebrow--light eyebrow--center">A oferta</span>
            <h2 className="h2" style={{ color: '#fff', margin: '22px 0 16px' }}>
              Dois jeitos de contar<br />a mesma história.
            </h2>
            <p className="lede" style={{ color: 'rgba(255,255,255,.72)', margin: '0 auto', maxWidth: '54ch' }}>
              A página final é idêntica nos dois. O que muda é como vocês escrevem o que sentem — entre frases prontas, ou com as suas próprias palavras.
            </p>
          </div>

          <div className={`${styles.plansGrid} reveal`}>
            <div className={styles.planCard}>
              <div className={styles.planName}>Somos Eternos</div>
              <div className={styles.planPrice}><span className={styles.cur}>R$</span><span className={styles.val}>27<span className={styles.dec}>,90</span></span></div>
              <div className={styles.planTag}>cobrança anual · acesso imediato</div>
              <p className={styles.planPitch}>"Escolha a frase perfeita — a nossa equipe já escreveu as melhores para você."</p>
              <ul className={styles.planList}>
                <li><span className={styles.ck}>✓</span> Frases escritas com carinho para cada momento</li>
                <li><span className={styles.ck}>✓</span> 3 fotos especiais + foto central</li>
                <li><span className={styles.ck}>✓</span> Contador ao vivo e música no Spotify</li>
                <li><span className={styles.ck}>✓</span> Link exclusivo · 12 meses inclusos · garantia 7 dias</li>
              </ul>
              <Link to="/entrar?plan=sempre" className="btn btn--ghost btn--lg" onClick={() => trackEvent('pricing_cta_click')}>
                Criar com frases prontas <span className="arrow">→</span>
              </Link>
            </div>

            <div className={`${styles.planCard} ${styles.planFeat}`}>
              <span className={styles.planBadge}>♥ Mais escolhido</span>
              <div className={styles.planName}>Eterno</div>
              <div className={styles.planPrice}><span className={styles.cur}>R$</span><span className={styles.val}>37<span className={styles.dec}>,90</span></span></div>
              <div className={styles.planTag}>cobrança anual · acesso imediato</div>
              <p className={styles.planPitch}>"Cada palavra escrita por você — porque só você sabe como foi o começo de vocês."</p>
              <ul className={styles.planList}>
                <li><span className={styles.ck}>✓</span> <strong>Escreva cada título e texto com as suas palavras</strong></li>
                <li><span className={styles.ck}>✓</span> 3 fotos especiais + foto central</li>
                <li><span className={styles.ck}>✓</span> Contador ao vivo e música no Spotify</li>
                <li><span className={styles.ck}>✓</span> Link exclusivo · 12 meses inclusos · garantia 7 dias</li>
              </ul>
              <Link to="/entrar?plan=eterno" className="btn btn--primary btn--lg" onClick={() => trackEvent('pricing_cta_click')}>
                Escrever com minhas palavras <span className="arrow">→</span>
              </Link>
            </div>
          </div>

          <div className={`${styles.anchor} reveal`}>
            <div className={styles.anchorItem}><div className={styles.anchorBig}>Flores · R$ 30</div><div className={styles.anchorSm}>duram 3 dias</div></div>
            <div className={styles.anchorItem}><div className={styles.anchorBig}>Jantar · R$ 150</div><div className={styles.anchorSm}>dura 2 horas</div></div>
            <div className={styles.anchorItem}><div className={styles.anchorBig} style={{ color: 'var(--terra-light)' }}>Somos Eternos · a partir de R$ 27,90</div><div className={styles.anchorSm}>dura para sempre</div></div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="section" id="faq">
        <div className="wrap">
          <div className="center reveal">
            <span className="eyebrow eyebrow--center">Ainda em dúvida?</span>
            <h2 className="h2" style={{ marginTop: 20 }}>As perguntas que todo mundo faz</h2>
          </div>
          <div className={styles.faqList}>
            <FaqItem q="Precisa instalar alguma coisa?" a="Não. Funciona pelo navegador, em qualquer celular ou computador. Você entra só com o seu e-mail e um código de verificação — sem senha e sem rede social." />
            <FaqItem q="Quanto tempo leva pra criar?" a="5 minutos no máximo. Você sobe as fotos, escreve os textos, escolhe a data do contador — feito." />
            <FaqItem q="Minha página some depois de um tempo?" a="Não. A página fica no ar enquanto o plano estiver ativo. Para quem compra agora, garantimos 12 meses sem custo adicional." />
            <FaqItem q="Posso editar depois de publicar?" a="Não. Depois da publicação, a página fica protegida para garantir que o presente seja uma surpresa. Antes de publicar, você pode editar quantas vezes quiser. Se precisar retirar a página do ar, use a opção 'Ocultar' na sua área de páginas." />          
            <FaqItem q="O link é público?" a="Sim, poderá ser compartilhada por você com quem quiser. Após a publicação, qualquer pessoa que tiver o link poderá acessar e visualizar a página." />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section className={styles.finalSec}>
        <div className="wrap">
          <div className={`${styles.finalLines} reveal`}>
            <p>Hoje é Dia dos Namorados.</p>
            <p className={styles.soft}>Amanhã vai ser um dia comum.</p>
            <p>E daqui a um ano, você vai querer ter feito isso.</p>
          </div>
          <h2 className={`display ${styles.finalHead} reveal`}>
            Dê a ele um lugar<br />pra existir <em className="terra">para sempre.</em>
          </h2>
          <p className="lede measure-sm mx-auto reveal">
            Você leu até aqui porque sabe que esse relacionamento merece mais do que uma mensagem no WhatsApp.
          </p>
          <div className={`${styles.finalCta} reveal`}>
            <Link to="/criar" className="btn btn--dark btn--lg" onClick={() => trackEvent('hero_cta_click')}>
              Eternize este momento <span className="arrow">→</span>
            </Link>
            <p className="micro" style={{ marginTop: 14 }}>A partir de R$ 27,90 · Acesso imediato · Garantia de 7 dias</p>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── STICKY MOBILE CTA ───────────────────────────────────────── */}
      <div className={`${styles.stickyCta} ${showSticky ? styles.stickyShow : ''}`}>
        <div className={styles.stickyRow}>
          <div className={styles.stickyPrice}>R$ 27,90 <small>a partir de · 2 planos</small></div>
          <Link to="/criar" className="btn btn--primary" onClick={() => trackEvent('hero_cta_click')}>Começar →</Link>
        </div>
      </div>

      <div ref={paletteRef} className={`${styles.palette} ${paletteOpen ? styles.paletteOpen : ''}`}>
        <button
          className={styles.paletteToggle}
          type="button"
          aria-haspopup="true"
          aria-expanded={paletteOpen}
          onClick={() => setPaletteOpen((open) => !open)}
        >
          <span className={styles.heart}>♥</span> Paleta
        </button>
        <div className={styles.paletteMenu} role="menu" aria-label="Escolha o tom de amor">
          <div className={styles.paletteTitle}>Escolha o tom de amor</div>
          {LANDING_PALETTES.map((palette) => (
            <button
              key={palette.key}
              className={styles.swatch}
              type="button"
              role="menuitemradio"
              aria-checked={landingTheme === palette.key}
              onClick={() => {
                applyLandingTheme(palette.key);
                setPaletteOpen(false);
              }}
            >
              <span className={styles.chips} aria-hidden="true">
                {palette.chips.map((chip) => <i key={chip} style={{ background: chip }} />)}
              </span>
              <span className={styles.nm}>{palette.name}</span>
              <span className={styles.check} aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
