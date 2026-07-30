import ReactMarkdown from 'react-markdown'

const COMPONENTS = {
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-0.5 pl-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-0.5 pl-5 first:mt-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
}

export default function MarkdownText({ children }) {
  return <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
}
