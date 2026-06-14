import React from 'react';
import { COLORS } from './Common';

export interface BadgeSpec {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
  color?: string;
}

export function Badges({ badges }: { badges: BadgeSpec[] }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 18 }}>Badges</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {badges.map(b => (
          <div key={b.id} style={{ background: b.earned ? 'linear-gradient(135deg,#FDE68A,#FDBA74)' : 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 18, textAlign: 'center', border: `1px solid ${b.earned ? COLORS.yellow + '44' : 'transparent'}` }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: b.color || COLORS.purple700, color: 'white' }}>
              {b.earned ? '🏅' : '🔒'}
            </div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{b.name}</div>
            <div style={{ fontSize: 13, color: COLORS.purple300 }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Badges;
