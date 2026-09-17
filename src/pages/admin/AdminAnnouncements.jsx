import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = { title: '', content: '', order_index: 0 };

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('order_index');
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.from('announcements').insert({
      title: form.title || null,
      content: form.content,
      order_index: Number(form.order_index) || 0,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm(emptyForm);
    load();
  };

  const toggleActive = async (item) => {
    await supabase.from('announcements').update({ is_active: !item.is_active }).eq('id', item.id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu bloknotu silmek istediğinize emin misiniz?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  };

  return (
    <div className="page">
      <h1>📌 Bloknotlar / Duyurular</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Anasayfanın üstünde ve "Yarışmayı Öğrenelim" sayfasında görünür.
      </p>

      <form onSubmit={handleAdd} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <h2>Yeni bloknot ekle</h2>
        <label className="field">
          Başlık (opsiyonel)
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="field">
          İçerik
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </label>
        <label className="field">
          Sıra numarası (küçük sayı önce görünür)
          <input
            type="number"
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: e.target.value })}
          />
        </label>
        {error && <p className="status-banner is-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Ekleniyor...' : 'Bloknotu ekle'}
        </button>
      </form>

      <h2 style={{ marginTop: '2rem' }}>Mevcut bloknotlar ({items.length})</h2>
      {items.map((item) => (
        <div className="list-row" key={item.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{item.title || '(başlıksız)'} · #{item.order_index}</strong>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => toggleActive(item)}>
                {item.is_active ? 'Gizle' : 'Göster'}
              </button>
              <button className="btn btn-ghost" onClick={() => handleDelete(item.id)}>
                Sil
              </button>
            </div>
          </div>
          <p className="muted" style={{ marginTop: '0.5rem' }}>{item.content}</p>
        </div>
      ))}
    </div>
  );
}
