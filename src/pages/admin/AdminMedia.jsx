import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const PLACEMENTS = [
  { value: 'landing', label: 'Anasayfa (giriş ekranı)' },
  { value: 'learn_more', label: 'Yarışmayı Öğrenelim sayfası' },
];

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function AdminMedia() {
  const [placement, setPlacement] = useState('landing');
  const [current, setCurrent] = useState({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await supabase.from('site_media').select('*');
    const map = {};
    (data ?? []).forEach((row) => {
      map[row.placement] = row.media_url;
    });
    setCurrent(map);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    const fileName = `site-media-${placement}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('question-images').upload(fileName, file);

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);

    const { error: saveError } = await supabase
      .from('site_media')
      .upsert({ placement, media_url: data.publicUrl, updated_at: new Date().toISOString() });

    setUploading(false);

    if (saveError) {
      setMessage(saveError.message);
      return;
    }

    setMessage('Görsel kaydedildi!');
    load();
  };

  const handleRemove = async () => {
    setMessage('');
    await supabase.from('site_media').upsert({ placement, media_url: null, updated_at: new Date().toISOString() });
    load();
  };

  return (
    <div className="page">
      <h1>🖼️ Görsel Ekle</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Belirli bir sayfaya görsel ya da video ekleyin.
      </p>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <label className="field">
          Hangi sayfaya eklensin?
          <select value={placement} onChange={(e) => setPlacement(e.target.value)}>
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {current[placement] && (
          <div style={{ marginTop: '1rem' }}>
            <p className="muted">Şu anki görsel:</p>
            {isVideoUrl(current[placement]) ? (
              <video src={current[placement]} style={{ maxWidth: '260px', borderRadius: '8px' }} controls />
            ) : (
              <img src={current[placement]} alt="" style={{ maxWidth: '260px', borderRadius: '8px' }} />
            )}
            <div>
              <button className="btn btn-ghost" onClick={handleRemove} style={{ marginTop: '0.5rem' }}>
                Kaldır
              </button>
            </div>
          </div>
        )}

        <label className="field" style={{ marginTop: '1.5rem' }}>
          Yeni görsel/video yükle
          <input type="file" accept="image/*,video/*" onChange={handleUpload} disabled={uploading} />
        </label>
        {uploading && <p className="muted">Yükleniyor...</p>}
        {message && <p className="status-banner">{message}</p>}
      </div>
    </div>
  );
}
