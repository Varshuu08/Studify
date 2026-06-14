import { supabase } from './supabase';

export function useGoogleCalendar() {
  // Opens server auth URL in a popup and waits for a postMessage with tokens.
  const connect = async (): Promise<any> => {
    let res = await fetch('/api/google/auth-url');
    if (!res.ok) res = await fetch('/auth-url');
    if (!res.ok) throw new Error('Failed to get auth URL');
    const payload = await res.json();
    let url = payload.url;
    try {
      const uresp = await supabase.auth.getUser();
      const user = uresp?.data?.user ?? null;
      if (user) {
        const state = encodeURIComponent(JSON.stringify({ userId: user.id }));
        url = url.includes('?') ? `${url}&state=${state}` : `${url}?state=${state}`;
      }
    } catch {}
    const popup = window.open(url, 'google_oauth', 'width=600,height=700');
    if (!popup) throw new Error('Popup blocked');
    return new Promise((resolve, reject) => {
      const onMessage = (e: MessageEvent) => {
        if (!e.data) return;
        if (e.data?.type === 'google_oauth' && e.data?.tokens) {
          window.removeEventListener('message', onMessage);
          try { popup.close(); } catch {}
          resolve(e.data.tokens);
        }
      };
      window.addEventListener('message', onMessage);
      const timer = setInterval(()=>{
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', onMessage);
          reject(new Error('OAuth popup closed'));
        }
      }, 500);
    });
  };
  return { connect };
}
