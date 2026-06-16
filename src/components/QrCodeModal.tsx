import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import Modal from './Modal';
import { trackEvent } from '../utils/analytics';
import styles from './QrCodeModal.module.css';

const SIZE = 600;
const PREVIEW = 220;

function fileSafeName(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'pagina';
}

export default function QrCodeModal({
  url,
  accentColor,
  personOne,
  personTwo,
  onClose,
}: {
  url: string;
  accentColor: string;
  personOne: string;
  personTwo: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: SIZE,
      height: SIZE,
      data: url,
      type: 'canvas',
      margin: 12,
      qrOptions: { errorCorrectionLevel: 'H' },
      image: `${window.location.origin}/favicon.svg`,
      imageOptions: { crossOrigin: 'anonymous', margin: 10, imageSize: 0.4, hideBackgroundDots: true },
      dotsOptions: { type: 'rounded', color: accentColor },
      cornersSquareOptions: { type: 'extra-rounded', color: accentColor },
      cornersDotOptions: { type: 'dot', color: accentColor },
      backgroundOptions: { color: '#ffffff' },
    });
    qrRef.current = qr;
    const node = containerRef.current;
    if (node) qr.append(node);
    return () => {
      qrRef.current = null;
      if (node) node.innerHTML = '';
    };
  }, [url, accentColor]);

  async function handleDownload() {
    if (!qrRef.current) return;
    setDownloading(true);
    try {
      const name = `qrcode-${fileSafeName(`${personOne}-${personTwo}`)}`;
      await qrRef.current.download({ name, extension: 'png' });
      trackEvent('qr_code_download');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal title="QR Code da página" onClose={onClose}>
      <p className={styles.sub}>Aponte a câmera para abrir a página de {personOne} &amp; {personTwo}.</p>
      <div className={styles.preview}>
        <div ref={containerRef} style={{ width: PREVIEW, height: PREVIEW }} />
      </div>
      <p className={styles.url}>{url}</p>
      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost-dark" onClick={onClose}>Fechar</button>
        <button type="button" className="btn btn--primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? <span className="spinner" /> : 'Baixar PNG'}
        </button>
      </div>
    </Modal>
  );
}
