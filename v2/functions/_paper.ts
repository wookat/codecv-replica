import { parseHTML } from 'linkedom/worker'
import { createResumePaper, type TemplateSeed } from '../web/src/features/resume/renderContract'

export async function templateSeed(env: { ASSETS: { fetch: (r: Request) => Promise<Response> } }, requestUrl: string, templateId: string): Promise<TemplateSeed> {
  const id = templateId.replace(/^cv-/, '')
  const r = await env.ASSETS.fetch(new Request(new URL(`/seeds/tpl/${encodeURIComponent(id)}.json`, requestUrl)))
  if (!r.ok) throw new Error(`Template ${id} unavailable: ${r.status}`)
  return r.json() as Promise<TemplateSeed>
}

export function renderPaper(markdown: string, seed: TemplateSeed, opts: { color?: string } = {}, photo = ''): string {
  const { document } = parseHTML('<!doctype html><html><body></body></html>')
  return createResumePaper(markdown, seed, opts, photo, document as unknown as Document).outerHTML
}
