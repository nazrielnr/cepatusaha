import { memo, useEffect, useState, useRef } from 'react'

interface StreamingContentAnimatedProps {
  content: string
  isStreaming?: boolean
  className?: string
}

interface ContentChunk {
  id: string
  text: string
  shouldAnimate: boolean
}

/**
 * Component that animates streaming text chunks with focus-in effect
 * Only animates new chunks during streaming for smooth, elegant transitions
 */
export const StreamingContentAnimated = memo(function StreamingContentAnimated({
  content,
  isStreaming = false,
  className = ''
}: StreamingContentAnimatedProps) {
  const [chunks, setChunks] = useState<ContentChunk[]>([])
  const prevContentRef = useRef('')
  const chunkIdCounter = useRef(0)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // On initial mount, render without animation
    if (isInitialMount.current) {
      if (content) {
        setChunks([{
          id: 'chunk-initial',
          text: content,
          shouldAnimate: false
        }])
        prevContentRef.current = content
      }
      isInitialMount.current = false
      return
    }

    // Only process if content has changed
    if (content === prevContentRef.current) return

    const prevContent = prevContentRef.current
    const newContent = content

    // If content is completely new (reset), create single chunk without animation
    if (!newContent.startsWith(prevContent)) {
      setChunks([{
        id: `chunk-reset-${Date.now()}`,
        text: newContent,
        shouldAnimate: false
      }])
      prevContentRef.current = newContent
      return
    }

    // Extract the new chunk (delta)
    const delta = newContent.slice(prevContent.length)

    // Only add animated chunks if streaming is active and delta exists
    if (delta.length > 0 && isStreaming) {
      // Group small chunks together for smoother animation
      // Animate every ~20-50 characters or on punctuation for natural rhythm
      const shouldCreateNewChunk =
        chunks.length === 0 ||
        delta.includes('.') ||
        delta.includes('!') ||
        delta.includes('?') ||
        delta.includes('\n') ||
        delta.length >= 20

      if (shouldCreateNewChunk) {
        setChunks(prev => [...prev, {
          id: `chunk-${chunkIdCounter.current++}`,
          text: delta,
          shouldAnimate: true
        }])
      } else {
        // Append to last chunk without creating new animation
        setChunks(prev => {
          if (prev.length === 0) {
            return [{
              id: `chunk-${chunkIdCounter.current++}`,
              text: delta,
              shouldAnimate: true
            }]
          }

          const lastChunk = prev[prev.length - 1]
          return [
            ...prev.slice(0, -1),
            {
              ...lastChunk,
              text: lastChunk.text + delta
            }
          ]
        })
      }

      prevContentRef.current = newContent
    } else if (delta.length > 0 && !isStreaming) {
      // If not streaming but content changed, update without animation
      prevContentRef.current = newContent
    }
  }, [content, isStreaming, chunks.length])

  // Consolidate chunks when streaming stops
  useEffect(() => {
    if (!isStreaming && chunks.length > 1) {
      const timer = setTimeout(() => {
        setChunks([{
          id: `chunk-final-${Date.now()}`,
          text: content,
          shouldAnimate: false
        }])
      }, 700) // Wait for last animation to finish
      return () => clearTimeout(timer)
    }
  }, [isStreaming, content, chunks.length])

  return (
    <span className={className}>
      {chunks.map((chunk) => (
        <span
          key={chunk.id}
          className={chunk.shouldAnimate ? 'animate-focus-in inline' : 'inline'}
          style={{
            whiteSpace: 'pre-wrap',
            animationFillMode: 'both'
          }}
        >
          {chunk.text}
        </span>
      ))}
    </span>
  )
})
