import type { HonoContext } from '../../shared/types';
import { errorLog } from '../../shared/logger';

/**
 * AI Model information
 */
export interface AIModel {
  id: string;
  provider: 'openai_compatible';
  displayName: string;
}

/**
 * Models Handler
 *
 * Returns the configured AI model from environment variables.
 * This endpoint does not require authentication.
 */
export async function getModels(c: HonoContext) {
  try {
    const model = c.env.AI_DEFAULT_MODEL;
    if (!model) return getFallbackModels(c);

    return c.json({
      success: true,
      models: [{ id: model, provider: 'openai_compatible', displayName: model }] satisfies AIModel[],
    });
  } catch (error) {
    errorLog(undefined, 'Error in getModels:', error);
    return getFallbackModels(c);
  }
}

function getFallbackModels(c: HonoContext) {
  return c.json({ success: false, models: [], error: 'Missing AI_DEFAULT_MODEL' }, 500);
}
