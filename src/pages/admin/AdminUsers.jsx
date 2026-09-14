import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, email, inci_balance, is_admin')
      .order('full_name')
      .then(({ data }) => {
        setUsers(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page">Yükleniyor...</div>;

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
      </div>
    </div>
  );
}
