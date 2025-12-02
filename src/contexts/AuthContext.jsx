import { createContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

export const UserContext = createContext({});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const fetchingRef = useRef(false);         
  const lastFetchedRef = useRef(null);       

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  async function fetchUserData() {
    if (!user?._id && !user?.id) return;
    if (fetchingRef.current) return;         

    fetchingRef.current = true;
    try {
      const userId = user._id || user.id;

      const [balanceRes, gamifRes] = await Promise.all([
        api.get(`/bank/balance/${userId}`),
        api.get(`/gamification/profile/${userId}`),
      ]);

      const balance = balanceRes.data?.balance || 0;
      const gamifData = gamifRes.data || {};

      const updated = {
        ...user,
        balance,
        xp: gamifData.xp ?? user?.xp ?? 0,
        level: gamifData.level ?? user?.level ?? 1,
        achievements: gamifData.achievements ?? user?.achievements ?? [],
      };

      const last = lastFetchedRef.current;
      const changed = !last || (
        last.balance !== updated.balance ||
        last.xp !== updated.xp ||
        last.level !== updated.level ||
        JSON.stringify(last.achievements) !== JSON.stringify(updated.achievements)
      );

      if (changed) {
        setUser(prev => {
          const newUser = { ...prev, ...updated };
          localStorage.setItem('user', JSON.stringify(newUser));
          return newUser;
        });
        lastFetchedRef.current = updated;
      }
    } catch (error) {
      console.error('Erro ao atualizar dados', error);
      const status = error?.response?.status;
      if (status === 404) {
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/';
      }
    } finally {
      fetchingRef.current = false;
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
}