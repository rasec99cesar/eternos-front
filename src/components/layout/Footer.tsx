import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.foot}>
      <div className="wrap">
        <div className={styles.top}>
          <div>
            <Link to="/" className={styles.brand}>Somos Eternos</Link>
            <p className={styles.tagline}>A memória de vocês, contando em tempo real.</p>
          </div>
          <div className={styles.links}>
            <div className={styles.col}>
              <h5>Produto</h5>
              <a href="/#contador">O contador</a>
              <a href="/#como">Como funciona</a>
              <a href="/#oferta">Preço</a>
            </div>
            <div className={styles.col}>
              <h5>Temas</h5>
              <a href="/#exemplos">Namoro</a>
              <a href="/#exemplos">Casamento</a>
              <a href="/#exemplos">Viagem</a>
            </div>
            <div className={styles.col}>
              <h5>Suporte</h5>
              <a href="/#faq">Dúvidas</a>
              <a href="/#oferta">Garantia</a>
            </div>
          </div>
        </div>
        <div className={styles.bot}>
          <span>© 2026 Somos Eternos · Feito com cuidado para durar.</span>
          <span>Pagamento 100% seguro · Garantia de 7 dias</span>
        </div>
      </div>
    </footer>
  );
}
