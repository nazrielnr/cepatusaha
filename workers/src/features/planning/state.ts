import { TOOL_SCHEMAS } from '../files/tools';
import { PLANNING_TOOL_SCHEMAS } from './tools';

export type PlanningPhase = 'idle' | 'gathering' | 'planning' | 'executing' | 'building';

const BUILD_TOOL_NAMES = TOOL_SCHEMAS.map((tool) => tool.name);
const PLANNING_TOOL_NAMES = PLANNING_TOOL_SCHEMAS.map((tool) => tool.name);

export const VALID_TRANSITIONS: Record<PlanningPhase, string[]> = {
  idle: ['gather_requirements'],
  gathering: ['generate_planning_docs'],
  planning: ['execute_plan', 'gather_requirements'],
  executing: BUILD_TOOL_NAMES,
  building: BUILD_TOOL_NAMES,
};

export const TOOL_TO_NEXT_PHASE: Record<string, PlanningPhase> = {
  gather_requirements: 'gathering',
  generate_planning_docs: 'planning',
  execute_plan: 'executing',
  ...Object.fromEntries(BUILD_TOOL_NAMES.map((name) => [name, 'building' as const])),
};

export function validateToolCall(currentPhase: PlanningPhase, toolName: string): boolean {
  return VALID_TRANSITIONS[currentPhase]?.includes(toolName) ?? false;
}

export function getNextPhase(currentPhase: PlanningPhase, toolName: string): PlanningPhase {
  return TOOL_TO_NEXT_PHASE[toolName] ?? currentPhase;
}

export function getToolOrderError(currentPhase: PlanningPhase, toolName: string): string {
  return `Tool "${toolName}" cannot be called in "${currentPhase}" phase. Allowed tools: ${VALID_TRANSITIONS[currentPhase].join(', ')}`;
}

export interface PlanningSession {
  phase: PlanningPhase;
  requirementsData?: Record<string, unknown>;
  planningData?: Record<string, unknown>;
  userAnswers?: Record<string, unknown>;
  startedAt: number;
  lastUpdatedAt: number;
}

export function createPlanningSession(): PlanningSession {
  const now = Date.now();
  return { phase: 'idle', startedAt: now, lastUpdatedAt: now };
}

export function updatePlanningSession(session: PlanningSession, toolName: string, result?: Record<string, unknown>): PlanningSession {
  const updated: PlanningSession = { ...session, phase: getNextPhase(session.phase, toolName), lastUpdatedAt: Date.now() };
  if (toolName === 'gather_requirements' && result) updated.requirementsData = result;
  if (toolName === 'generate_planning_docs' && result) updated.planningData = result;
  return updated;
}

export function isInPlanningMode(session: PlanningSession): boolean {
  return PLANNING_TOOL_NAMES.includes(VALID_TRANSITIONS[session.phase]?.[0] ?? '') || ['idle', 'gathering', 'planning'].includes(session.phase);
}

export function resetPlanningSession(session: PlanningSession): PlanningSession {
  return { ...session, phase: 'idle', requirementsData: undefined, planningData: undefined, userAnswers: undefined, lastUpdatedAt: Date.now() };
}
