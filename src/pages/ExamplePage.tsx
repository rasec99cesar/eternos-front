import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCounter, pad } from '../hooks/useCounter';
import VinylPlayer from '../components/VinylPlayer';
import styles from './ExamplePage.module.css';

/* ── types ──────────────────────────────────────────────────────── */
interface Polaroid {
  src: string;
  alt: string;
  cap: string;
  w: number;
  h: number;
}

interface StoryRow {
  date: string;
  h3: string;
  p: string;
  img: string;
  imgAlt: string;
  flip?: boolean;
}

interface ExampleData {
  theme: string;
  docTitle: string;
  eyebrow: string;
  name1: string;
  name2: string;
  since: string;
  startDate: string;
  counterLabel: string;
  polaroids: Polaroid[];
  storyEyebrow: string;
  storyH2: string;
  story: StoryRow[];
  closeLine: string;
  closeSub: string;
  vinyl?: { trackId: string; song: string; artist: string; };
}

/* ── data ────────────────────────────────────────────────────────── */
const EXAMPLES: Record<string, ExampleData> = {
  casamento: {
    theme: 'bordo',
    docTitle: 'Marina & Thiago — Somos Eternos',
    eyebrow: 'A nossa história',
    name1: 'Marina',
    name2: 'Thiago',
    since: 'Casados desde o nosso sim — 14 de dezembro de 2024. E contando cada segundo de vida a dois.',
    startDate: '2024-12-14T17:00:00',
    counterLabel: 'Juntos há',
    polaroids: [
      { src: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=380&h=320&fit=crop&q=80', alt: 'primeiro beijo de casados', cap: 'o primeiro beijo de casados', w: 190, h: 160 },
      { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=340&h=400&fit=crop&q=80', alt: 'as alianças', cap: 'as alianças', w: 170, h: 200 },
      { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&q=80', alt: 'a saída dos noivos', cap: 'a saída', w: 200, h: 150 },
      { src: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=660&fit=crop&q=80', alt: 'os noivos abraçados', cap: 'a nossa favorita', w: 300, h: 330 },
    ],
    storyEyebrow: 'Como chegamos aqui',
    storyH2: 'De um match sem pretensão\naté o altar.',
    story: [
      {
        date: 'Março de 2019',
        h3: 'Onde tudo começou',
        p: 'Um aplicativo, uma mensagem boba sobre cachorros e uma conversa que varou a madrugada. No terceiro encontro, o Thiago já sabia. A Marina levou mais três meses pra admitir — mas admitiu.',
        img: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=560&h=700&fit=crop&q=80',
        imgAlt: 'o começo do casal',
      },
      {
        date: '14 de dezembro de 2024',
        h3: 'O dia do sim',
        p: 'Cento e vinte pessoas, uma chuva que parou na hora certa e um voto que ninguém conseguiu ler sem chorar. No fim da noite sobraram os sapatos na mão e a certeza de que tinha valido cada detalhe.',
        img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=560&h=700&fit=crop&q=80',
        imgAlt: 'o dia do casamento',
        flip: true,
      },
    ],
    closeLine: 'Cinco anos pra chegar ao altar.\nUma vida inteira pra celebrar.',
    closeSub: '— Marina & Thiago',
    vinyl: { trackId: '0tgVpDi06FyKpA1z0VMD4v', song: 'Perfect', artist: 'Ed Sheeran' },
  },
  viagem: {
    theme: 'terracota',
    docTitle: 'Bea & Léo — Somos Eternos',
    eyebrow: 'A nossa viagem',
    name1: 'Bea',
    name2: 'Léo',
    since: 'Trinta dias, sete cidades e uma mochila cada. Julho de 2025 — a viagem que mudou tudo.',
    startDate: '2025-07-05T08:00:00',
    counterLabel: 'Desde que partimos',
    polaroids: [
      { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=380&h=320&fit=crop&q=80', alt: 'o último pôr do sol da viagem', cap: 'o último pôr do sol', w: 190, h: 160 },
      { src: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=340&h=400&fit=crop&q=80', alt: 'balões no céu da Capadócia', cap: 'o céu da Capadócia', w: 170, h: 200 },
      { src: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop&q=80', alt: 'no topo da montanha', cap: 'o topo', w: 200, h: 150 },
      { src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=660&fit=crop&q=80', alt: 'casal de barco em lago entre montanhas', cap: 'a nossa favorita', w: 300, h: 330 },
    ],
    storyEyebrow: 'O que vivemos lá',
    storyH2: 'A gente foi ver o mundo\ne voltou diferente.',
    story: [
      {
        date: 'Dia 01 · Lisboa',
        h3: 'O voo que quase perdemos',
        p: 'Chegamos no aeroporto com doze minutos de sobra, rindo de nervoso. Foi o primeiro de muitos perrengues que viraram as melhores histórias. A Bea ainda guarda o cartão de embarque amassado na carteira.',
        img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=560&h=700&fit=crop&q=80',
        imgAlt: 'planejando a viagem',
      },
      {
        date: 'Dia 22 · Dolomitas',
        h3: 'O lago que não cabia na foto',
        p: 'Subimos três horas reclamando. No topo, ninguém falou nada por uns bons minutos. Tem coisa que câmera nenhuma alcança — mas a gente tentou, e essa foto é o mais perto que a gente chegou.',
        img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=560&h=700&fit=crop&q=80',
        imgAlt: 'o lago nas montanhas',
        flip: true,
      },
    ],
    closeLine: 'Voltar pra casa foi fácil.\nCasa virou um ao lado do outro.',
    closeSub: '— Bea & Léo',
    vinyl: { trackId: '05QeyKGAn4TZrv41tMiD1A', song: 'Trem-Bala', artist: 'Ana Vilela' },
  },
  pedido: {
    theme: 'lavanda',
    docTitle: 'Júlia & Pedro — Somos Eternos',
    eyebrow: 'O nosso começo',
    name1: 'Júlia',
    name2: 'Pedro',
    since: 'Desde o pedido — 8 de março de 2026, na beira do mar, quando o Pedro esqueceu metade do discurso.',
    startDate: '2026-03-08T18:32:00',
    counterLabel: 'Juntos há',
    polaroids: [
      { src: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=380&h=320&fit=crop&q=80', alt: 'o abraço depois do sim', cap: 'o abraço depois do sim', w: 190, h: 160 },
      { src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=340&h=400&fit=crop&q=80', alt: 'as nossas mãos', cap: 'as nossas mãos', w: 170, h: 200 },
      { src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop&q=80', alt: 'guardado pra sempre', cap: 'guardado pra sempre', w: 200, h: 150 },
      { src: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=600&h=660&fit=crop&q=80', alt: 'o casal ao pôr do sol no pedido', cap: 'a nossa favorita', w: 300, h: 330 },
    ],
    storyEyebrow: 'De onde veio',
    storyH2: 'Três meses que parecem três anos\n— no melhor sentido.',
    story: [
      {
        date: 'O encontro',
        h3: 'Foi numa fila de café',
        p: 'A Júlia pediu um expresso duplo, o Pedro pediu o mesmo só pra puxar assunto. Odeia café preto até hoje. Diz que foi o melhor expresso amargo da vida dele.',
        img: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=560&h=700&fit=crop&q=80',
        imgAlt: 'o encontro do casal',
      },
      {
        date: '8 de março de 2026',
        h3: 'O pedido',
        p: 'Ele planejou tudo: o pôr do sol, a música, as palavras. Na hora, esqueceu metade, gaguejou o resto e deixou a caixinha cair na areia. A Júlia disse sim antes mesmo de ele terminar a pergunta.',
        img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=560&h=700&fit=crop&q=80',
        imgAlt: 'o momento do pedido',
        flip: true,
      },
    ],
    closeLine: 'O melhor "sim" é o que a gente\nainda nem terminou de ouvir.',
    closeSub: '— Júlia & Pedro',
    vinyl: { trackId: '3M7JSIGKxfX2QgTafW3aYi', song: 'A Thousand Years', artist: 'Christina Perri' },
  },
};

/* ── live counter ────────────────────────────────────────────────── */
function LiveCounter({ startDate, label }: { startDate: string; label: string }) {
  const { days, hours, mins, secs } = useCounter(new Date(startDate));
  return (
    <div className={styles.ccount}>
      <div className={styles.ccountLabel}>
        <span className={styles.live} />{label}
      </div>
      <div className={styles.ccountRow}>
        <div className={styles.ccountU}>
          <span className={styles.ccountN}>{days.toLocaleString('pt-BR')}</span>
          <span className={styles.ccountL}>dias</span>
        </div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}>
          <span className={styles.ccountN}>{pad(hours)}</span>
          <span className={styles.ccountL}>horas</span>
        </div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}>
          <span className={styles.ccountN}>{pad(mins)}</span>
          <span className={styles.ccountL}>min</span>
        </div>
        <span className={styles.ccountSep}>:</span>
        <div className={styles.ccountU}>
          <span className={styles.ccountN}>{pad(secs)}</span>
          <span className={styles.ccountL}>seg</span>
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────── */
export default function ExamplePage() {
  const { slug } = useParams<{ slug: string }>();
  const data = slug ? EXAMPLES[slug] : undefined;

  useEffect(() => {
    if (data) {
      document.title = data.docTitle;
      // reveal on scroll
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }),
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }
  }, [data]);

  if (!data) return <Navigate to="/404" replace />;

  const [p1, p2, p3, pCenter] = data.polaroids;

  return (
    <div data-theme={data.theme} className={styles.page}>
      {/* bar */}
      <header className={styles.cbar}>
        <div className={`${styles.cwrap} ${styles.cbarIn}`}>
          <Link to="/" className={styles.cbarBrand}>Somos Eternos</Link>
          <Link to="/entrar" className={styles.cbarBack}>← Criar a minha página</Link>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className={styles.chero}>
          <div className={styles.cwrap}>
            <span className={`eyebrow ${styles.cheroEyebrow}`}>{data.eyebrow}</span>
            <h1 className={styles.cheroNames}>
              {data.name1} <span className={styles.amp}>&amp;</span> {data.name2}
            </h1>
            <p className={styles.cheroSince}>{data.since}</p>
            <LiveCounter startDate={data.startDate} label={data.counterLabel} />
          </div>
        </section>

        {/* polaroids */}
        <section>
          <div className={styles.cwrap}>
            <div className={styles.cscene}>
              <div className={`polaroid ${styles.cp1} reveal`}>
                <img style={{ width: p1.w, height: p1.h }} src={p1.src} alt={p1.alt} />
                <div className="cap">{p1.cap}</div>
              </div>
              <div className={`polaroid ${styles.cp2} reveal`}>
                <img style={{ width: p2.w, height: p2.h }} src={p2.src} alt={p2.alt} />
                <div className="cap">{p2.cap}</div>
              </div>
              <div className={`polaroid ${styles.cp3} reveal`}>
                <img style={{ width: p3.w, height: p3.h }} src={p3.src} alt={p3.alt} />
                <div className="cap">{p3.cap}</div>
              </div>
              <div className={`polaroid ${styles.cpCenter} reveal`}>
                <img style={{ width: pCenter.w, height: pCenter.h }} src={pCenter.src} alt={pCenter.alt} />
                <div className="cap">{pCenter.cap}</div>
              </div>
            </div>
          </div>
        </section>

        {/* story */}
        <section className={styles.cstory}>
          <div className={styles.cwrap}>
            <div className={`${styles.cstoryHead} reveal`}>
              <span className={`eyebrow ${styles.cheroEyebrow}`}>{data.storyEyebrow}</span>
              <h2 className="h2" style={{ marginTop: 18 }}>
                {data.storyH2.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < data.storyH2.split('\n').length - 1 && <br />}</span>
                ))}
              </h2>
            </div>

            {data.story.map((row, i) => (
              <div key={i} className={`${styles.cstoryRow} ${row.flip ? styles.flip : ''} reveal`}>
                <div className={styles.cstoryMedia}>
                  <img src={row.img} alt={row.imgAlt} />
                </div>
                <div className={styles.cstoryText}>
                  <span className={styles.cstoryDate}>{row.date}</span>
                  <h3>{row.h3}</h3>
                  <p>{row.p}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* closing */}
        <section className={styles.cclose}>
          <div className={styles.cwrap}>
            <p className={styles.ccloseLine}>
              {data.closeLine.split('\n').map((line, i) => (
                <span key={i}>{line}{i < data.closeLine.split('\n').length - 1 && <br />}</span>
              ))}
            </p>
            <p className={styles.ccloseSub}>{data.closeSub}</p>
          </div>
        </section>
      </main>

      {/* footer / made with */}
      <footer className={styles.cmade}>
        <div className={styles.cwrap}>
          <span className={styles.cmadeK}>Esta página foi feita no Somos Eternos</span>
          <h2>Toda história de amor merece uma casa própria na internet.</h2>
          <Link to="/entrar" className="btn btn--lg" style={{ background: 'var(--terra)', color: '#fff' }}>
            Criar a nossa página assim →
          </Link>
          <p className={styles.cmadeSmall}>R$ 27,90 · pagamento único · acesso vitalício</p>
        </div>
      </footer>

      {data.vinyl && (
        <VinylPlayer
          trackId={data.vinyl.trackId}
          song={data.vinyl.song}
          artist={data.vinyl.artist}
        />
      )}
    </div>
  );
}

/* Fonte: couple.css, exemplo-casamento.html, exemplo-viagem.html, exemplo-pedido.html */
