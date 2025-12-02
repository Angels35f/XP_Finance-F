import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../contexts/AuthContext'; 
import { achievementsData } from '../components/AchievementsData'; 
import { FaStar, FaLock } from 'react-icons/fa'; 
import '../styles/Conquistas.css'; 
import api from '../services/api';

export default function Conquistas() {
  const { user, fetchUserData } = useContext(UserContext);
  const [selectedAch, setSelectedAch] = useState(null);

  useEffect(() => {
    async function reportAndReload() {
      try {
        if (user?.id || user?._id) {
          await api.post('/gamification/visit', { userId: user?.id || user?._id, section: 'achievements' });
          if (typeof fetchUserData === 'function') await fetchUserData();
        }
      } catch (e) {
      }
    }
    reportAndReload();
  }, [user?.id, user?._id, fetchUserData]);

  const userUnlocked = user?.achievements || [];

  const handleClick = (ach) => {
    setSelectedAch(ach);
  };

  const closeModal = () => {
    setSelectedAch(null);
  };

  return (
    <div className="achievements-page">
      <header className="page-header">
        <h1>Galeria de Conquistas</h1>
        <p>Veja as medalhas que você já ganhou e as que ainda pode desbloquear.</p>
      </header>

      <div className="achievements-grid">
        {achievementsData.map((ach) => {
          const isUnlocked = userUnlocked.includes(ach.id);
          
          return (
            <div 
              key={ach.id} 
              className={`achievement-card ${isUnlocked ? ach.rarity : 'locked'}`}
              onClick={() => handleClick(ach)}
            >
              <div className="star-container">
                <FaStar className="star-icon" />
                {!isUnlocked && <FaLock className="lock-overlay" />}
              </div>
              <span className="achievement-title">{ach.title}</span>
            </div>
          );
        })}
      </div>

      {selectedAch && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="achievement-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>X</button>
            
            <div className={`modal-icon-large ${userUnlocked.includes(selectedAch.id) ? selectedAch.rarity : 'locked'}`}>
               <FaStar />
            </div>

            <h2>{selectedAch.title}</h2>
            
            <div className="status-badge">
                {userUnlocked.includes(selectedAch.id) 
                  ? <span className="badge-unlocked">Desbloqueado</span>
                  : <span className="badge-locked">Bloqueado</span>
                }
            </div>

            <p className="modal-desc">{selectedAch.desc}</p>
            
            <p className="rarity-label">
                Raridade: <span className={selectedAch.rarity}>{translateRarity(selectedAch.rarity)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function translateRarity(rarity) {
    const map = {
        common: 'Comum',
        rare: 'Raro',
        epic: 'Épico',
        legendary: 'Lendário',
        mythic: 'Mítico'
    };
    return map[rarity] || rarity;
}