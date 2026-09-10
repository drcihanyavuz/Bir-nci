import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const emptyQuestion = {
  text: '',
  image_url: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  time_limit_seconds: 15,
};

export default function AddQuestions() {
  const { competitionId } = useParams();
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startMessage, setStartMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lobbyVideoUrl, setLobbyVideoUrl] = useState('');
  const [uploadingLobbyVideo, setUploadingLobbyVideo] = useState(false);
  const [lobbyVideoMessage, setLobbyVideoMessage] = useState('');

  const loadCompetition = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('lobby_video_url')
      .eq('id', competitionId)
      .single();
    setLobbyVideoUrl(data?.lobby_video_url || '');
  };

  const handleLobbyVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLobbyVideo(true);
    setLobbyVideoMessage('');
    const fileName = `lobby-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('question-images').upload(fileName, file);

    if (uploadError) {
      setLobbyVideoMessage(uploadError.message);
      setUploadingLobbyVideo(false);
      return;
    }

    const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('competitions')
      .update({ lobby_video_url: data.publicUrl })
      .eq('id', competitionId);

    setUploadingLobbyVideo(false);

    if (updateError) {
      setLobbyVideoMessage(updateError.message);
      return;
    }

    setLobbyVideoUrl(data.publicUrl);
    setLobbyVideoMessage('Video kaydedildi!');
  };
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [competitionStatus, setCompetitionStatus] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from('question-images').upload(fileName, file);

    if (!error) {
      const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    } else {
      setError(error.message);
    }

    setUploadingImage(false);
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('competition_id', competitionId)
      .order('order_index');
    setExistingQuestions(data ?? []);

    const { data: comp } = await supabase
      .from('competitions')
      .select('status')
      .eq('id', competitionId)
      .single();
    setCompetitionStatus(comp?.status ?? null);
  };

  useEffect(() => {
    loadQuestions();
    loadCompetition();
  }, [competitionId]);

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleStartEdit = (q) => {
    setEditingId(q.id);
    setEditForm({ ...q });
  };

  const handleUpdateQuestion = async (id) => {
    const { error } = await supabase
      .from('questions')
      .update({
        text: editForm.text,
        option_a: editForm.option_a,
        option_b: editForm.option_b,
        option_c: editForm.option_c,
        option_d: editForm.option_d,
        correct_option: editForm.correct_option,
        time_limit_seconds: Number(editForm.time_limit_seconds),
      })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    loadQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    // Sıradaki soru numaralarında boşluk kalmasın diye yeniden sırala
    // (yarışma motoru order_index'in ardışık olmasına güveniyor).
    const { data: remaining } = await supabase
      .from('questions')
      .select('id, order_index')
      .eq('competition_id', competitionId)
      .order('order_index');

    for (let i = 0; i < (remaining ?? []).length; i++) {
      const q = remaining[i];
      if (q.order_index !== i + 1) {
        await supabase.from('questions').update({ order_index: i + 1 }).eq('id', q.id);
      }
    }

    loadQuestions();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const nextOrderIndex = existingQuestions.length + 1;

    const { error } = await supabase.from('questions').insert({
      competition_id: competitionId,
      order_index: nextOrderIndex,
      text: form.text,
      image_url: form.image_url || null,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      correct_option: form.correct_option,
      time_limit_seconds: Number(form.time_limit_seconds),
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm(emptyQuestion);
    loadQuestions();
  };

  const handleStart = async () => {
    setStartMessage('');
    setStarting(true);

    const { error } = await supabase.rpc('start_competition', {
      p_competition_id: competitionId,
    });

    setStarting(false);

    if (error) {
      setStartMessage(error.message);
      return;
    }

    setStartMessage('Yarışma başlatıldı!');
  };

  return (
    <div className="page">
      <h1>Soru ekle</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        {existingQuestions.length} soru eklendi.
      </p>

      {existingQuestions.length > 0 && (
        <div style={{ margin: '1.5rem 0' }}>
          {existingQuestions.map((q) => (
            <div key={q.id}>
              {editingId === q.id ? (
                <div className="form-panel stack" style={{ marginBottom: '0.75rem' }}>
                  <label className="field">
                    Soru metni
                    <textarea
                      value={editForm.text}
                      onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    />
                  </label>
                  {['a', 'b', 'c', 'd'].map((opt) => (
                    <label className="field" key={opt}>
                      {opt.toUpperCase()} şıkkı
                      <input
                        value={editForm[`option_${opt}`]}
                        onChange={(e) => setEditForm({ ...editForm, [`option_${opt}`]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label className="field">
                    Doğru şık
                    <select
                      value={editForm.correct_option}
                      onChange={(e) => setEditForm({ ...editForm, correct_option: e.target.value })}
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </label>
                  <label className="field">
                    Süre (saniye)
                    <input
                      type="number"
                      value={editForm.time_limit_seconds}
                      onChange={(e) => setEditForm({ ...editForm, time_limit_seconds: e.target.value })}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleUpdateQuestion(q.id)}>
                      Kaydet
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <div className="list-row">
                  <span className="list-row-meta">Soru {q.order_index}</span>
                  <span style={{ flex: 1, margin: '0 1rem' }}>{q.text}</span>
                  {competitionStatus === 'scheduled' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost" onClick={() => handleStartEdit(q)}>
                        Düzenle
                      </button>
                      <button className="btn btn-ghost" onClick={() => handleDeleteQuestion(q.id)}>
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {competitionStatus && competitionStatus !== 'scheduled' && (
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              Bu yarışma başladığı için sorular artık düzenlenemez/silinemez.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <label className="field">
          Soru metni
          <textarea value={form.text} onChange={handleChange('text')} required />
        </label>

        <label className="field">
          Görsel veya video (opsiyonel)
          <input type="file" accept="image/*,video/*" onChange={handleImageUpload} disabled={uploadingImage} />
        </label>
        {uploadingImage && <p className="muted">Yükleniyor...</p>}
        {form.image_url && /\.(mp4|webm|mov|ogg)/i.test(form.image_url) ? (
          <video src={form.image_url} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
        ) : (
          form.image_url && (
            <img src={form.image_url} alt="Soru görseli" style={{ maxWidth: '200px', borderRadius: '8px' }} />
          )
        )}

        <label className="field">
          A şıkkı
          <input value={form.option_a} onChange={handleChange('option_a')} required />
        </label>
        <label className="field">
          B şıkkı
          <input value={form.option_b} onChange={handleChange('option_b')} required />
        </label>
        <label className="field">
          C şıkkı
          <input value={form.option_c} onChange={handleChange('option_c')} required />
        </label>
        <label className="field">
          D şıkkı
          <input value={form.option_d} onChange={handleChange('option_d')} required />
        </label>

        <label className="field">
          Doğru şık
          <select value={form.correct_option} onChange={handleChange('correct_option')}>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </select>
        </label>

        <label className="field">
          Süre (saniye)
          <input
            type="number"
            min="1"
            value={form.time_limit_seconds}
            onChange={handleChange('time_limit_seconds')}
            required
          />
        </label>

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Ekleniyor...' : 'Soruyu ekle'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/admin/competitions/new">Yeni yarışma oluştur</Link>
      </p>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Hazırlık ekranı videosu</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Yarışma başlamadan önceki 100 saniyelik bekleme ekranında oynatılır. İstediğiniz zaman
          ekleyebilir ya da değiştirebilirsiniz.
        </p>
        <label className="field" style={{ marginTop: '0.75rem' }}>
          Video dosyası
          <input type="file" accept="video/*" onChange={handleLobbyVideoUpload} disabled={uploadingLobbyVideo} />
        </label>
        {uploadingLobbyVideo && <p className="muted">Yükleniyor...</p>}
        {lobbyVideoMessage && <p className="status-banner">{lobbyVideoMessage}</p>}
        {lobbyVideoUrl && (
          <video src={lobbyVideoUrl} style={{ maxWidth: '240px', borderRadius: '8px', marginTop: '0.5rem' }} controls />
        )}
      </div>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Yarışmayı hemen başlat</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Normalde yarışma, belirlediğiniz başlangıç saatinde kendiliğinden başlar. İsterseniz
          buradan hemen de başlatabilirsiniz.
        </p>
        <button className="btn btn-primary" onClick={handleStart} disabled={starting} style={{ marginTop: '1rem' }}>
          {starting ? 'Başlatılıyor...' : 'Yarışmayı şimdi başlat'}
        </button>
        {startMessage && <p className="status-banner" style={{ marginTop: '0.75rem' }}>{startMessage}</p>}
      </div>
    </div>
  );
}
