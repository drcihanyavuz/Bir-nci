import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function NewCompetition() {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [entryCost, setEntryCost] = useState(10);
  const [prize1, setPrize1] = useState('');
  const [prize2, setPrize2] = useState('');
  const [prize3, setPrize3] = useState('');
  const [lobbyVideoUrl, setLobbyVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVideo(true);
    const fileName = `lobby-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from('question-images').upload(fileName, file);

    if (!error) {
      const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);
      setLobbyVideoUrl(data.publicUrl);
    } else {
      setError(error.message);
    }

    setUploadingVideo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { data, error } = await supabase
      .from('competitions')
      .insert({
        title,
        start_time: new Date(startTime).toISOString(),
        max_participants: Number(maxParticipants),
        entry_cost_inci: Number(entryCost),
        prize_rank_1: prize1 || null,
        prize_rank_2: prize2 || null,
        prize_rank_3: prize3 || null,
        lobby_video_url: lobbyVideoUrl || null,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate(`/admin/competitions/${data.id}/questions`);
  };

  return (
    <div className="page">
      <h1>Yeni yarışma oluştur</h1>

      <form onSubmit={handleSubmit} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <label className="field">
          Başlık
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: 1 Eylül Akşam Yarışması"
            required
          />
        </label>

        <label className="field">
          Başlangıç zamanı
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>

        <label className="field">
          Kontenjan (maksimum katılımcı)
          <input
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            required
          />
        </label>

        <label className="field">
          Katılım bedeli (inci)
          <input
            type="number"
            min="0"
            value={entryCost}
            onChange={(e) => setEntryCost(e.target.value)}
            required
          />
        </label>

        <label className="field">
          1. lik ödülü (opsiyonel)
          <input value={prize1} onChange={(e) => setPrize1(e.target.value)} placeholder="Örn: 500 TL" />
        </label>

        <label className="field">
          2. lik ödülü (opsiyonel)
          <input value={prize2} onChange={(e) => setPrize2(e.target.value)} placeholder="Örn: 250 TL" />
        </label>

        <label className="field">
          3. lük ödülü (opsiyonel)
          <input value={prize3} onChange={(e) => setPrize3(e.target.value)} placeholder="Örn: 100 TL" />
        </label>

        <label className="field">
          Hazırlık ekranında oynatılacak tanıtım videosu (opsiyonel)
          <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploadingVideo} />
        </label>
        {uploadingVideo && <p className="muted">Yükleniyor...</p>}
        {lobbyVideoUrl && (
          <video src={lobbyVideoUrl} style={{ maxWidth: '240px', borderRadius: '8px' }} controls />
        )}

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Oluşturuluyor...' : 'Yarışmayı oluştur ve sorulara geç'}
        </button>
      </form>
    </div>
  );
}
