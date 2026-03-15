'use client'

import { useState } from 'react'
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/utils'

type FileEntry = {
  id: string
  path: string
  content: string
  encoding: string
  size: number
}

// ─── 语言映射 ─────────────────────────────────────────────────────────────────
const EXT_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  mjs: 'javascript', cjs: 'javascript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
  java: 'java', c: 'c', cpp: 'cpp', h: 'c',
  css: 'css', html: 'html', xml: 'xml',
  json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql', graphql: 'graphql', prisma: 'javascript',
  md: 'markdown', txt: 'text', env: 'bash',
  dockerfile: 'docker',
}

function getLang(path: string): string {
  const name = path.split('/').pop()?.toLowerCase() ?? ''
  if (name === 'dockerfile' || name === 'dockerfile.dev') return 'docker'
  const ext = name.split('.').pop() ?? ''
  return EXT_LANG[ext] ?? 'text'
}

// ─── 文件树构建 ───────────────────────────────────────────────────────────────
type TreeNode = {
  name: string
  path: string
  type: 'file' | 'dir'
  children: TreeNode[]
  file?: FileEntry
}

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let nodes = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      let node = nodes.find(n => n.name === part)

      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isLast ? 'file' : 'dir',
          children: [],
          file: isLast ? file : undefined,
        }
        nodes.push(node)
        // dirs before files, alpha sort
        nodes.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
      }

      nodes = node.children
    }
  }

  return root
}

// ─── 树节点组件 ───────────────────────────────────────────────────────────────
function TreeItem({
  node, depth, selected, onSelect,
}: {
  node: TreeNode
  depth: number
  selected: string | null
  onSelect: (f: FileEntry) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const isDir = node.type === 'dir'
  const isSelected = selected === node.path

  return (
    <div>
      <button
        className={cn(
          'flex items-center gap-1.5 w-full text-left px-2 py-0.5 rounded text-sm hover:bg-muted/60 transition-colors',
          isSelected && 'bg-muted font-medium',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (isDir) setOpen(o => !o)
          else if (node.file) onSelect(node.file)
        }}
      >
        {isDir ? (
          <>
            <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-90')} />
            {open
              ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              : <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && open && node.children.map(child => (
        <TreeItem key={child.path} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ─── 文件内容渲染 ─────────────────────────────────────────────────────────────
function FileContent({ file }: { file: FileEntry }) {
  const lang = getLang(file.path)
  const content = file.encoding === 'base64'
    ? '[二进制文件，无法预览]'
    : file.content

  if (lang === 'markdown') {
    return (
      <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  return (
    <SyntaxHighlighter
      language={lang}
      style={oneLight}
      customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8rem', minHeight: '100%', background: 'transparent' }}
      showLineNumbers
      wrapLines
    >
      {content}
    </SyntaxHighlighter>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function SkillFileViewer({ files }: { files: FileEntry[] }) {
  const tree = buildTree(files)
  const firstFile = files.find(f => f.path === 'SKILL.md') ?? files[0] ?? null
  const [selected, setSelected] = useState<FileEntry | null>(firstFile)

  if (!files.length) return null

  return (
    <div className="flex border border-border/60 rounded-lg overflow-hidden" style={{ minHeight: 400 }}>
      {/* 文件树 */}
      <div className="w-56 shrink-0 border-r border-border/60 bg-muted/20 overflow-y-auto py-2">
        <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">文件</div>
        {tree.map(node => (
          <TreeItem
            key={node.path}
            node={node}
            depth={0}
            selected={selected?.path ?? null}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* 文件内容 */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/10 text-xs text-muted-foreground">
              <File className="w-3.5 h-3.5" />
              <span className="font-mono">{selected.path}</span>
              <span className="ml-auto">{(selected.size / 1024).toFixed(1)} KB</span>
            </div>
            <FileContent file={selected} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">选择文件查看内容</div>
        )}
      </div>
    </div>
  )
}
