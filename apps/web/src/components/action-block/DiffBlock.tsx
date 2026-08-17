type Token = { text: string; highlight: boolean }

function splitTokensIntoLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = []
  let currentLine: Token[] = []

  for (const token of tokens) {
    const parts = token.text.split('\n')
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push(currentLine)
        currentLine = []
      }
      if (parts[i].length > 0) {
        currentLine.push({ text: parts[i], highlight: token.highlight })
      }
    }
  }
  lines.push(currentLine)
  return lines
}

export function DiffBlock({ oldText = '', newText = '' }: { oldText?: string; newText?: string }) {
  const oldTextClean = oldText.replace(/\r/g, '')
  const newTextClean = newText.replace(/\r/g, '')

  let prefixLen = 0
  while (prefixLen < oldTextClean.length && prefixLen < newTextClean.length && oldTextClean[prefixLen] === newTextClean[prefixLen]) {
    prefixLen++
  }

  let suffixLen = 0
  const maxSuffix = Math.min(oldTextClean.length - prefixLen, newTextClean.length - prefixLen)
  while (suffixLen < maxSuffix && oldTextClean[oldTextClean.length - 1 - suffixLen] === newTextClean[newTextClean.length - 1 - suffixLen]) {
    suffixLen++
  }

  const oldTokens: Token[] = [
    { text: oldTextClean.slice(0, prefixLen), highlight: false },
    { text: oldTextClean.slice(prefixLen, oldTextClean.length - suffixLen), highlight: true },
    { text: oldTextClean.slice(oldTextClean.length - suffixLen), highlight: false }
  ].filter(t => t.text.length > 0)

  const newTokens: Token[] = [
    { text: newTextClean.slice(0, prefixLen), highlight: false },
    { text: newTextClean.slice(prefixLen, newTextClean.length - suffixLen), highlight: true },
    { text: newTextClean.slice(newTextClean.length - suffixLen), highlight: false }
  ].filter(t => t.text.length > 0)

  const oldLines = splitTokensIntoLines(oldTokens)
  const newLines = splitTokensIntoLines(newTokens)

  return (
    <div className="text-[10px] md:text-[11px] font-mono leading-relaxed rounded-md bg-slate-200/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
      <div className="flex flex-col">
        {oldTextClean.length > 0 && oldLines.map((lineTokens, idx) => {
           const isFirst = idx === 0
           const isLast = idx === oldLines.length - 1
           return (
             <div key={`old-${idx}`} className="flex bg-destructive/10 text-destructive">
               <div className={`select-none text-destructive/70 text-right pr-3 pl-2 sticky left-0 shrink-0 min-w-[2.5rem] bg-destructive/10 border-r border-destructive/20 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                 {isFirst ? '-' : ''}
               </div>
               <pre className={`flex-1 px-3 whitespace-pre-wrap break-words ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                 {lineTokens.length === 0 ? ' ' : lineTokens.map((t, i) => (
                   <span key={i} className={t.highlight ? 'bg-destructive/30 font-medium rounded-[2px]' : ''}>{t.text}</span>
                 ))}
               </pre>
             </div>
           )
        })}
        {newTextClean.length > 0 && newLines.map((lineTokens, idx) => {
           const isFirst = idx === 0
           const isLast = idx === newLines.length - 1
           return (
             <div key={`new-${idx}`} className="flex bg-accent text-accent-foreground">
               <div className={`select-none text-accent-foreground/60 text-right pr-3 pl-2 sticky left-0 shrink-0 min-w-[2.5rem] bg-accent/10 border-r border-accent-foreground/20 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                 {isFirst ? '+' : ''}
               </div>
               <pre className={`flex-1 px-3 whitespace-pre-wrap break-words ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                 {lineTokens.length === 0 ? ' ' : lineTokens.map((t, i) => (
                   <span key={i} className={t.highlight ? 'bg-accent/30 font-medium rounded-[2px]' : ''}>{t.text}</span>
                 ))}
               </pre>
             </div>
           )
        })}
      </div>
    </div>
  )
}
