import type { ChatMessage } from '@/types/chat'

export type ChatTurn = {
  userMessage: ChatMessage | null
  aiMessages: ChatMessage[]
  startIdx: number
}

export type IterationFrame = {
  iteration: number
  message: ChatMessage
}

export type ChatTurnWithIterations = ChatTurn & {
  turnIndex: number
  iterationFrames: IterationFrame[]
  hasIterations: boolean
}

function timeOf(m: ChatMessage) { return m.createdAt ? new Date(m.createdAt).getTime() : 0 }

export function groupMessagesIntoTurns(messages: ChatMessage[]): ChatTurn[] {
  const result: ChatTurn[] = []
  let userMessage: ChatMessage | null = null
  let aiMessages: ChatMessage[] = []
  let startIdx = 0

  messages.forEach((msg, idx) => {
    if (msg.sender === 'user') {
      if (userMessage || aiMessages.length) result.push({ userMessage, aiMessages: aiMessages.sort((a, b) => timeOf(a) - timeOf(b)), startIdx })
      userMessage = msg
      aiMessages = []
      startIdx = idx
    } else if (msg.sender === 'ai') {
      aiMessages.push(msg)
    }
  })
  if (userMessage || aiMessages.length) result.push({ userMessage, aiMessages: aiMessages.sort((a, b) => timeOf(a) - timeOf(b)), startIdx })
  return result
}

export function buildTurnsWithIterations(turns: ChatTurn[]): ChatTurnWithIterations[] {
  return turns.map((turn, turnIndex) => ({ ...turn, turnIndex, iterationFrames: [], hasIterations: false }))
}
