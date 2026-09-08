import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPkg, setNewPkg] = useState({ name: '', inci_amount: '', price_try: '' });
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const { data } = await supabase.from('inci_packages').select('*').order('inci_amount');
    setPackages(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFieldChange = (id, field, value) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSave = async (pkg) => {
    setSavingId(pkg.id);
    await supabase
      .from('inci_packages')
      .update({
        name: pkg.name,
        inci_amount: Number(pkg.inci_amount),
        price_try: Number(pkg.price_try),
      })
      .eq('id', pkg.id);
    setSavingId(null);
    load();
  };

  const toggleActive = async (pkg) => {
    await supabase.from('inci_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    load();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.from('inci_packages').insert({
      name: newPkg.name,
      inci_amount: Number(newPkg.inci_amount),
      price_try: Number(newPkg.price_try),
      is_active: true,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setNewPkg({ name: '', inci_amount: '', price_try: '' });
    load();
  };

  if (loading) return <div className="page">Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>İnci paketleri</h1>

      <div style={{ marginTop: '1.5rem' }}>
        {packages.map((pkg) => (
          <div className="form-panel" key={pkg.id} style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <label className="field">
                Ad
                <input
                  value={pkg.name}
                  onChange={(e) => handleFieldChange(pkg.id, 'name', e.target.value)}
                />
              </label>
              <label className="field">
                İnci miktarı
                <input
                  type="number"
                  value={pkg.inci_amount}
                  onChange={(e) => handleFieldChange(pkg.id, 'inci_amount', e.target.value)}
                />
              </label>
              <label className="field">
                Fiyat (TL)
                <input
                  type="number"
                  value={pkg.price_try}
                  onChange={(e) => handleFieldChange(pkg.id, 'price_try', e.target.value)}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button className="btn btn-primary" onClick={() => handleSave(pkg)} disabled={savingId === pkg.id}>
                  Kaydet
                </button>
                <button className="btn btn-ghost" onClick={() => toggleActive(pkg)}>
                  {pkg.is_active ? 'Pasife al' : 'Aktif et'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="form-panel stack" style={{ marginTop: '2rem' }}>
        <h2>Yeni paket ekle</h2>
        <label className="field">
          Ad
          <input
            value={newPkg.name}
            onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
            placeholder="Örn: 500 İnci"
            required
          />
        </label>
        <label className="field">
          İnci miktarı
          <input
            type="number"
            value={newPkg.inci_amount}
            onChange={(e) => setNewPkg({ ...newPkg, inci_amount: e.target.value })}
            required
          />
        </label>
        <label className="field">
          Fiyat (TL)
          <input
            type="number"
            value={newPkg.price_try}
            onChange={(e) => setNewPkg({ ...newPkg, price_try: e.target.value })}
            required
          />
        </label>
        {error && <p className="status-banner is-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Paketi ekle
        </button>
      </form>
    </div>
  );
}
