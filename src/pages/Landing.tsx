import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';
import { useCounter, pad } from '../hooks/useCounter';
import { trackEvent } from '../utils/analytics';
import styles from './Landing.module.css';

// Demo start date — 15 sep 2018 at 21:30
const DEMO_START = new Date('2018-09-15T21:30:00');

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
  const [showSticky, setShowSticky] = useState(false);
  const [proofCount, setProofCount] = useState(7432);

  useEffect(() => {
    trackEvent('landing_view');

    // Proof counter bump
    const id = setInterval(() => {
      setProofCount((n) => n + (Math.random() < 0.6 ? 1 : 0));
    }, 4200);

    // Reveal observer
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Sticky CTA
    const heroEl = document.querySelector('#hero-section');
    const onScroll = () => {
      const heroBottom = heroEl ? (heroEl as HTMLElement).offsetTop + (heroEl as HTMLElement).offsetHeight : 600;
      setShowSticky(window.scrollY > heroBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => { clearInterval(id); observer.disconnect(); window.removeEventListener('scroll', onScroll); };
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
                  to="/entrar"
                  className="btn btn--primary btn--lg"
                  onClick={() => trackEvent('hero_cta_click')}
                >
                  Criar a nossa página <span className="arrow">→</span>
                </Link>
                <a
                  href="#contador"
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
            <Link to="/entrar" className="btn btn--primary btn--lg" onClick={() => trackEvent('secondary_cta_click')}>
              Quero um counter assim para nós <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STORYTELLING ───────────────────────────────────────────── */}
      <section className={`section prose-sec`} id="como">
        <div className="wrap">
          <div className={`${styles.storyCols} reveal`}>
            <div>
              <span className="eyebrow">O problema</span>
              <p className={`${styles.pull} reveal`}>Você guarda as fotos mais importantes da sua vida no mesmo lugar onde guarda screenshot de lista de supermercado.</p>
            </div>
            <div>
              <p style={{ fontSize: 'clamp(17px,1.9vw,20px)', color: 'var(--ink-2)', lineHeight: 1.7 }} className="reveal">
                Tem uma foto no seu celular. Você sabe qual é. Aquela do começo — quando tudo era novidade e vocês tinham tempo pra tudo.
              </p>
              <p style={{ fontSize: 'clamp(17px,1.9vw,20px)', color: 'var(--ink-2)', lineHeight: 1.7 }} className="reveal">
                Ela está no rolo da câmera, entre uma foto de recibo e um print de conversa que você nem lembra por quê salvou. <strong style={{ color: 'var(--ink)' }}>Ela está perdida.</strong>
              </p>
              <p className={`${styles.accentLine} reveal`}>"E com ela, um pouco da história de vocês."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO / POLAROIDS ────────────────────────────────────────── */}
      <section className={`section ${styles.tableSec}`} id="exemplos">
        <div className="wrap">
          <div className="center reveal">
            <span className="eyebrow eyebrow--center">Como fica</span>
            <h2 className="h2" style={{ marginTop: 20 }}>
              Em 5 minutos, vocês ganham<br /><em>uma casa própria na internet.</em>
            </h2>
          </div>

          <div className={styles.tableScene}>
            <div className={`polaroid ${styles.polyA}`}>
              <img style={{ width: 190, height: 240 }} src="https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=380&h=480&fit=crop&q=80" alt="casal viagem" />
            </div>
            <div className={`polaroid ${styles.polyB}`}>
              <img style={{ width: 200, height: 160 }} src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&h=320&fit=crop&q=80" alt="casal jantar" />
            </div>
            <div className={`polaroid ${styles.polyC}`}>
              <img style={{ width: 180, height: 220 }} src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=360&h=440&fit=crop&q=80" alt="casal mãos" />
            </div>
            <div className={`polaroid ${styles.polyCenter}`}>
              <img style={{ width: 250, height: 300 }} src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&h=600&fit=crop&q=80" alt="casal principal" />
              <div className="cap">a nossa história</div>
            </div>
          </div>

          <div className={styles.demoFeature}>
            {[
              { n: '∞', title: 'Contador ao vivo', desc: 'Dias, horas, minutos e segundos — contando agora mesmo.' },
              { n: '3+', title: 'Fotos Polaroid', desc: 'Layout editorial com fotos inclinadas como num álbum físico.' },
              { n: '♥', title: 'Link exclusivo', desc: 'Um endereço só de vocês para compartilhar e guardar.' },
              { n: '7', title: 'Garantia de dias', desc: 'Se não valer, a gente devolve sem perguntas.' },
            ].map((f) => (
              <div key={f.title} className={`${styles.feat} reveal`} onClick={() => trackEvent('example_click')}>
                <div className={styles.featN}>{f.n}</div>
                <h4 className={styles.featTitle}>{f.title}</h4>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
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
          <div className="center reveal" onViewportEntry={() => trackEvent('pricing_view')}>
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
              <div className={styles.planName}>Sempre</div>
              <div className={styles.planPrice}><span className={styles.cur}>R$</span><span className={styles.val}>27<span className={styles.dec}>,90</span></span></div>
              <div className={styles.planTag}>pagamento único · acesso imediato</div>
              <p className={styles.planPitch}>"Escolha a frase perfeita — a nossa equipe já escreveu as melhores para você."</p>
              <ul className={styles.planList}>
                <li><span className={styles.ck}>✓</span> Frases escritas com carinho para cada momento</li>
                <li><span className={styles.ck}>✓</span> 3 fotos Polaroid + foto central</li>
                <li><span className={styles.ck}>✓</span> Contador ao vivo e música no Spotify</li>
                <li><span className={styles.ck}>✓</span> Link exclusivo · acesso vitalício · garantia 7 dias</li>
              </ul>
              <Link to="/entrar?plan=sempre" className="btn btn--ghost btn--lg" onClick={() => trackEvent('pricing_cta_click')}>
                Criar com frases prontas <span className="arrow">→</span>
              </Link>
            </div>

            <div className={`${styles.planCard} ${styles.planFeat}`}>
              <span className={styles.planBadge}>♥ Mais escolhido</span>
              <div className={styles.planName}>Eterno</div>
              <div className={styles.planPrice}><span className={styles.cur}>R$</span><span className={styles.val}>37<span className={styles.dec}>,90</span></span></div>
              <div className={styles.planTag}>pagamento único · acesso imediato</div>
              <p className={styles.planPitch}>"Cada palavra escrita por você — porque só você sabe como foi o começo de vocês."</p>
              <ul className={styles.planList}>
                <li><span className={styles.ck}>✓</span> <strong>Escreva cada título e texto com as suas palavras</strong></li>
                <li><span className={styles.ck}>✓</span> 3 fotos Polaroid + foto central</li>
                <li><span className={styles.ck}>✓</span> Contador ao vivo e música no Spotify</li>
                <li><span className={styles.ck}>✓</span> Link exclusivo · acesso vitalício · garantia 7 dias</li>
              </ul>
              <Link to="/entrar?plan=eterno" className="btn btn--primary btn--lg" onClick={() => trackEvent('pricing_cta_click')}>
                Escrever com minhas palavras <span className="arrow">→</span>
              </Link>
            </div>
          </div>

          <div className={`${styles.anchor} reveal`}>
            <div className={styles.anchorItem}><div className={styles.anchorBig}>Flores · R$ 30</div><div className={styles.anchorSm}>duram 3 dias</div></div>
            <div className={styles.anchorItem}><div className={styles.anchorBig}>Jantar · R$ 150</div><div className={styles.anchorSm}>dura 2 horas</div></div>
            <div className={styles.anchorItem}><div className={styles.anchorBig} style={{ color: 'var(--terra-light)' }}>Sempre · a partir de R$ 27,90</div><div className={styles.anchorSm}>dura para sempre</div></div>
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
            <FaqItem q="Posso editar depois?" a="Sim, quantas vezes quiser. Trocou a foto favorita? Quer adicionar um novo texto? Sem custo, sem limite." />
            <FaqItem q="E se eu quiser dar de presente?" a="Na confirmação de compra você recebe um link de acesso. Pode encaminhar pra quem quiser que a pessoa configura a própria página." />
            <FaqItem q="O link é público?" a="Você decide. Pode ser privado (só quem tem o link acessa) ou público. A escolha é sua." />
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
            <Link to="/entrar" className="btn btn--dark btn--lg" onClick={() => trackEvent('hero_cta_click')}>
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
          <Link to="/entrar" className="btn btn--primary" onClick={() => trackEvent('hero_cta_click')}>Começar →</Link>
        </div>
      </div>
    </div>
  );
}
