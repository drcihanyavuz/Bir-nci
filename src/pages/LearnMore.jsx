import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function LearnMore() {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_media')
      .select('media_url')
      .eq('placement', 'learn_more')
      .maybeSingle()
      .then(({ data }) => {
        setMediaUrl(data?.media_url ?? null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h1>📖 Yarışmayı Öğrenelim</h1>

      {loading ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>Yükleniyor...</p>
      ) : mediaUrl ? (
        isVideoUrl(mediaUrl) ? (
          <video src={mediaUrl} className="room-media" style={{ marginTop: '1.5rem', maxHeight: '420px' }} controls />
        ) : (
          <img src={mediaUrl} alt="Yarışmayı öğrenelim" className="room-media" style={{ marginTop: '1.5rem', maxHeight: '420px' }} />
        )
      ) : (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          Tanıtım videosu yakında burada olacak.
        </div>
      )}
    </div>
  );
}
