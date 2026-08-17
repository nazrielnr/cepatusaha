
export const CodeBlock = ({
  code,
  showLineNumbers = true,
  startingLineNumber = 1,
  isStreaming = false
}: {
  code: string;
  showLineNumbers?: boolean;
  startingLineNumber?: number;
  isStreaming?: boolean;
}) => {
  const MAX_CHARS = 8000
  const MAX_LINES = 150

  if (isStreaming) {
    const displayCode = code.length > MAX_CHARS ? code.slice(0, MAX_CHARS) + '\n\n... [Sisa kode disembunyikan untuk menjaga performa]' : code
    return (
      <div className="text-[10px] md:text-[11px] font-mono text-slate-600 leading-relaxed rounded-md bg-slate-200/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        <div className="flex flex-col py-2">
          <pre className="px-3 whitespace-pre-wrap break-words text-slate-600">
            {displayCode}
          </pre>
        </div>
      </div>
    )
  }

  const lines = code.replace(/\r/g, '').split('\n')
  const isTruncated = lines.length > MAX_LINES
  const displayLines = isTruncated ? lines.slice(0, MAX_LINES) : lines

  return (
    <div className="text-[10px] md:text-[11px] font-mono text-slate-600 leading-relaxed rounded-md bg-slate-200/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
      <div className="flex flex-col">
        {displayLines.map((line, idx) => {
          const isFirst = idx === 0
          const isLast = idx === displayLines.length - 1 && !isTruncated
          return (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <div className={`select-none text-slate-400 text-right pr-3 pl-2 sticky left-0 shrink-0 min-w-[2.5rem] bg-slate-200/40 border-r border-slate-200/50 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                  {startingLineNumber + idx}
                </div>
              )}
              <pre className={`flex-1 px-3 whitespace-pre-wrap break-words text-slate-600 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                {line || ' '}
              </pre>
            </div>
          )
        })}
        {isTruncated && (
          <div className="flex mt-1 border-t border-slate-200/50 bg-slate-100/50">
            {showLineNumbers && (
              <div className="select-none text-slate-400 text-right pr-3 pl-2 pb-2 sticky left-0 shrink-0 min-w-[2.5rem] bg-slate-200/40 border-r border-slate-200/50">
                ...
              </div>
            )}
            <div className="flex-1 px-3 py-1 pb-2 text-[10px] text-slate-500 italic">
              + {lines.length - MAX_LINES} baris lainnya disembunyikan (terlalu panjang)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Workspace Viewer Component for check_workspace results
