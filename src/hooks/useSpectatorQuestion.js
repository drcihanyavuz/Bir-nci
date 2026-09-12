import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSpectatorQuestion(questionId) {
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      return;
    }

    let active = true;

    supabase
      .from('spectator_questions')
      .select('*')
      .eq('id', questionId)
      .single()
      .then(({ data }) => {
        if (active) setQuestion(data);
      });

    return () => {
      active = false;
    };
  }, [questionId]);

  return question;
}
