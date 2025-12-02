import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserContext } from '../contexts/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      let response;
      if (isLogin) {
        response = await api.post('/auth/signin', { email, password });
      } else {
        response = await api.post('/auth/signup', { email, password, name, balance: 0 });
      }

      const userData = response.data.user || response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');

    } catch (error) {
      const mensagemErro = error.response?.data?.error || error.response?.data?.message || error.message || "Erro desconhecido";
      alert(`SYSTEM ERROR: ${mensagemErro}`);
    }
  }

  return (
    <div className="login-container">
      <div className="login-split">
        
        <aside className="login-illustration">
          <div className="illustration-overlay">
            <h2 className="ill-title">ELEVE SUAS FINANÇAS</h2>
            <p className="ill-sub">Bem-vindo ao XP finance. Sua jornada financeira começa aqui.</p>
          </div>
        </aside>
        
        <main className="login-card">
          <h1>{isLogin ? 'ACESSAR CONTA' : 'NOVA CONTA'}</h1>
          
          <form onSubmit={handleSubmit} className="form-group">
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Nome de usuário" 
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}
            
            <input 
              type="email" 
              placeholder="seu@email.com"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            
            <input 
              type="password" 
              placeholder="Senha" 
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            
            <button type="submit" className="btn-primary">
              {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
            </button>
          </form>
          
          <div className="toggle-text">
            <span>{isLogin ? 'Não tem conta?' : 'Já tem conta?'}</span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="btn-link"
              type="button"
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}