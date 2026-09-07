import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from('profiles')
      .select('id, full_name, inci_balance, is_admin, phone')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setProfile(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { profile, loading };
}
