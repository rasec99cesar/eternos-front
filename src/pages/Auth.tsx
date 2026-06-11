import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { identifyUmamiSession, isPlanKey, trackEvent } from '../utils/analytics';
import styles from './Auth.module.css';

type Step = 'email' | 'code';

export default function AuthPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/criar';
  const defaultPlan = params.get('plan') || '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already authed
  useEffect(() => {
    if (!user) return;
    if (isPlanKey(defaultPlan)) sessionStorage.setItem('selected_plan', defaultPlan);
    navigate(defaultPlan ? `${redirect}?plan=${defaultPlan}` : redirect, { replace: true });
  }, [user]);

  function startCooldown() {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError('Digite seu e-mail.'); return; }
    setLoading(true);
    setError('');
    trackEvent('auth_email_submit');
    try {
      await api.auth.requestCode(normalizedEmail);
      setEmail(normalizedEmail);
      identifyUmamiSession(normalizedEmail);
      trackEvent('auth_code_sent');
      setStep('code');
      startCooldown();
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err) {
      trackEvent('auth_code_send_error');
      setError('Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    trackEvent('auth_code_resend');
    try {
      await api.auth.requestCode(email.trim());
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
      startCooldown();
    } catch {
      setError('Não foi possível reenviar o código.');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      const next = [...code];
      next[i - 1] = '';
      setCode(next);
      codeRefs.current[i - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      codeRefs.current[5]?.focus();
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Digite todos os 6 dígitos.'); return; }
    setLoading(true);
    setError('');
    trackEvent('auth_code_submit');
    try {
      const userData = await api.auth.verifyCode(email.trim(), fullCode);
      trackEvent('auth_code_success');
      if (isPlanKey(defaultPlan)) sessionStorage.setItem('selected_plan', defaultPlan);
      setUser(userData);
      navigate(defaultPlan ? `${redirect}?plan=${defaultPlan}` : redirect, { replace: true });
    } catch (err: unknown) {
      trackEvent('auth_code_error');
      setError(err instanceof Error ? err.message : 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <Link to="/" className={styles.brand}>Somos Eternos</Link>
      </nav>

      <div className={styles.card}>
        <div className={styles.icon}>♥</div>

        {step === 'email' ? (
          <>
            <h1 className={styles.title}>Bem-vindo ao Somos Eternos</h1>
            <p className={styles.sub}>Digite seu e-mail para receber o código de acesso</p>

            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className="field">
                <label className="label" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${error ? 'input--error' : ''}`}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                />
                {error && <span className="field-error">{error}</span>}
              </div>

              <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Continuar'}
                {!loading && <span className="arrow">→</span>}
              </button>
            </form>

            <p className={styles.hint}>
              Sem senha. Sem Google. Só o seu e-mail.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Enviamos um código</h1>
            <p className={styles.sub}>
              Digite o código de 6 dígitos enviado para<br />
              <strong style={{ color: 'var(--ink)' }}>{email}</strong>
            </p>

            <form onSubmit={handleCodeSubmit} className={styles.form}>
              <div className={styles.codeRow} onPaste={handleCodePaste}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (codeRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className={`${styles.codeInput} ${error ? styles.codeErr : ''}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              {error && <span className="field-error" style={{ textAlign: 'center' }}>{error}</span>}

              <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Entrar'}
              </button>
            </form>

            <div className={styles.resendRow}>
              <button
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                type="button"
              >
                Reenviar código
                {resendCooldown > 0 && <span className={styles.cooldown}> ({resendCooldown}s)</span>}
              </button>
              <button
                className={styles.changeEmail}
                onClick={() => { setStep('email'); setError(''); setCode(['','','','','','']); }}
                type="button"
              >
                Trocar e-mail
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
