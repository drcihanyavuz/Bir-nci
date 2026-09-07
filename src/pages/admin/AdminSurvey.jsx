import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = { text: '', option_a: '', option_b: '', option_c: '', option_d: '' };

export default function AdminSurvey() {
  const [questions, setQuestions] = useState([]);
  const [resultsByQuestion, setResultsByQuestion] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data: qs } = await supabase
      .from('survey_questions')
      .select('*')
      .order('created_at', { ascending: false });
    setQuestions(qs ?? []);

    const { data: results } = await supabase.from('survey_results').select('*');
    const grouped = {};
    for (const r of results ?? []) {
      (grouped[r.question_id] ??= {})[r.selected_option] = r.vote_count;
    }
    setResultsByQuestion(grouped);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.from('survey_questions').insert(form);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm(emptyForm);
    load();
  };

  const toggleActive = async (q) => {
    await supabase.from('survey_questions').update({ is_active: !q.is_active }).eq('id', q.id);
    load();
  };

  return (
    <div className="page">
      <h1>Anket yönetimi</h1>

      <form onSubmit={handleSubmit} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <h2>Yeni anket sorusu</h2>

        <label className="field">
          Soru metni
          <textarea value={form.text} onChange={handleChange('text')} required />
        </label>
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

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Ekleniyor...' : 'Anketi yayınla'}
        </button>
      </form>

      <h2 style={{ marginTop: '2.5rem' }}>Geçmiş anketler</h2>
      {questions.map((q) => {
        const results = resultsByQuestion[q.id] ?? {};
        const total = Object.values(results).reduce((s, n) => s + n, 0);
        return (
          <div className="list-row" key={q.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="list-row-title">{q.text}</span>
              <button className="btn btn-ghost" onClick={() => toggleActive(q)}>
                {q.is_active ? 'Pasife al' : 'Aktif et'}
              </button>
            </div>
            <div className="list-row-meta" style={{ marginTop: '0.5rem' }}>
              {['a', 'b', 'c', 'd'].map((opt) => (
                <span key={opt} style={{ marginRight: '1rem' }}>
                  {opt.toUpperCase()}: {results[opt] ?? 0}
                </span>
              ))}
              {' · '}Toplam {total} oy
            </div>
          </div>
        );
      })}
    </div>
  );
}
