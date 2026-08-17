/**
 * Streaming Chat Handler with Iteration Events
 * Sends real-time updates as each iteration completes
 */

import type { HonoContext } from '../../shared/types';
import type { AuthResult } from '../../shared/types';
import { createProjectForUser, getSessionDbUserId, getSessionProjectId, sessionExistsForUser } from '../sessions/service';
import { createFactoryFromEnv } from '../models/ai-factory';
import { ConversationLoop, ConversationLoopConfig, LoopContext } from './conversation-loop';
import { FunctionCallHandler } from '../files/tool-handler';
import { StreamManager } from './stream-manager';
import { validateChatRequest, buildAIMessages } from '../../shared/validation';
import { buildSystemPrompt, buildPlanningSystemPrompt, enhanceUserMessage } from '../planning/prompt-builder';
import { listSkillSummaries } from '../skills/service';
import type { ChatMessage as AIChatMessage, ChatParams } from '../models/ai-provider';
import { ValidationError } from '../../shared/errors';
import { corsResponseHeaders } from '../../middleware/cors';
import { imageToModelUrl } from './image-context';


/**
 * Streaming chat handler - sends iteration events in real-time
 */
export async function chatHandlerStream(c: HonoContext) {
  const auth = c.get('auth') as AuthResult;
  const body = await c.req.json();

  // Validate request
  let conversation: ReturnType<typeof validateChatRequest>['conversation'];
  let context: ReturnType<typeof validateChatRequest>['context'];
  let sessionId: string | undefined;
  let reasoningEffort: ChatParams['reasoning_effort'] | undefined;
  let requestedModel: string | undefined;
  let runId: string | undefined;

  try {
    const validated = validateChatRequest(body);
    conversation = validated.conversation;
    context = validated.context;
    sessionId = validated.sessionId;
    reasoningEffort = validated.reasoning_effort;
    requestedModel = validated.model;
    runId = validated.runId;
    
  } catch (validationError) {
    if (validationError instanceof ValidationError) {
      return c.json({
        status: 'error',
        error: validationError.message
      }, 400);
    }
    throw validationError;
  }

  const dbUserId = await getSessionDbUserId(c.env, auth.userId);

  // Verify session if provided
  if (sessionId) {
    const sessionExists = await sessionExistsForUser(c.env, sessionId, dbUserId);
    if (!sessionExists) {
      return c.json({
        status: 'error',
        error: 'Session not found'
      }, 404);
    }
  }

  // Get AI provider and model
  const factory = await createFactoryFromEnv(c.env);
  const provider = factory.getPrimaryProvider();
  
  // Use requested model if provided, otherwise use primary model from factory
  // Validate that model is not accidentally set to mode value
  let modelName = requestedModel;
  
  // Fix: If model is accidentally set to mode value, use default instead
  if (!modelName || modelName === 'chat' || modelName === 'build' || modelName === 'edit') {
    modelName = factory.getPrimaryModel();
  }


  // Load conversation loop configuration
  const loopConfig: ConversationLoopConfig = {
    enabled: c.env.CONVERSATION_LOOP_ENABLED !== 'false',
    maxIterations: parseInt(c.env.MAX_LOOP_ITERATIONS || '30', 10),
    iterationTimeout: parseInt(c.env.LOOP_ITERATION_TIMEOUT || '180000', 10),
    // Rate limiting configuration
    rateLimit: {
      enabled: c.env.RATE_LIMIT_ENABLED !== 'false',
      baseDelayMs: parseInt(c.env.RATE_LIMIT_BASE_DELAY_MS || '500', 10),
      maxDelayMs: parseInt(c.env.RATE_LIMIT_MAX_DELAY_MS || '30000', 10),
      strategy: (c.env.RATE_LIMIT_STRATEGY as 'fixed' | 'linear' | 'exponential') || 'exponential',
      backoffMultiplier: parseFloat(c.env.RATE_LIMIT_BACKOFF_MULTIPLIER || '1.5'),
      retryOn429: c.env.RATE_LIMIT_RETRY_ON_429 !== 'false',
      maxRetries429: parseInt(c.env.RATE_LIMIT_MAX_RETRIES_429 || '3', 10),
    },
  };

  // Detect planning mode from request body
  const isPlanMode = body.planMode === true;
  
  // Build system prompt based on mode
  // Planning mode uses a different prompt focused on generating planning docs
  const skillSummaries = isPlanMode ? [] : await listSkillSummaries(c.env);
  const systemPrompt = isPlanMode 
    ? buildPlanningSystemPrompt() 
    : buildSystemPrompt(skillSummaries);


  const nativeImageMode = c.env.AI_IMAGE_MODE === 'native';
  const nativeConversation = nativeImageMode ? await inlineImagesForModel(conversation, c.env) : conversation;
  const conversationCopy = nativeImageMode
    ? nativeConversation
    : conversation.map((msg) => msg.images?.length ? { ...msg, content: `${msg.content || ''}\n\nUPLOADED_IMAGES:\n${msg.images.map((img, i) => `- image_${i + 1}: url=${img.url}${img.key ? ` key=${img.key}` : ''}${img.name ? ` name=${img.name}` : ''}`).join('\n')}\n\nUse analyze_image tool before answering image-dependent requests.`, images: undefined } : msg);

  // Enhance first user message
  if (conversationCopy.length > 0 && (conversationCopy[0].role === 'user' || conversationCopy[0].sender === 'user')) {
    conversationCopy[0] = {
      ...conversationCopy[0],
      content: enhanceUserMessage(conversationCopy[0].content || '')
    };
  }

  // Build AI messages
  const messages: AIChatMessage[] = buildAIMessages(conversationCopy, systemPrompt);

  // Get function call handler
  const functionHandler = new FunctionCallHandler(c.env);

  // Get or create project
  let projectId = str(context?.projectId);
  if (!projectId && sessionId) {
    projectId = await getSessionProjectId(c.env, sessionId) ?? undefined;
  }

  if (!projectId) {
    projectId = await createProjectForUser(c.env, dbUserId, sessionId);
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const streamManager = new StreamManager(controller);

      try {
        // Send start event with project_id so frontend can capture it
        streamManager.sendEvent('stream_start', {
          sessionId,
          projectId: projectId,
          model: modelName
        });

        // Create conversation loop with stream manager
        const conversationLoop = new ConversationLoop(
          provider,
          functionHandler,
          streamManager, // ← StreamManager aktif!
          loopConfig,
          modelName,
          reasoningEffort,
          isPlanMode, // Pass planMode to load planning tools
          nativeImageMode
        );

        const loopContext: LoopContext = {
          userId: dbUserId,
          sessionId: sessionId || '',
          projectId: projectId!,
          clerkUserId: auth.userId,
          signal: c.req.raw.signal,
          runId,
        };

        // Execute loop - will send iteration_data events
        const loopResult = await conversationLoop.executeLoop(messages, loopContext);

        if (!loopResult.success) {
          streamManager.sendEvent('error', {
            error: loopResult.error || 'Conversation loop failed'
          });
          streamManager.close();
          return;
        }

        // Send completion event
        streamManager.sendEvent('done', {
          totalIterations: loopResult.totalIterations,
          totalFunctionCalls: loopResult.totalFunctionCalls,
          sessionId
        });

        streamManager.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        streamManager.sendEvent('error', { error: errorMessage });
        streamManager.close();
      }
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      ...corsResponseHeaders(c.env, c.req.header('Origin')),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  });
}

async function inlineImagesForModel<T extends { images?: Array<{ url: string; key?: string; type?: string }> }>(conversation: T[], env: HonoContext['env']): Promise<T[]> {
  return Promise.all(conversation.map(async (msg) => msg.images?.length ? { ...msg, images: await Promise.all(msg.images.map(async (image) => ({ ...image, url: await imageToModelUrl(env, image) || image.url }))) } : msg));
}

function str(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined }
