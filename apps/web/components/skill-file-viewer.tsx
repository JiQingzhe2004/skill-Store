'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, File, Folder, FolderOpen, ArrowLeft, FileText } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

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
      style={dark ? oneDark : oneLight}
      showLineNumbers
      lineNumberStyle={{ color: dark ? '#636d83' : '#999', fontSize: '0.75rem', userSelect: 'none', minWidth: '3em' }}
      customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8rem', background: 'transparent' }}
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
function FileCodeView({ file, onBack }: { file: FileEntry; onBack: () => void }) {
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
            文件
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{file.path.split('/').pop()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{lines} 行 · {formatSize(file.size)}</span>
          {isMarkdown && (
            <button
              onClick={() => setViewRaw(!viewRaw)}
              className="text-xs text-primary hover:underline"
            >
              {viewRaw ? '渲染预览' : '查看源码'}
            </button>
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
export function SkillFileViewer({ files }: { files: FileEntry[] }) {
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set())

  if (!files.length) return null

  const tree = buildTree(files)
  const readme = files.find(f => {
    const name = f.path.split('/').pop()?.toLowerCase() ?? ''
    return name === 'skill.md' || name === 'readme.md'
  })

  const sortedNodes = Array.from(tree.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const toggleDir = (path: string) => {
    setOpenDirs(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  if (selectedFile) {
    return (
      <div className="mt-6">
        <FileCodeView file={selectedFile} onBack={() => setSelectedFile(null)} />
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4">
      {/* File table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
          <span className="text-sm font-medium">{files.length} 个文件</span>
        </div>
        <table className="w-full">
          <tbody>
            {sortedNodes.map(node => (
              <FileRow
                key={node.fullPath}
                node={node}
                onFileClick={setSelectedFile}
                onDirClick={toggleDir}
                openDirs={openDirs}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* README / SKILL.md preview */}
      {readme && (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{readme.path.split('/').pop()}</span>
          </div>
          <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
