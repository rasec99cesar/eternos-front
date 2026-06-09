import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Nav.module.css';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`wrap ${styles.navIn}`}>
        <Link to="/" className={styles.brand}>
          Sempre<span className={styles.dot}>.</span>
        </Link>

        <nav className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          <a href="/#contador" onClick={() => setMenuOpen(false)}>O contador</a>
          <a href="/#como" onClick={() => setMenuOpen(false)}>A ideia</a>
          <a href="/#exemplos" onClick={() => setMenuOpen(false)}>Exemplos</a>
          <a href="/#oferta" onClick={() => setMenuOpen(false)}>Preço</a>
          <a href="/#faq" onClick={() => setMenuOpen(false)}>Dúvidas</a>
        </nav>

        <div className={styles.cta}>
          {user ? (
            <>
              <Link to="/minhas-paginas" className={`btn btn--ghost-dark`} style={{ fontSize: 14, minHeight: 40, padding: '10px 18px' }}>
                Minhas páginas
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
            </>
          ) : (
            <>
              <span className={styles.count}>
                <span className="pulse-dot" />
                <span>7.432 páginas criadas</span>
              </span>
              <Link to="/entrar" className="btn btn--primary">Eternize este momento</Link>
            </>
          )}
        </div>

        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
