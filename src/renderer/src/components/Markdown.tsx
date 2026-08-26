import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * 메모를 마크다운으로 그린다.
 *
 * react-markdown 은 원시 HTML 을 넣지 않는 한 그리지 않는다. 메모에 붙여넣은 글이
 * 스크립트를 품고 있어도 글자로만 남는다.
 */
export function Markdown({ children }: { children: string }): React.JSX.Element {
  return (
    <div className="markdown text-sm leading-relaxed text-neutral-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 링크는 앱 안에서 열지 않는다. 메인 프로세스가 기본 브라우저로 넘긴다.
          a: ({ children: label, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {label}
            </a>
          )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
