import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../contexts/AuthContext';
import { User as UserIcon } from 'lucide-react';
import api from '../services/api';
import '../styles/Perfil.css';
import AvatarUploader from '../components/AvatarUploader';
import { fmtNumber, fmtCurrency } from '../utils/format';

export default function Perfil() {
  const { user, setUser } = useContext(UserContext);
  const [openPicker, setOpenPicker] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const defaultCatalog = [
    { id: 'avatar_default', type: 'avatar', name: 'Avatar Default', image: '/assets/avatars/default.png', source: 'free', price: 0 },
    { id: 'avatar_cat', type: 'avatar', name: 'Gato', image: '/assets/avatars/cat.png', source: 'pass', price: 0 },

    { id: 'frame_rose', type: 'frame', name: 'Aro Rosado', image: '/assets/frames/rose.png', source: 'shop', price: 100 },
    { id: 'frame_frog', type: 'frame', name: 'Aro Sapo', image: '/assets/frames/frog.png', source: 'pass', price: 0 },
  ];

  const inventory = user?.profile?.inventory ?? [];
  const equipped = user?.profile?.equipped ?? { avatar: null, frame: null, accessory: null };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/shop/catalog');
        if (mounted && res?.data) setCatalog(res.data);
      } catch {
        if (mounted) setCatalog(defaultCatalog);
      }
    })();
    return () => (mounted = false);
  }, []);

  const FRAME_SLOTS = 12;
  const fetchedFrames = catalog.filter(c => c.type === 'frame');

  const KITSUNE_ORDER = [1, 3, 5, 6, 8, 10];
  const SHOP_FRAMES = new Set([2,4,5,6,8,11]); 

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

  const framesConfig = Array.from({ length: FRAME_SLOTS }).map((_, i) => {
    const num = i + 1;
    const id = `frame_${num}`;
    const image = `/assets/${num}.png`;
    const name = FRAME_NAMES[num - 1] || `Aro ${num}`;

    const passIndex = KITSUNE_ORDER.indexOf(num);
    if (passIndex >= 0) {
      return {
        id,
        type: 'frame',
        name,
        image,
        source: 'pass',
        requiredPass: { passName: 'Kitsune', level: passIndex + 1 },
        price: 0
      };
    }

    if (SHOP_FRAMES.has(num)) {
      return {
        id,
        type: 'frame',
        name,
        image,
        source: 'shop',
        price: 100
      };
    }

    return { id, type: 'frame', name, image, source: 'shop', price: 100 };
  });

  const merged = new Map();
  framesConfig.forEach(p => merged.set(p.id, p));
  fetchedFrames.forEach(f => {
    const base = merged.get(f.id) || {};
    const item = {
      ...f,
      ...base,              
      image: f.image || base.image || (`/assets/${(f.id?.split('_')[1]) || '1'}.png`)
    };
    if (base.source === 'pass') item.source = 'pass';
    merged.set(item.id, item);
  });
  const framesCatalog = Array.from(merged.values()).slice(0, FRAME_SLOTS);

  const GOOD_FRAMES = new Set(['frame_4','frame_5','frame_6','frame_7','frame_8','frame_10']);
  const CUSTOM_FRAMES = ['frame_1','frame_2','frame_3','frame_9','frame_11','frame_12'];

  function frameClass(frameId) {
    if (!frameId) return '';
    if (GOOD_FRAMES.has(frameId)) return 'frame-group-good';
    const idx = CUSTOM_FRAMES.indexOf(frameId);
    if (idx >= 0) return `frame-group-custom frame-custom-${idx + 1}`;
    const m = String(frameId).match(/^frame_(\d{1,2})$/);
    if (m) return GOOD_FRAMES.has(`frame_${m[1]}`) ? 'frame-group-good' : 'frame-group-custom';
    return '';
  }

  function isOwned(itemId) {
    return (user?.profile?.inventory || []).some(i => i.id === itemId && (i.owned ?? true));
  }

  function isUnlockedByRules(frame) {
    if (!frame) return false;
    if (frame.source === 'shop') return isOwned(frame.id);

    if (frame.source === 'pass' && frame.requiredPass) {
      const passName = frame.requiredPass.passName;
      const requiredLevel = Number(frame.requiredPass.level || 1);

      const passObj = user?.profile?.passes?.[passName];
      if (!passObj || !passObj.purchased) return false;

      const claimed = Array.isArray(passObj.claimedLevels) ? passObj.claimedLevels.map(Number) : [];
      if (claimed.includes(requiredLevel)) return true;

      if (isOwned(frame.id)) return true;

      return false;
    }

    return false;
  }

  function getFrameImage(frameId) {
    const found = catalog.find(c => c.id === frameId) || framesCatalog.find(f => f.id === frameId);
    if (found) return found.image;
    const m = String(frameId || '').match(/^frame_(\d{1,2})$/);
    if (m) return `/assets/${m[1]}.png`;
    return null;
  }

  async function handlePurchase(frame) {
    try {
      setLoadingAction(true);
      const payload = { itemId: frame.id, price: frame.price ?? 100, userId: user?.id || user?._id };
      const res = await api.post('/user/purchase', payload);

      if (res?.data) {
        const nextUser = { ...res.data };
        nextUser.profile = nextUser.profile || {};
        nextUser.profile.inventory = nextUser.profile.inventory || [];

        const prevInv = (user?.profile?.inventory) || [];
        const ids = new Set(nextUser.profile.inventory.map(i => i.id));
        prevInv.forEach(i => { if (!ids.has(i.id)) nextUser.profile.inventory.push(i); });

        if (!nextUser.profile.inventory.some(i => i.id === frame.id)) {
          nextUser.profile.inventory.push({ id: frame.id, owned: true, acquiredAt: new Date() });
        }

        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
      } else {
        setUser(prev => {
          const next = { ...prev };
          next.profile = next.profile || {};
          next.profile.inventory = next.profile.inventory || [];
          if (!next.profile.inventory.some(i => i.id === frame.id)) {
            next.profile.inventory.push({ id: frame.id, owned: true, acquiredAt: Date.now() });
            next.balance = (next.balance ?? 0) - (frame.price ?? 100);
          }
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error('purchase failed', err);
      alert(err?.response?.data?.message || 'Erro ao comprar. Ver consola.');
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleEquip(frame) {
    try {
      setLoadingAction(true);
      const currentlyEquipped = equipped?.frame === frame.id;
      const payload = { type: 'frame', itemId: currentlyEquipped ? null : frame.id, userId: user?.id || user?._id };
      const res = await api.post('/user/equip', payload);

      if (res?.data) {
        const nextUser = { ...res.data };
        nextUser.profile = nextUser.profile || {};
        nextUser.profile.inventory = nextUser.profile.inventory || [];

        const prevInv = (user?.profile?.inventory) || [];
        const ids = new Set(nextUser.profile.inventory.map(i => i.id));
        prevInv.forEach(i => { if (!ids.has(i.id)) nextUser.profile.inventory.push(i); });

        if (!currentlyEquipped && frame.source === 'shop' && !nextUser.profile.inventory.some(i => i.id === frame.id)) {
          nextUser.profile.inventory.push({ id: frame.id, owned: true, acquiredAt: new Date() });
        }

        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
      } else {
        setUser(prev => {
          const next = { ...prev };
          next.profile = next.profile || {};
          next.profile.equipped = next.profile.equipped || {};
          next.profile.equipped.frame = currentlyEquipped ? null : frame.id;
          next.profile.inventory = next.profile.inventory || [];
          if (!currentlyEquipped && frame.source === 'shop' && !next.profile.inventory.some(i => i.id === frame.id)) {
            next.profile.inventory.push({ id: frame.id, owned: true, acquiredAt: Date.now() });
          }
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error('equip failed', err);
      alert(err?.response?.data?.message || 'Erro ao equipar. Ver consola.');
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div className="perfil-wrap container">
      <div className="profile-top">
        <div className="avatar-area" onClick={() => setOpenPicker(true)}>
          <div className="avatar-frame">
            {equipped.frame ? (
              <img className={`frame-img ${frameClass(equipped.frame)}`} src={getFrameImage(equipped.frame)} alt="frame" />
            ) : null}
            <div className="avatar-img">
              {user?.profile?.avatarUrl ? (
                <img
                  className="uploaded-avatar"
                  src={`${api.defaults.baseURL?.replace(/\/$/,'') || 'http://localhost:3000'}${user.profile?.avatarUrl ?? ''}${user.profile?.avatarUrl ? `?t=${Date.now()}` : ''}`}
                  alt="avatar"
                />
              ) : (equipped.avatar ? (
                <img src={catalog.find(c => c.id === equipped.avatar)?.image} alt="avatar" />
              ) : (
                <UserIcon size={64} />
              ))}
            </div>
          </div>
          <div className="avatar-hint">Clique para escolher avatar</div>
        </div>

        <div className="profile-info">
          <h2 className="profile-name">{user?.name ?? 'Usuário'}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats">
            <div>Saldo: <strong>{fmtCurrency(user?.balance ?? user?.saldo ?? 0)}</strong></div>
            <div>XP: <strong>{fmtNumber(user?.xp ?? 0)}</strong></div>
            <div>Nível: <strong>{fmtNumber(user?.level ?? 1)}</strong></div>
          </div>
        </div>
      </div>

      <section className="inventory-section">
        <h3>Meu Inventário — Aros (frames)</h3>
        <div className="inventory-grid">
          {framesCatalog.map(frame => {
            const owned = isOwned(frame.id); 
            const equippedClass = equipped?.frame === frame.id ? 'equipped' : '';
            const unlockedByRule = isUnlockedByRules(frame);
            const isAvailable = owned || unlockedByRule;

            return (
              <div key={frame.id} className={`inv-item ${equippedClass} ${isAvailable ? 'unlocked' : 'locked'}`}>
                <div className="inv-thumb">
                  <img src={frame.image} alt={frame.name} className={`inv-frame-thumb ${frameClass(frame.id)}`} />
                </div>

                <div className="inv-meta">
                  <div className="inv-name">{frame.name}</div>
                  <div className="inv-source">
                    {frame.source === 'pass' ? (frame.requiredPass ? `Passe ${frame.requiredPass.passName} • Nível ${frame.requiredPass.level}` : 'Passe') :
                      frame.source === 'shop' ? `Loja • ${fmtCurrency(frame.price)}` : 'Gratuito'}
                  </div>
                </div>

                <div className="inv-badge">
                  {isAvailable ? (
                    <span className="badge-unlocked">{owned ? 'Desbloqueado' : (frame.source === 'pass' ? `Desbloqueado (Passe)` : 'Desbloqueado')}</span>
                  ) : (
                    <span className="badge-locked">{frame.source === 'shop' ? `Comprar R$ ${frame.price}` : 'Bloqueado'}</span>
                  )}
                </div>

                <div className="inv-actions">
                  {isAvailable ? (
                    <button onClick={() => handleEquip(frame)} disabled={loadingAction} className="btn-primary">
                      {equipped?.frame === frame.id ? 'Desequipar' : 'Equipar'}
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={() => frame.source === 'shop' ? handlePurchase(frame) : alert('Se desbloqueia no Passe')} disabled={loadingAction}>
                      {frame.source === 'shop' ? `Comprar R$ ${frame.price}` : 'Bloqueado'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {framesCatalog.length === 0 && <div className="inv-empty">Nenhum frame disponível.</div>}
        </div>
      </section>

      {openPicker && (
        <div className="modal-backdrop" onClick={() => setOpenPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h4>Subir Avatar</h4>
              <button className="close" onClick={() => setOpenPicker(false)}>✕</button>
            </header>

            <div>
              <AvatarUploader
                user={user}
                onUpdated={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }}
                onClose={() => setOpenPicker(false)}
              />

              <div style={{ marginTop: 12 }}>
                <h5>Últimas fotos</h5>
                <div style={{ display:'flex', gap:8 }}>
                  {(user?.profile?.history ?? [user?.profile?.avatarUrl]).filter(Boolean).map((h, idx) => (
                    <img key={idx} src={`${api.defaults.baseURL?.replace(/\/$/,'') || 'http://localhost:3000'}${h}`} alt="prev" style={{ width:64, height:64, objectFit:'cover', borderRadius:8, cursor:'pointer' }} onClick={() => {
                      setUser(prev => {
                        const next = { ...prev };
                        next.profile = next.profile || {};
                        next.profile.avatarUrl = h;
                        localStorage.setItem('user', JSON.stringify(next));
                        return next;
                      });
                      setOpenPicker(false);
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}