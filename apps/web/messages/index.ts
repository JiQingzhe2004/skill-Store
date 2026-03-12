import { enUS } from './en-US'
import { zhCN } from './zh-CN'

const dictionaries = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const

export type Locale = keyof typeof dictionaries

export const DEFAULT_LOCALE: Locale = 'zh-CN'

export function getMessages(locale: Locale = DEFAULT_LOCALE) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

export const messages = getMessages()
