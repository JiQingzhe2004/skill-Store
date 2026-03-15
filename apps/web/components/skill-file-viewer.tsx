'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, File, Folder, FolderOpen, ArrowLeft, FileText, Code, BookOpen } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useParams } from 'next/navigation'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { getMessages, type Locale } from '../messages'

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

// ─── 主题感知代码高亮 ───────────────────────────────────────────────────────────
function SyntaxHighlighterThemed({ language, content }: { language: string; content: string }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    // 也检查 class-based dark mode（Tailwind）
    const checkDark = () => {
      setDark(document.documentElement.classList.contains('dark') || mq.matches)
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    mq.addEventListener('change', checkDark)
    return () => { observer.disconnect(); mq.removeEventListener('change', checkDark) }
  }, [])

  return (
    <SyntaxHighlighter
      language={language}
      style={{
        ...(dark ? oneDark : oneLight),
        'pre[class*="language-"]': {
          ...(dark ? oneDark : oneLight)['pre[class*="language-"]'],
          background: 'transparent',
          backgroundColor: 'transparent',
        },
        'code[class*="language-"]': {
          ...(dark ? oneDark : oneLight)['code[class*="language-"]'],
          background: 'transparent',
          backgroundColor: 'transparent',
          textShadow: 'none',
        },
      }}
      showLineNumbers
      lineNumberStyle={{ color: dark ? '#636d83' : '#999', fontSize: '0.75rem', userSelect: 'none', minWidth: '3em' }}
      customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8rem', background: 'transparent', backgroundColor: 'transparent', textShadow: 'none' }}
      codeTagProps={{ style: { textShadow: 'none' } }}
    >
      {content}
    </SyntaxHighlighter>
  )
}

function getLang(path: string): string {
  const name = path.split('/').pop()?.toLowerCase() ?? ''
  if (name === 'dockerfile' || name === 'dockerfile.dev') return 'docker'
  const ext = name.split('.').pop() ?? ''
  return EXT_LANG[ext] ?? 'text'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── 文件树构建 ───────────────────────────────────────────────────────────────
type TreeNode = {
  name: string
  fullPath: string
  type: 'file' | 'dir'
  children: Map<string, TreeNode>
  file?: FileEntry
}

function buildTree(files: FileEntry[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>()

  for (const file of files) {
    const parts = file.path.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const fullPath = parts.slice(0, i + 1).join('/')

      if (!current.has(part)) {
        current.set(part, {
          name: part,
          fullPath,
          type: isLast ? 'file' : 'dir',
          children: new Map(),
          file: isLast ? file : undefined,
        })
      }
      if (!isLast) {
        current = current.get(part)!.children
      }
    }
  }

  return root
}

// ─── 文件表格行 ──────────────────────────────────────────────────────────────
function FileRow({ node, depth = 0, onFileClick, onDirClick, openDirs }: {
  node: TreeNode
  depth?: number
  onFileClick: (file: FileEntry) => void
  onDirClick: (path: string) => void
  openDirs: Set<string>
}) {
  const isOpen = openDirs.has(node.fullPath)
  const isDir = node.type === 'dir'

  return (
    <>
      <tr
        className="hover:bg-muted/50 cursor-pointer border-b border-border/40 last:border-0"
        onClick={() => isDir ? onDirClick(node.fullPath) : node.file && onFileClick(node.file)}
      >
        <td className="py-1.5 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
            {isDir ? (
              isOpen
                ? <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0" />
                : <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className={cn('text-sm', isDir ? 'font-medium' : 'text-foreground')}>
              {node.name}
            </span>
          </div>
        </td>
        <td className="py-1.5 px-4 text-right text-xs text-muted-foreground">
          {!isDir && node.file ? formatSize(node.file.size) : ''}
        </td>
      </tr>
      {isDir && isOpen && Array.from(node.children.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      }).map(child => (
        <FileRow
          key={child.fullPath}
          node={child}
          depth={depth + 1}
          onFileClick={onFileClick}
          onDirClick={onDirClick}
          openDirs={openDirs}
        />
      ))}
    </>
  )
}

// ─── 代码查看器 ───────────────────────────────────────────────────────────────
type Messages = ReturnType<typeof getMessages>

function FileCodeView({ file, onBack, m }: { file: FileEntry; onBack: () => void; m: Messages }) {
  const lang = getLang(file.path)
  const isMarkdown = lang === 'markdown'
  const [viewRaw, setViewRaw] = useState(false)
  const lines = file.content.split('\n').length

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={onBack}
            className="text-primary hover:underline font-medium"
          >
            {m.fileViewer.file}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{file.path.split('/').pop()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{m.fileViewer.lineCount.replace('{lines}', String(lines)).replace('{size}', formatSize(file.size))}</span>
          {isMarkdown && (
            <div className="flex items-center rounded border border-border/60 overflow-hidden">
              <button
                title={m.fileViewer.renderPreview}
                onClick={() => setViewRaw(false)}
                className={cn('px-2 py-1 transition-colors', !viewRaw ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                title={m.fileViewer.viewSource}
                onClick={() => setViewRaw(true)}
                className={cn('px-2 py-1 transition-colors', viewRaw ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isMarkdown && !viewRaw ? (
        <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <SyntaxHighlighterThemed language={lang} content={file.content} />
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
// ─── 递归文件树节点（用于左侧） ───────────────────────────────────────────────
function TreeNode({
  node, depth = 0, selectedFile, onFileClick, onDirClick, openDirs,
}: {
  node: TreeNode; depth?: number
  selectedFile: FileEntry | null
  onFileClick: (f: FileEntry) => void
  onDirClick: (path: string) => void
  openDirs: Set<string>
}) {
  const isOpen = openDirs.has(node.fullPath)
  const isSelected = selectedFile?.id === node.file?.id
  const sorted = Array.from(node.children.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => onDirClick(node.fullPath)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-muted/60 rounded text-left"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-90')} />
          {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && sorted.map(child => (
          <TreeNode key={child.fullPath} node={child} depth={depth + 1}
            selectedFile={selectedFile} onFileClick={onFileClick} onDirClick={onDirClick} openDirs={openDirs} />
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => node.file && onFileClick(node.file)}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-muted/60 rounded text-left',
        isSelected && 'bg-primary/10 text-primary',
      )}
      style={{ paddingLeft: `${8 + depth * 14 + 14}px` }}
    >
      <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

export function SkillFileViewer({ files }: { files: FileEntry[] }) {
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)
  const tree = buildTree(files)
  const readme = files.find(f => {
    const name = f.path.split('/').pop()?.toLowerCase() ?? ''
    return name === 'skill.md' || name === 'readme.md'
  })
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(readme ?? files[0] ?? null)
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set())

  if (!files.length) return null

  const sortedRoots = Array.from(tree.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const toggleDir = (path: string) => {
    setOpenDirs(prev => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next })
  }

  const lang = selectedFile ? getLang(selectedFile.path) : 'text'
  const isMarkdown = lang === 'markdown'
  const [viewRaw, setViewRaw] = useState(false)

  return (
    <div className="mt-6 rounded-lg border border-border/60 overflow-hidden bg-white dark:bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">{m.fileViewer.files.replace('{count}', String(files.length))}</span>
        {selectedFile && (
          <span className="text-xs text-muted-foreground font-mono">{selectedFile.path}</span>
        )}
      </div>

      {/* Body: left tree + right content */}
      <div className="flex" style={{ height: '520px' }}>
        {/* Left: file tree */}
        <div className="w-56 shrink-0 border-r border-border/60 overflow-y-auto py-1">
          {sortedRoots.map(node => (
            <TreeNode key={node.fullPath} node={node}
              selectedFile={selectedFile} onFileClick={(f) => { setSelectedFile(f); setViewRaw(false) }}
              onDirClick={toggleDir} openDirs={openDirs} />
          ))}
        </div>

        {/* Right: content */}
        <div className="flex-1 overflow-auto relative">
          {selectedFile && isMarkdown && (
            <div className="absolute top-2 right-2 z-10 flex items-center rounded border border-border/60 overflow-hidden shadow-sm">
              <button title={m.fileViewer.renderPreview} onClick={() => setViewRaw(false)}
                className={cn('px-2 py-1 transition-colors', !viewRaw ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')}>
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button title={m.fileViewer.viewSource} onClick={() => setViewRaw(true)}
                className={cn('px-2 py-1 transition-colors', viewRaw ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')}>
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {selectedFile ? (
            isMarkdown && !viewRaw ? (
              <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedFile.content}</ReactMarkdown>
              </div>
            ) : (
              <SyntaxHighlighterThemed language={lang} content={selectedFile.content} />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">{m.fileViewer.selectFile}</div>
          )}
        </div>
      </div>
    </div>
  )
}
