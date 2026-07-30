import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop';
  return 'unknown';
};

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

const DISMISSED_KEY = 'fj-install-dismissed';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [installing, setInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const plat = detectPlatform();
    setPlatform(plat);

    if (plat === 'ios') {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop overlay for general install prompt */}
      <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        {/* iOS manual setup step-by-step modal */}
        {showIOSSteps ? (
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
            style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1e3a8a 50%, #0f1b3d 100%)', border: '1px solid rgba(96,165,250,0.3)' }}
          >
            <div className="p-6 space-y-5 text-left">
              <div className="text-center space-y-1">
                <div className="text-4xl mb-2">📲</div>
                <h3 className="text-lg font-bold text-white">Add to Home Screen</h3>
                <p className="text-xs text-blue-200">Follow these steps to install DHLC Tasks on your iPhone / iPad</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '1️⃣', text: 'Tap the Share button', sub: '(the box with an arrow pointing up) at the bottom of Safari' },
                  { icon: '2️⃣', text: 'Scroll down and tap', sub: '"Add to Home Screen"' },
                  { icon: '3️⃣', text: 'Tap "Add"', sub: 'in the top-right corner to confirm' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl animate-fade-in" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <span className="text-xl leading-none mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.text}</p>
                      <p className="text-xs text-blue-200">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-blue-300 animate-pulse" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Look for this icon in Safari's toolbar
                </div>
              </div>
              <button
                onClick={() => { setShowIOSSteps(false); handleDismiss(); }}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 cursor-pointer text-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                Got it!
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f1b3d 0%, #1a3a8f 50%, #0f172a 100%)',
              border: '1px solid rgba(96,165,250,0.35)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(96,165,250,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Glow strip */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa, #a78bfa, transparent)' }} />

            <div className="p-6 text-center space-y-4">
              <div className="flex justify-end -mt-2 -mr-2">
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  aria-label="Dismiss install prompt"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* App icon */}
              <img src="/icons/smooth-icon.svg" alt="DHLC Tasks Icon" className="w-16 h-16 mx-auto drop-shadow-xl" />

              {/* Text */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Install DHLC Tasks</h3>
                <p className="text-xs text-blue-200 leading-relaxed px-4">
                  {platform === 'ios'
                    ? 'Add DHLC Tasks to your Home Screen for full offline support and premium features.'
                    : 'Install DHLC Tasks app for fast offline access and native-like performance.'}
                </p>
              </div>

              {/* Action button */}
              <div className="pt-2">
                {platform === 'ios' ? (
                  <button
                    onClick={() => setShowIOSSteps(true)}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}
                  >
                    Show me how →
                  </button>
                ) : (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}
                  >
                    {installing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Installing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Install App
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
