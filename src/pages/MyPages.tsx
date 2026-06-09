import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { trackEvent } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import type { CouplePage } from '../shared/index';
import styles from './MyPages.module.css';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_payment: 'Aguardando pagamento',
  paid: 'Pago',
  published: 'Publicado',
  archived: 'Arquivado',
};

export default function MyPagesPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<CouplePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.pages.list()
      .then(setPages)
      .catch(() => setError('Não foi possível carregar suas páginas.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    trackEvent('auth_logout_click');
    await logout();
    navigate('/');
  }

  async function deletePage(id: string) {
    if (!confirm('Remover esta página permanentemente?')) return;
    try {
      await api.pages.delete(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Erro ao remover a página.');
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.brand}>Sempre<span style={{ color: 'var(--terra)' }}>.</span></Link>
        <div className={styles.topRight}>
          <Link to="/criar" className="btn btn--primary" style={{ minHeight: 40, padding: '10px 20px', fontSize: 14 }}>
            + Nova página
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Minhas páginas</h1>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <span className="spinner spinner--dark" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {error && <div className={styles.err}>{error}</div>}

        {!loading && pages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>♥</div>
            <p className={styles.emptyText}>Você ainda não criou nenhuma página.</p>
            <Link to="/criar" className="btn btn--primary btn--lg">Criar a primeira agora →</Link>
          </div>
        )}

        {!loading && pages.length > 0 && (
          <div className={styles.grid}>
            {pages.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={`${styles.status} ${styles[`status_${p.status}`]}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <button className={styles.deleteBtn} onClick={() => deletePage(p.id)} title="Remover">×</button>
                </div>
                <h2 className={styles.cardTitle}>{p.title}</h2>
                <p className={styles.cardSub}>{p.personOneName} & {p.personTwoName}</p>

                {p.publicUrl && (
                  <a href={p.publicUrl} target="_blank" rel="noopener noreferrer" className={styles.publicLink}>
                    {p.publicUrl.replace('https://', '')}
                  </a>
                )}

                <div className={styles.cardActions}>
                  {p.status === 'paid' || p.status === 'published' ? (
                    <Link to={`/editor/${p.id}`} className="btn btn--ghost-dark" style={{ fontSize: 14, minHeight: 38, padding: '8px 16px' }}>
                      Editar
                    </Link>
                  ) : (
                    <Link to={`/planos/${p.id}`} className="btn btn--ghost-dark" style={{ fontSize: 14, minHeight: 38, padding: '8px 16px' }}>
                      Pagar
                    </Link>
                  )}
                  {p.status === 'published' && p.publicUrl ? (
                    <a href={p.publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ fontSize: 14, minHeight: 38, padding: '8px 16px' }}>
                      Ver →
                    </a>
                  ) : p.status === 'paid' ? (
                    <Link to={`/editor/${p.id}`} className="btn btn--primary" style={{ fontSize: 14, minHeight: 38, padding: '8px 16px' }}>
                      Publicar
                    </Link>
                  ) : (
                    <Link to={`/planos/${p.id}`} className="btn btn--primary" style={{ fontSize: 14, minHeight: 38, padding: '8px 16px' }}>
                      Continuar →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
