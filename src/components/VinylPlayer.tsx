import { useEffect, useRef, useState } from 'react';
import styles from './VinylPlayer.module.css';

// ── Global Spotify IFrame API registry (module-level, runs once) ──────────
declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIFrameAPI) => void;
    _spotifyIframeApi: SpotifyIFrameAPI | undefined;
    _spotifyIframeApiPending: Array<(api: SpotifyIFrameAPI) => void>;
  }
}

interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: object,
    callback: (ctrl: SpotifyController) => void
  ) => void;
}

interface SpotifyController {
  play: () => void;
  pause: () => void;
  destroy?: () => void;
  addListener: (
    event: string,
    callback: (e: { data: { isPaused: boolean } }) => void
  ) => void;
}

if (typeof window !== 'undefined') {
  if (!window._spotifyIframeApiPending) window._spotifyIframeApiPending = [];
  window.onSpotifyIframeApiReady = (api) => {
    window._spotifyIframeApi = api;
    window._spotifyIframeApiPending.forEach((cb) => cb(api));
    window._spotifyIframeApiPending = [];
  };
}

export interface VinylPlayerProps {
  trackId: string;
  song: string;
  artist: string;
  previewOnly?: boolean; // editor preview: visual only, no audio
}

export default function VinylPlayer({ trackId, song, artist, previewOnly = false }: VinylPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(previewOnly);
  const [needsTouch, setNeedsTouch] = useState(false);
  const ctrlRef = useRef<SpotifyController | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const armedRef = useRef(false);
  const isPlayingRef = useRef(false);
  // Stores the cleanup fn that removes arm() window listeners
  const armCleanupRef = useRef<(() => void) | null>(null);

  function play() {
    if (ctrlRef.current && readyRef.current) {
      try { ctrlRef.current.play(); } catch { /* autoplay blocked */ }
    }
  }

  // Removes arm() window listeners once playback is confirmed —
  // prevents pointerdown from calling play() when user clicks to pause.
  function disarm() {
    if (armCleanupRef.current) {
      armCleanupRef.current();
      armCleanupRef.current = null;
    }
  }

  // arm() — listen for first user interaction to trigger play (autoplay fallback)
  // Fonte: vinyl.js
  function arm() {
    if (armedRef.current) return;
    armedRef.current = true;
    setNeedsTouch(true);
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'] as const;
    function onFirstInteraction(e: Event) {
      // For click/touch on the vinyl player, handleClick manages play/pause.
      // For scroll/wheel/keydown (non-click events), always trigger play regardless of target.
      const isClickLike = e.type === 'pointerdown' || e.type === 'touchstart';
      if (isClickLike && playerRef.current?.contains(e.target as Node)) {
        setNeedsTouch(false);
        armCleanupRef.current = null;
        events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction));
        return;
      }
      play();
      setNeedsTouch(false);
      armCleanupRef.current = null;
      events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction));
    }
    events.forEach((ev) =>
      window.addEventListener(ev, onFirstInteraction, { once: true, passive: true })
    );
    // Save cleanup so disarm() can remove listeners if autoplay succeeds before first interaction
    armCleanupRef.current = () => {
      events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction));
      setNeedsTouch(false);
    };
  }

  useEffect(() => {
    if (previewOnly || !trackId || !embedRef.current) return;

    const embedEl = embedRef.current;
    let localCtrl: SpotifyController | null = null;

    function initController(IFrameAPI: SpotifyIFrameAPI) {
      IFrameAPI.createController(
        embedEl,
        { uri: `spotify:track:${trackId}`, width: '100%', height: '80' },
        (ctrl: SpotifyController) => {
          localCtrl = ctrl;
          ctrlRef.current = ctrl;
          ctrl.addListener('playback_update', (e) => {
            const playing = !e.data.isPaused;
            isPlayingRef.current = playing;
            setIsPlaying(playing);
            if (playing) disarm();
          });
          ctrl.addListener('ready', () => {
            readyRef.current = true;
            try { ctrl.play(); } catch { /* noop — arm() handles the fallback */ }
            // Always arm: browsers often block autoplay silently (no exception thrown)
            arm();
          });
        }
      );
    }

    if (window._spotifyIframeApi) {
      initController(window._spotifyIframeApi);
    } else {
      window._spotifyIframeApiPending.push(initController);
      if (!document.getElementById('spotify-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'spotify-iframe-api';
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      // Remove pending callback in case Spotify API hasn't loaded yet
      window._spotifyIframeApiPending = window._spotifyIframeApiPending.filter(
        (cb) => cb !== initController
      );
      // Destroy controller — critical in React StrictMode (effects run twice in dev),
      // prevents two controllers existing simultaneously and fighting over playback state
      if (localCtrl) {
        try { localCtrl.destroy?.(); } catch { /* noop */ }
        if (ctrlRef.current === localCtrl) ctrlRef.current = null;
        localCtrl = null;
      }
      // Reset refs so a fresh remount initialises cleanly
      readyRef.current = false;
      isPlayingRef.current = false;
      armCleanupRef.current?.();
      armCleanupRef.current = null;
      armedRef.current = false;
    };
  }, [trackId, previewOnly]);

  function handleClick() {
    if (previewOnly) return;
    if (!ctrlRef.current || !readyRef.current) return;
    const wasPlaying = isPlayingRef.current;
    try {
      if (wasPlaying) {
        // Optimistic update: reflect user intent immediately, don't wait for playback_update
        isPlayingRef.current = false;
        setIsPlaying(false);
        ctrlRef.current.pause();
      } else {
        ctrlRef.current.play();
      }
    } catch {
      // Rollback optimistic update if the API call throws
      if (wasPlaying) {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }
    }
  }

  const cls = [
    styles.vinylPlayer,
    isPlaying ? styles.isPlaying : '',
    needsTouch && !isPlaying ? styles.needsTouch : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={playerRef}
        className={cls}
        data-track={trackId}
        role="button"
        tabIndex={0}
        aria-label="Tocar ou pausar a nossa música"
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        style={previewOnly ? { position: 'absolute', bottom: 24, left: 24 } : undefined}
      >
        <div className={styles.vinylDisc}>
          <div className={styles.vinylDiscSpin}>
            <div className={styles.vinylDiscRecord} />
            <div className={styles.vinylDiscLabel} />
            <div className={styles.vinylDiscHole} />
          </div>
          <div className={styles.vinylDiscSheen} />
          <div className={styles.vinylDiscBtn}>
            <svg className={`${styles.vpIco} ${styles.vpIcoPause}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
            <svg className={`${styles.vpIco} ${styles.vpIcoPlay}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </div>
        </div>
        <div className={styles.vinylMeta}>
          <span className={styles.vinylMetaK}>
            <span className={styles.vinylEq}><i /><i /><i /></span>
            <span className={styles.vinylState}>{isPlaying ? 'Tocando agora' : 'Pausado'}</span>
          </span>
          <span className={styles.vinylMetaSong}>{song}</span>
          <span className={styles.vinylMetaArtist}>{artist}</span>
        </div>
        <div className={styles.vinylHint}>Toque para ouvir a nossa música ♪</div>
      </div>

      {!previewOnly && (
        <div className={styles.vinylEmbed} aria-hidden="true">
          <div ref={embedRef} id="vinyl-embed-target" />
        </div>
      )}
    </>
  );
}
