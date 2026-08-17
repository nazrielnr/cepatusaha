import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

interface MarkdownContentProps {
  content: string
}

/**
 * Markdown renderer with syntax highlighting and GFM support
 */
export const MarkdownContent = memo(function MarkdownContent({
  content
}: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        // Code blocks
        code({ node: _node, className, children, ...props }) {
          const isInline = !className?.includes('language-')
          return !isInline ? (
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-3">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code
              className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          )
        },
        // Paragraphs - preserve line breaks with margin
        p({ children }) {
          return <p className="whitespace-pre-line mb-4 last:mb-0">{children}</p>
        },
        // Line breaks - add vertical spacing
        br() {
          return <span className="block h-2.5" />
        },
        // Headings
        h1({ children }) {
          return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
        },
        // Lists
        ul({ children }) {
          return <ul className="list-disc pl-5 my-4 space-y-1.5">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 my-4 space-y-1.5">{children}</ol>
        },
        li({ children }) {
          return (
            <li className="my-1">
              {children}
            </li>
          )
        },
        // Links
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary underline"
            >
              {children}
            </a>
          )
        },
        // Blockquotes
        blockquote({ children }) {
          return <blockquote>{children}</blockquote>
        },
        table({ children }) {
          return (
            <div className="my-4 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-full overflow-x-auto">
                <table className="!m-0 !table w-max min-w-full !max-w-none !overflow-visible border-collapse border-spacing-0 text-left text-sm">
                  {children}
                </table>
              </div>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-slate-50 dark:bg-slate-800 !border-0">{children}</thead>
        },
        tbody({ children }) {
          return <tbody className="!border-0">{children}</tbody>
        },
        tr({ children }) {
          return <tr className="group/tr !border-0">{children}</tr>
        },
        th({ children }) {
          return (
            <th className="!border-l-0 !border-t-0 !border-r !border-b !border-border px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 last:!border-r-0 whitespace-nowrap">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="!border-l-0 !border-t-0 !border-r !border-b !border-border px-4 py-3 text-slate-700 dark:text-slate-300 last:!border-r-0 group-last/tr:!border-b-0">
              {children}
            </td>
          )
        },
        // Horizontal rule
        hr() {
          return <hr />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
})
