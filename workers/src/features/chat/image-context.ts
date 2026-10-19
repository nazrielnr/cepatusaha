import { OpenAICompatibleProvider } from '../models/providers/openai-compatible';
import type { Bindings } from '../../bindings';
import type { ToolValue } from '../files/tool-types';

type ImageRef = { url: string; key?: string; type?: string };

export const IMAGE_CONTEXT_PROMPT = `Analyze image. Return concise IMAGE_CONTEXT only.
Fields: type, visible_text_ocr, key_objects, scene_or_layout, data_facts, actionable_details, uncertainty.
Rules: factual, no hidden guesses, preserve exact text/numbers. If UI include layout/colors. If document prioritize OCR. If chart include axes/trends. If code screenshot transcribe code/errors.`;

export async function analyzeImageTool(env: Bindings, input: { image_url?: string; image_key?: string; prompt?: string }): Promise<ToolValue> {
  if (!env.AI_VISION_MODEL) return { image_context: '', error: 'AI_VISION_MODEL is not configured' };
  const url = await imageToModelUrl(env, { url: input.image_url || '', key: input.image_key });
  if (!url) return { image_context: '', error: 'image_key or image_url is required' };
  const provider = new OpenAICompatibleProvider({ providerName: 'Vision Tool', baseUrl: env.AI_BASE_URL, apiKey: env.AI_API_KEY, nodeEnv: env.NODE_ENV });
  const response = await provider.chat({
    model: env.AI_VISION_MODEL,
    temperature: 0.2,
    max_tokens: 8192,
    reasoning_effort: 'low',
    messages: [{ role: 'user', content: [{ type: 'text', text: `${IMAGE_CONTEXT_PROMPT}\nSpecific request: ${input.prompt || '(none)'}` }, { type: 'image_url', image_url: { url } }] }],
  });
  const image_context = typeof response.message.content === 'string' ? response.message.content.trim() : '';
  if (!image_context) return { image_context: '', error: `Vision model returned empty content. finish_reason=${response.finish_reason || 'unknown'} completion_tokens=${response.usage?.completion_tokens || 0}` };
  return { image_context };
}

// Cloudflare Workers free tier allows only ~10ms CPU per invocation. base64
// conversion of a multi-MB image (String.fromCharCode + btoa) blows that budget
// instantly -> "Worker exceeded CPU time limit". Chat uploads are downscaled
// client-side (apps/web/src/api/assets.ts), and this hard cap refuses to inline
// anything larger, falling back to the raw URL.
const MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

export async function imageToModelUrl(env: Bindings, image: ImageRef): Promise<string | undefined> {
  if (!image.url && !image.key) return undefined;
  if (image.url?.startsWith('data:')) return image.url;
  const objectKey = image.key || keyFromAssetUrl(image.url || '');
  if (!objectKey || !env.ASSETS_BUCKET) return image.url || undefined;
  try {
    const object = await env.ASSETS_BUCKET.get(objectKey);
    if (!object) return image.url || undefined;
    if (object.size > MAX_INLINE_IMAGE_BYTES) return image.url || undefined;
    const bytes = new Uint8Array(await object.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${image.type || object.httpMetadata?.contentType || 'image/png'};base64,${btoa(binary)}`;
  } catch {
    return image.url || undefined;
  }
}

function keyFromAssetUrl(url: string): string | undefined {
  if (!url) return undefined;
  const marker = '/api/assets/object/';
  const i = url.indexOf(marker);
  if (i !== -1) {
    const rawKey = url.slice(i + marker.length).split('?')[0];
    return decodeURIComponent(rawKey);
  }
  return undefined;
}
