import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCurrentQuestion(questionId) {
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      return;
    }

    let active = true;

    supabase
      .from('public_questions') // correct_option içermeyen güvenli view
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
