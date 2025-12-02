import React from 'react';
import { fmtNumber } from '../utils/format';

export function ProgressBar({ currentXp = 0, maxXp = 0, percent = 0 }) {
  const pct = Math.max(0, Math.min(100, typeof percent === 'number' ? percent : (maxXp ? (currentXp / maxXp) * 100 : 0)));
  return (
    <div className="progressbar-wrap" style={{ width: '100%' }}>
      <div className="progressbar" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
        <div className="progressbar-fill" style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#8a2be2,#bd00ff)' }} />
      </div>
      <div className="progressbar-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.85rem', color: '#d6d6d8' }}>
        <div>{fmtNumber(currentXp)} XP</div>
        <div>{maxXp ? `${fmtNumber(maxXp)} XP` : `${Math.round(pct)}%`}</div>
      </div>
    </div>
  );
}

export default ProgressBar;