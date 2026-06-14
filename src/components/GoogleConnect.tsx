import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGoogleCalendar } from '../lib/useGoogleCalendar';

export default function GoogleConnect() {
  const { connect } = useGoogleCalendar();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(()=>{
    const check = async ()=>{
      try {
        const uresp = await supabase.auth.getUser();
        const user = uresp?.data?.user ?? null;
        if (!user) { setStatus('Not signed in'); return; }
        const { data } = await supabase.from('users').select('google_tokens').eq('id', user.id).single();
        if (data && data.google_tokens) setStatus('Connected'); else setStatus('Not connected');
      } catch (e) { setStatus('Unknown'); }
    };
    check();
  },[]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const tokens = await connect();
      setStatus('Connected (popup returned tokens)');
      // attempt to save tokens server-side
      try {
        const uresp = await supabase.auth.getUser();
        const user = uresp?.data?.user ?? null;
        if (user) {
          await fetch('/api/google/save-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, tokens }) });
          setStatus('Connected and saved');
        } else {
          setStatus('Connected — sign in to persist tokens');
        }
      } catch (e:any) {
        console.warn('save tokens failed', e);
        setStatus('Connected — save failed');
      }
    } catch (e:any) {
      setStatus('Connect failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <div style={{ fontWeight:700 }}>Google Calendar</div>
      <div style={{ color:'#A78BFA' }}>{status}</div>
      <button onClick={handleConnect} disabled={loading} style={{ background:'#7C3AED', color:'white', border:'none', padding:'6px 10px', borderRadius:6 }}>{loading ? 'Connecting...' : 'Connect'}</button>
    </div>
  );
}
