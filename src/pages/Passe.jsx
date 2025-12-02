import { useContext, useMemo, useState, useEffect } from 'react';
import { UserContext } from '../contexts/AuthContext';
import { ProgressBar } from '../components/ProgressBar';
import api from '../services/api';
import '../styles/Passe.css';
import { fmtNumber, fmtCurrency } from '../utils/format';

export default function Passe() {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const passName = 'Kitsune';
  const passPrice = 55;

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const baseXpForLevel = (lvl) => 100 * Math.pow(lvl - 1, 2);
  const nextXpForLevel = (lvl) => 100 * Math.pow(lvl, 2);
  const base = baseXpForLevel(level);
  const next = nextXpForLevel(level);
  const xpInLevel = Math.max(0, xp - base);
  const xpNeeded = Math.max(0, next - xp);
  const progress = next > base ? Math.min(1, xpInLevel / (next - base)) : 0;

  const levels = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ lvl: i + 1 })), []);

  const FRAME_NAMES = [
    'Neko Sombrio',
    'Halo Celestial',
    'Jardim Feérico',
    'Sakura Sombria',
    'Dragão do Abismo',
    'Rosa Gótica',
    'Kitsune Branco',
    'Ritual Carmesim',
    'Bosque Ancestral',
    'Eclipse Solar',
    'Chama Eterna',
    'Voo Azul'
  ];
  const PASS_FRAMES = [1, null, 3, null, 5, 6, null, 8, null, 10];

  const passObj = user?.profile?.passes?.[passName] || {};
  const purchased = !!passObj.purchased;
  const claimed = new Set((passObj.claimedLevels || []).map(Number));
  const userBalance = Number(user?.balance ?? user?.profile?.balance ?? 0);

  useEffect(() => {
    if (user?.id || user?._id) {
      api.post('/gamification/visit', { userId: user?.id || user?._id, section: 'battle_pass' }).catch(() => {});
    }
  }, [user?.id, user?._id]);

  async function handleBuyPass() {
    if (purchased) return;
    if ((userBalance ?? 0) < passPrice) return alert('Saldo insuficiente');
    try {
      setLoading(true);
      const res = await api.post('/user/buy-pass', { passName, price: passPrice, userId: user?.id || user?._id });
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        api.post('/gamification/recompute', { userId: res.data.id || res.data._id }).catch(() => {});
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao comprar pass');
    } finally { setLoading(false); }
  }

  async function handleClaim(levelNum) {
    if (!purchased) return alert('Compre o passe primeiro');
    if (level < levelNum) return alert('Nivel não alcançado');
    if (claimed.has(levelNum)) return alert('Já resgatado');
    try {
      setLoading(true);
      const res = await api.post('/user/claim-pass', { passName, level: levelNum, userId: user?.id || user?._id });
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        api.post('/gamification/recompute', { userId: res.data.id || res.data._id }).catch(() => {});
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao resgatar');
    } finally { setLoading(false); }
  }

  return (
    <main className="passe-page container">
      <header className="passe-header">
        <div>
          <h1 className="passe-title">Passe de Batalha — Temporada Kitsune</h1>
        </div>

        <div className="badge-wrap">
          <button className="premium-badge" onClick={handleBuyPass} disabled={purchased || loading}>
            {purchased ? 'Passe comprado' : `Comprar Passe ${fmtCurrency(passPrice)}`}
          </button>
        </div>
      </header>

      <section className="passe-card">
        <div className="passe-top">
          <div className="level-info">
            <div className="level-number">Nível {fmtNumber(level)}</div>
            <div className="xp-brief">{fmtNumber(xpInLevel)} / {fmtNumber(next - base)} XP</div>
          </div>

          <div className="progress-wrap">
            <ProgressBar currentXp={xpInLevel} maxXp={next - base} percent={progress * 100} />
            <div className="xp-remaining">{fmtNumber(xpNeeded)} XP para o próximo nível</div>
          </div>
        </div>

        <div className="passe-levels">
          {levels.map(({ lvl }) => {
            const unlocked = level >= lvl;
            const isClaimed = claimed.has(lvl);
            const frameNumber = PASS_FRAMES[lvl - 1]; 
            const isFrame = !!frameNumber;
            const frameName = isFrame ? FRAME_NAMES[frameNumber - 1] : null;
            return (
              <div key={lvl} className={`level-card2 ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="level-left"><div className="circle">{lvl}</div></div>
                <div className="level-body">
                  <div className="level-title">Nível {lvl}</div>
                  <div className="level-desc">{isFrame ? `Aro (Passe) — ${frameName}` : `Crédito R$5`}</div>
                </div>
                <div className="level-right">
                  {unlocked ? (
                    isClaimed ? (
                      <button className="claim-btn" disabled>Resgatado</button>
                    ) : (
                      <button className="claim-btn" onClick={() => handleClaim(lvl)} disabled={loading || !purchased}>
                        {purchased ? 'Resgatar' : 'Comprar Passe'}
                      </button>
                    )
                  ) : (
                    <button className="locked-btn" disabled>Bloqueado</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}