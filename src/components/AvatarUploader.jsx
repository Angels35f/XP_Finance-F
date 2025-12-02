import React, { useState, useCallback, useContext } from 'react';
import Cropper from 'react-easy-crop';
import { UserContext } from '../contexts/AuthContext';
import api from '../services/api';

const MIN_DIM = 200;
const MAX_SIZE = 2 * 1024 * 1024; 

// cria Image element
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = url;
  });
}

// Tem em conta os pixeis para lembrar
async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { width, height, x, y } = croppedAreaPixels;

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  ctx.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function AvatarUploader({ user, onUpdated, onClose }) {
  const { setUser } = useContext(UserContext);
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  function handleFileChange(e) {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) return setError('Arquivo muito grande (max 2MB)');
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_DIM || img.height < MIN_DIM) {
        URL.revokeObjectURL(url);
        return setError(`A imagem deve ter pelo menos ${MIN_DIM}px`);
      }
      setFile(f);
      setImageSrc(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Arquivo inválido');
    };
    img.src = url;
  }

  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onUpload = useCallback(async () => {
    if (!file || !imageSrc) return setError('Escolha um arquivo');
    if (!croppedAreaPixels) return setError('Ajuste o recorte antes de enviar');
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fd = new FormData();
      fd.append('file', blob, file.name || 'avatar.jpg');

      const res = await api.post(`/users/${user._id}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const returnedUser = res?.data?.user;
      const avatarUrl = res?.data?.avatarUrl;
      if (returnedUser) {
        setUser(returnedUser);
        localStorage.setItem('user', JSON.stringify(returnedUser));
        onUpdated && onUpdated(returnedUser);
      } else if (avatarUrl) {
        const updatedUser = { ...user, profile: { ...(user.profile || {}), avatarUrl } };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdated && onUpdated(updatedUser);
      }
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao subir');
    } finally {
      setLoading(false);
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    }
  }, [file, imageSrc, croppedAreaPixels, user, setUser, onUpdated, onClose]);

  return (
    <div style={{ padding: 12 }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {error && <div style={{ color: '#ffb4b4', marginTop: 8 }}>{error}</div>}

      {imageSrc ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ position: 'relative', width: 320, height: 320, background: '#222' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={false}
            />
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
            <label style={{ color:'#bbb' }}>Zoom</label>
            <input style={{ width: 160 }} type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
            <button onClick={onUpload} disabled={loading} className="btn-primary">{loading ? 'Enviando...' : 'Enviar'}</button>
            <button onClick={() => { onClose && onClose(); }} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}