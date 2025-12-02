import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../contexts/AuthContext';
import { Home, Trophy, Ticket, User, LogOut } from 'lucide-react';
import { FaFire } from 'react-icons/fa';
import '../styles/Header.css';
import api from '../services/api';

export default function Header() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();

  function resolveFrameSrc(frameId) {
    if (!frameId) return null;
    if (String(frameId).startsWith('/')) return frameId;
    const m = String(frameId).match(/^frame_(\d{1,2})$/);
    if (m) return `/assets/${m[1]}.png`;
    return `/assets/frames/${frameId.replace(/^frame_/, '')}.png`;
  }

  const GOOD_FRAMES = new Set(['frame_4', 'frame_5', 'frame_6', 'frame_7', 'frame_8', 'frame_10']);
  const CUSTOM_FRAMES = ['frame_1', 'frame_2', 'frame_3', 'frame_9', 'frame_11', 'frame_12'];
  function frameClass(frameId) {
    if (!frameId) return '';
    if (GOOD_FRAMES.has(frameId)) return 'frame-group-good';
    const idx = CUSTOM_FRAMES.indexOf(frameId);
    if (idx >= 0) return `frame-group-custom frame-custom-${idx + 1}`;
    const m = String(frameId).match(/^frame_(\d{1,2})$/);
    if (m) return GOOD_FRAMES.has(`frame_${m[1]}`) ? 'frame-group-good' : `frame-group-custom`;
    return '';
  }

  if (location.pathname === '/') {
    return null;
  }

  function handleLogout() {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  }

  const frameSrc = resolveFrameSrc(user?.profile?.equipped?.frame);

  return (
    <header className="app-header bg-gray-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex-shrink-0 flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-purple-400 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <img src="/assets/icono.png" alt="icono" style={{ height: '40px' }} />                  
              </div>
              XP Finance
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <NavLink to="/dashboard" icon={<Home size={18} />} text="Início" />
            <NavLink to="/conquistas" icon={<Trophy size={18} />} text="Conquistas" />
            <NavLink to="/passe" icon={<Ticket size={18} />} text="Passe de Batalha" />
          </nav>

          <div className="flex items-center gap-4 user-area">
            <div className="flex items-center gap-3">
              <div className="streak-badge" title={`Racha de ${user?.loginStreak || 0} dias`} style={{display: 'inline-flex', alignItems: 'center'}}>
                <FaFire size={14} className="streak-fire" />
                <span className="streak-count">{user?.loginStreak || 0}</span>
              </div>

              <span className="text-sm text-gray-300 truncate hidden md:inline-block" style={{maxWidth: 160}}>
                {user?.name || user?.email}
              </span>

              <Link to="/perfil" className="relative group">
                 <div className={`header-avatar ${frameClass(user?.profile?.equipped?.frame)}`} >
                   <div className="header-avatar-inner">
                     {user?.profile?.avatarUrl ? (
                       <img
                         className="header-avatar-img"
                         src={`${api.defaults.baseURL?.replace(/\/$/,'') || 'http://localhost:3000'}${user.profile.avatarUrl}?t=${Date.now()}`}
                         alt="avatar"
                       />
                     ) : (
                       <User size={20} />
                     )}
                   </div>
                   {frameSrc ? (
                     <img src={frameSrc} alt="frame" className={`header-frame ${frameClass(user?.profile?.equipped?.frame)}`} />
                   ) : null}
                 </div>
               </Link>

              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 ml-2">
                <LogOut size={20} />
              </button>
            </div>
           </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 flex justify-around">
        <MobileNavLink to="/dashboard" icon={<Home size={20} />} />
        <MobileNavLink to="/conquistas" icon={<Trophy size={20} />} />
        <MobileNavLink to="/passe" icon={<Ticket size={20} />} />
        <MobileNavLink to="/perfil" icon={<User size={20} />} />
      </div>
    </header>
  );
}

function NavLink({ to, icon, text }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition
        ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
      `}
    >
      {icon}
      {text}
    </Link>
  );
}

function MobileNavLink({ to, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`p-3 rounded-full ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
    >
      {icon}
    </Link>
  );
}