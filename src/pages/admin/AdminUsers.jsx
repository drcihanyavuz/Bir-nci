import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { SkeletonList } from '../../components/Skeleton';

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (from) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, inci_balance, is_admin')
      .order('full_name')
      .range(from, from + PAGE_SIZE - 1);

    setHasMore((data ?? []).length === PAGE_SIZE);
    return data ?? [];
  };

  useEffect(() => {
    loadPage(0).then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const more = await loadPage(users.length);
    setUsers((prev) => [...prev, ...more]);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Üyeler</h1>
        <div style={{ marginTop: '1.5rem' }}>
          <SkeletonList count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Üyeler</h1>

      <div style={{ marginTop: '1.5rem' }}>
        {users.map((u) => (
          <Link to={`/admin/users/${u.id}`} className="list-row" key={u.id} style={{ textDecoration: 'none' }}>
            <div>
              <div className="list-row-title">
                {u.full_name || 'İsimsiz'} {u.is_admin && <span className="gold-text">· admin</span>}
              </div>
              <div className="list-row-meta">{u.email}</div>
            </div>
            <span className="balance-pill">✦ {u.inci_balance}</span>
          </Link>
        ))}

        {hasMore && (
          <button className="btn btn-ghost" onClick={handleLoadMore} disabled={loadingMore} style={{ marginTop: '1rem' }}>
            {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
          </button>
        )}
      </div>
    </div>
  );
}
