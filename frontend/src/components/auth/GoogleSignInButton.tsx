import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';

// Kiểu tối giản cho Google Identity Services (https://accounts.google.com/gsi/client)
interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (res: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiLoader: Promise<void> | null = null;

const loadGsiScript = (): Promise<void> => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoader) {
    gsiLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiLoader = null;
        reject(new Error('Không tải được Google Sign-In'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiLoader;
};

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

/**
 * Nút "Tiếp tục với Google". Tự ẩn khi backend chưa cấu hình GOOGLE_CLIENT_ID.
 * Hiển thị kèm đường kẻ "hoặc" phía dưới.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  text = 'continue_with',
  disabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [loadError, setLoadError] = useState<string | null>(null);

  const { data: providers } = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: authService.getProviders,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const clientId = providers?.googleEnabled ? providers.googleClientId : null;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => callbackRef.current(res.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          locale: 'vi',
          logo_alignment: 'center',
          width: Math.min(containerRef.current.offsetWidth || 400, 400),
        });
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) return null;

  return (
    <div className="mt-6">
      <div
        ref={containerRef}
        className={`flex min-h-[44px] w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={disabled}
      />
      {loadError && <p className="mt-2 text-center text-xs text-rose-600">{loadError}</p>}
      <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        hoặc
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
};
