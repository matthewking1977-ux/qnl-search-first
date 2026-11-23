// Measurement-plan events pushed to window.dataLayer (GTM-compatible).
// search_query · search_zero_results · result_click · task_answer_shown
type Ev =
  | { event: 'search_query'; search_term: string; search_mode: 'library' | 'ask'; search_filter: string; results_count: number; lang: string; source: 'typeahead' | 'submit' | 'results_page' }
  | { event: 'search_zero_results'; search_term: string; search_filter: string; lang: string }
  | { event: 'result_click'; search_term: string; result_id: string; result_type: string; result_position: number; group: string; lang: string; source: 'typeahead' | 'results_page' }
  | { event: 'task_answer_shown'; search_term: string; task_id: string; lang: string };

export function track(e: Ev) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer = w.dataLayer || []).push({ ...e, ts: Date.now() });
}
