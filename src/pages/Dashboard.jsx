import { useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { UserContext } from '../contexts/AuthContext';
import { ProgressBar } from '../components/ProgressBar';
import { ACHIEVEMENTS } from '../components/AchievementsData';
import { fmtNumber, fmtCurrency } from '../utils/format';
import '../styles/Dashboard.css';

const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard() {
  const { user, fetchUserData, setUser } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  // transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txError, setTxError] = useState(null);

  // deposit
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState(null);

  const [latestAchievements, setLatestAchievements] = useState([]);

  // Calculadora de XP por nivel 
  const xpTotal = Number(user?.xp ?? 0);
  const level = Number(user?.level ?? 1);
  const baseXpForLevel = (lvl) => 100 * Math.pow(lvl - 1, 2);
  const nextXpForLevel = (lvl) => 100 * Math.pow(lvl, 2);
  const base = baseXpForLevel(level);
  const next = nextXpForLevel(level);
  const xpInLevel = Math.max(0, xpTotal - base);
  const xpNeeded = Math.max(0, next - xpTotal);
  const progress = next > base ? Math.min(1, xpInLevel / (next - base)) : 0;

  useEffect(() => {
    fetchUserData();
    if (user?._id) {
      fetchLatestAchievements();
      fetchStatement(false);
    }
  }, [user?._id]);

  async function fetchStatement(openModal = true) {
    try {
      const userId = user._id || user.id;
      const res = await api.get(`/bank/statement/${userId}`);
      setTransactions(res.data || []); 
      
      if (openModal) {
        setShowTransactions(true);
      }
    } catch (err) {
      console.error(err);
      if (openModal) alert('No se pudo obtener el extrato.');
    }
  } 

  // fetchLatestAchievements: intenta usar timestamps si el backend los provee, sino usa el order array
  async function fetchLatestAchievements() {
    try {
      const userId = user._id || user.id;
      const res = await api.get(`/gamification/profile/${userId}`);
      const data = res.data || {};
      let ach = data.achievements || data.conquistas || [];

      const normalize = (item) => {
        if (!item && item !== 0) return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        return String(item.id ?? item.key ?? item.code ?? item.name ?? JSON.stringify(item));
      };

      if (Array.isArray(ach)) {
        if (ach.length > 0 && typeof ach[0] === 'object') {
          const sorted = ach.slice().sort((a,b) => {
            const ta = new Date(a.unlockedAt || a.addedAt || a.when || 0).getTime();
            const tb = new Date(b.unlockedAt || b.addedAt || b.when || 0).getTime();
            return tb - ta;
          });
          ach = sorted.map(normalize);
        } else {
          ach = ach.map(normalize);
        }
      } else {
        ach = [];
      }

      if ((!ach || ach.length === 0) && Array.isArray(user?.achievements)) {
        ach = user.achievements.map(normalize);
      }

      const unique = Array.from(new Set(ach.filter(Boolean)));
      setLatestAchievements(unique.slice(-3).reverse());
    } catch (err) {
      console.error('No se pudo obter conquistas', err);
      if (Array.isArray(user?.achievements)) {
        const normalized = user.achievements.map(item => {
          if (typeof item === 'string' || typeof item === 'number') return String(item);
          return String(item.id ?? item.key ?? item.code ?? item.name ?? JSON.stringify(item));
        });
        setLatestAchievements(Array.from(new Set(normalized)).slice(-3).reverse());
      }
    }
  }

  function openTransfer() {
    setTxError(null);
    setRecipient('');
    setAmount('');
    setTransferOpen(true);
  }

  async function submitTransfer(e) {
    e.preventDefault();
    try {
      const fromUserId = user._id || user.id;
      const payload = { fromUserId, toIdentifier: recipient, amount: Number(amount) };
      
      console.log("Enviando transfer:", payload); 
      
      const res = await api.post('/bank/transfer', payload);
      await fetchUserData();
      await fetchStatement();
      await fetchLatestAchievements();
      setTransferOpen(false);
      alert('Transferencia realizada.');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error';
      setTxError(msg);
    }
  }

  // Deposit handlers 
  function openDeposit() {
    setDepositError(null);
    setDepositAmount('');
    setDepositOpen(true);
  }

  async function submitDeposit(e) {
    e.preventDefault();
    if (!user) return alert('Usuário não autenticado.');
    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) return setDepositError('Informe um valor válido.');

    try {
      const userId = user._id || user.id;
      const res = await api.post('/bank/deposit', { userId, amount: parsed });
      const newBalance = res.data?.balance;
      if (newBalance != null) {
        const updatedUser = { ...user, balance: newBalance };
        try {
          const g = await api.get(`/gamification/profile/${userId}`);
          updatedUser.xp = g.data?.xp ?? updatedUser.xp;
          updatedUser.level = g.data?.level ?? updatedUser.level;
          updatedUser.achievements = g.data?.achievements ?? updatedUser.achievements;
        } catch (err) {
          console.warn('No se pudo obtener gamification profile', err?.message || err);
        }
        setUser(updatedUser);
      } else {
        await fetchUserData();
      }

      await fetchStatement();
      await fetchLatestAchievements();

      setDepositOpen(false);
      setDepositAmount('');
      alert('Depósito realizado.');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erro no depósito';
      setDepositError(msg);
    }
  }

  if (!user) return <div className="loading-screen">Carregando...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="welcome-text">Olá, {user.name || user.email} </h1>
          <p className="welcome-subtext">Bem-vindo ao XP Finance</p>
        </div>
        <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }} className="btn-logout-dash">Sair</button>
      </header>

      <main className="dashboard-grid">
        <section className="financial-section">
          <div className="balance-card">
            <p className="balance-label">Saldo Disponível</p>
            <h2 className="balance-amount">{currencyFmt.format(user.balance ?? user.saldo ?? 0)}</h2>

            <div className="action-buttons">
                <button className="btn-action primary" onClick={openDeposit}>Fazer Depósito</button>
                <button className="btn-action secondary" onClick={fetchStatement}>Ver Extrato</button>
                <button className="btn-action secondary" onClick={openTransfer}>Transferir</button>
            </div>
          </div>

          <div className="transactions-preview">
  <h3>Últimas Atividades</h3>
  
  {transactions.length === 0 ? (
    <p className="empty-state">Nenhuma atividade recente.</p>
  ) : (
    <ul className="preview-list" style={{ listStyle: 'none', padding: 0 }}>
      {transactions.slice(0, 3).map((tx) => {
  const meId = user._id || user.id;
  const type = (tx.type || '').toUpperCase();
  const isDeposit = type === 'DEPOSIT';
  const isWithdraw = type === 'WITHDRAW';
  const isTransfer = type === 'TRANSFER';

  let title = '';
  let counterpart = '';

  const possibleNames = [
    tx.toUser?.name,
    tx.toUserName,
    tx.to?.name,
    tx.toName,
    tx.toIdentifier,
    tx.toAccountId,
    tx.to,
    tx.counterpartyName,
    tx.toUser?.email,
    tx.fromUser?.name
  ];

  counterpart = possibleNames.find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';

  if (!counterpart && isTransfer) {
    const otherSide = possibleNames.concat([
      tx.fromUser?.name,
      tx.fromIdentifier,
      tx.fromAccountId,
      tx.from
    ]);
    counterpart = otherSide.find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';
  }

  function isObjectIdLike(s){
    return typeof s === 'string' && /^[0-9a-fA-F]{20,}$/.test(s); 
  }
  if (isObjectIdLike(counterpart)) {
    const s = String(counterpart);
    counterpart = `${s.slice(0,8)}…${s.slice(-4)}`;
  }

  if (typeof counterpart === 'string' && counterpart.length > 30) {
    counterpart = counterpart.slice(0, 26) + '…';
  }

  if (isDeposit) {
    title = 'Depósito';
  } else if (isWithdraw) {
    title = 'Saque';
  } else if (isTransfer) {
    if (tx.fromAccountId === meId || tx.from === meId || tx.fromUser?.id === meId) {
      title = 'Enviou Transferência';
    } else {
      title = 'Recebeu Transferência';
    }
  } else {
    title = tx.description || type || 'Transação';
  }

  const dateStr = new Date(tx.timestamp || tx.createdAt || tx.date).toLocaleDateString();
  const amount = Number(tx.amount || 0);
  const positive = isDeposit || (isTransfer && (tx.toAccountId === meId || tx.to === meId || tx.toUser?.id === meId));
  const amountStr = currencyFmt.format(Math.abs(amount)).replace(/\s/g, '\u00A0');

  return (
    <li key={tx._id || tx.id} className="tx-item" style={{marginBottom: 10}}>
      <div className="tx-left">
        <span style={{ fontWeight: 'bold', display: 'block' }}>
          {title}{counterpart ? ` — ${counterpart}` : ''}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{dateStr}</span>
      </div>

      <div className="tx-right">
        <div className="tx-amount" style={{fontWeight: 'bold', color: positive ? '#4caf50' : '#f44336'}}>
          {positive ? '+' : '-'} {amountStr}
        </div>
      </div>
    </li>
  );
})}
    </ul>
  )}
</div>
        </section>

        <aside className="gamification-section">
          <div className="level-card">
            <div className="level-header">
                <h3 className="card-title">Nível do Jogador</h3>
                <span className="level-badge">Lvl {fmtNumber(user.level || 1)}</span>
            </div>

            <div className="xp-container">
              <ProgressBar currentXp={xpInLevel} maxXp={next - base} percent={progress * 100} />
              <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#d6d6d8' }}>
                XP total: {fmtNumber(xpTotal)} · {fmtNumber(xpInLevel)} / {fmtNumber(next - base)} XP no nível
              </div>
            </div>

            <div className="achievements-area">
  <div className="text-xs text-gray-400 uppercase">Últimas Conquistas</div>
  {latestAchievements.length === 0 ? (
    <div className="text-sm text-gray-300">Nenhuma conquista ainda</div>
  ) : (
    <ul className="ach-list" style={{ marginTop: 8, paddingLeft: 12 }}>
      {latestAchievements.map((aid) => {
        const meta = ACHIEVEMENTS[aid];
        const label = meta?.title || String(aid);
        return (
          <li key={String(aid)} style={{ fontSize: '0.95rem', color: '#e6e6e9' }}>
            {label}
          </li>
        );
      })}
    </ul>
  )}
</div>
          </div>
        </aside>
      </main>

      {showTransactions && (
        <div className="modal-backdrop" onClick={() => setShowTransactions(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Extrato - Últimos movimentos</h3>
            <button className="modal-close" onClick={() => setShowTransactions(false)}>Fechar</button>
            <ul className="tx-list">
              {transactions.length === 0 && <li>Nenhuma transação</li>}
              {transactions.map(tx => (
                <li key={tx._id || tx.id} className={`tx-item ${tx.type || ''}`}>
                  <div className="tx-left">
                    <div className="tx-type">{tx.type}</div>
                    <div className="tx-desc">{tx.description || (tx.fromAccountId ? 'Transfer' : 'Deposit')}</div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount">{currencyFmt.format(Number(tx.amount || 0))}</div>
                    <div className="tx-date">{new Date(tx.timestamp || tx.createdAt || tx.date).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {transferOpen && (
        <div className="modal-backdrop" onClick={() => setTransferOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Transferir</h3>
            <button className="modal-close" onClick={() => setTransferOpen(false)}>Fechar</button>

            <form onSubmit={submitTransfer} className="transfer-form">
              <label>Destinatário (nome ou email)</label>
              <input value={recipient} onChange={e => setRecipient(e.target.value)} required />

              <label>Valor</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} required type="number" step="0.01" min="0.01" />

              {txError && <div className="form-error">{txError}</div>}

              <div className="transfer-actions">
                <button type="button" className="btn-secondary" onClick={() => setTransferOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {depositOpen && (
        <div className="modal-backdrop" onClick={() => setDepositOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Fazer Depósito</h3>
            <button className="modal-close" onClick={() => setDepositOpen(false)}>Fechar</button>

            <form onSubmit={submitDeposit} className="transfer-form">
              <label>Valor</label>
              <input
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                required
                type="number"
                step="0.01"
                min="0.01"
              />

              {depositError && <div className="form-error">{depositError}</div>}

              <div className="transfer-actions">
                <button type="button" className="btn-secondary" onClick={() => setDepositOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Depositar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}