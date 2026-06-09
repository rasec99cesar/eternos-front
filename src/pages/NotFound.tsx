import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>♥</div>
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.sub}>O endereço que você acessou não existe ou foi movido.</p>
        <Link to="/" className="btn btn--primary btn--lg">Voltar para o início →</Link>
      </div>
    </div>
  );
}
