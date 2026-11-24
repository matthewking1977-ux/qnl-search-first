import type { APIRoute } from 'astro';
import { records } from '../../../search/data';
import { toBibTeX } from '../../../search/cite';

// One static export file per catalogue record (works without JavaScript).
export function getStaticPaths() {
  return records.filter((r) => r.catalogue).map((r) => ({ params: { id: r.id } }));
}
export const GET: APIRoute = ({ params, site }) => {
  const r = records.find((x) => x.id === params.id)!;
  return new Response(toBibTeX(r, 'ar', site), { headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' } });
};
