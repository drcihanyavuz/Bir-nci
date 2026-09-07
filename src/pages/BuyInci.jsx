import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const resultMessages = {
  success: 'Ödemeniz başarıyla tamamlandı, inci bakiyeniz güncellendi!',
  failed: 'Ödeme tamamlanamadı. Lütfen tekrar deneyin.',
  error: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
};

export default function BuyInci() {
  const [searchParams] = useSearchParams();
  const resultStatus = searchParams.get('status');

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [buyer, setBuyer] = useState({ identityNumber: '', gsmNumber: '', city: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('inci_packages')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        setPackages(data ?? []);
        setLoading(false);
      });
  }, []);

  const handleBuyerChange = (field) => (e) =>
    setBuyer({ ...buyer, [field]: e.target.value });

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke('create-iyzico-checkout', {
      body: { package_id: selectedPackage.id, buyer },
    });

    setSubmitting(false);

    if (error || data?.error) {
      setError(data?.error || error.message);
      return;
    }

    window.location.href = data.paymentPageUrl;
  };

  return (
    <div className="page">
      <h1>İnci satın al</h1>

      {resultStatus && (
        <p className={`status-banner ${resultStatus === 'success' ? 'is-success' : 'is-error'}`}>
          {resultMessages[resultStatus] ?? ''}
        </p>
      )}

      {loading && <p className="muted">Yükleniyor...</p>}

      {!loading && !selectedPackage && (
        <>
          {packages.length === 0 && (
            <div className="empty-state" style={{ marginTop: '1.5rem' }}>
              Şu an satışta bir paket yok.
            </div>
          )}
          {packages.map((pkg) => (
            <div className="list-row" key={pkg.id}>
              <div>
                <div className="list-row-title">{pkg.name}</div>
                <div className="list-row-meta">
                  {pkg.inci_amount} inci · {pkg.price_try} TL
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setSelectedPackage(pkg)}>
                Satın al
              </button>
            </div>
          ))}
        </>
      )}

      {selectedPackage && (
        <form onSubmit={handleConfirm} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
          <h2>
            {selectedPackage.name} · <span className="gold-text">{selectedPackage.price_try} TL</span>
          </h2>
          <p className="muted">
            Ödemeye geçmeden önce iyzico'nun zorunlu tuttuğu birkaç bilgiye ihtiyacımız var:
          </p>

          <label className="field">
            TC Kimlik No
            <input value={buyer.identityNumber} onChange={handleBuyerChange('identityNumber')} required />
          </label>

          <label className="field">
            Telefon (GSM)
            <input value={buyer.gsmNumber} onChange={handleBuyerChange('gsmNumber')} required />
          </label>

          <label className="field">
            Şehir
            <input value={buyer.city} onChange={handleBuyerChange('city')} required />
          </label>

          <label className="field">
            Adres
            <input value={buyer.address} onChange={handleBuyerChange('address')} required />
          </label>

          {error && <p className="status-banner is-error">{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Yönlendiriliyor...' : 'Ödemeye geç'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedPackage(null)}>
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
