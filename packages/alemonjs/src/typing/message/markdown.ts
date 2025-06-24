/**
 *
 */
export type DataMarkdownTemplate = {
  type: 'MarkdownTemplate'
  value: string // template_id
  options: {
    params: {
      [key: string]: string
    }
  }
}

// type Markdown

export type DataMarkdownText = {
  type: 'MD.text'
  value: string
}

export type DataMarkdownTitle = {
  type: 'MD.title'
  value: string
}

export type DataMarkdownSubtitle = {
  type: 'MD.subtitle'
  value: string
}

export type DataMarkdownBold = {
  type: 'MD.bold'
  value: string
}

export type DataMarkdownItalic = {
  type: 'MD.italic'
  value: string
}

export type DataMarkdownItalicStar = {
  type: 'MD.italicStar'
  value: string
}

export type DataMarkdownStrikethrough = {
  type: 'MD.strikethrough'
  value: string
}

export type DataMarkdownLink = {
  type: 'MD.link'
  value: {
    text: string
    url: string
  }
}
export type DataMarkdownImage = {
  type: 'MD.image'
  value: string
  options?: {
    width?: number
    height?: number
  }
}

export type DataMarkdownListItem = {
  type: 'MD.listItem'
  value: string | { index: number; text?: string }
}

export type DataMarkdownList = {
  type: 'MD.list'
  value: DataMarkdownListItem[]
}

export type DataMarkdownBlockquote = {
  type: 'MD.blockquote'
  value: string
}

export type DataMarkdownDivider = {
  type: 'MD.divider'
}

export type DataMarkdownNewline = {
  type: 'MD.newline'
  value: boolean
}

export type DataMarkdownCode = {
  type: 'MD.code'
  value: string
  options?: {
    language?: string // 代码语言
  }
}

type DataMarkDownBalue =
  | DataMarkdownText
  | DataMarkdownTitle
  | DataMarkdownSubtitle
  | DataMarkdownBold
  | DataMarkdownItalic
  | DataMarkdownItalicStar
  | DataMarkdownStrikethrough
  | DataMarkdownLink
  | DataMarkdownImage
  | DataMarkdownList
  | DataMarkdownBlockquote
  | DataMarkdownDivider
  | DataMarkdownNewline
  | DataMarkdownCode

export type DataMarkDown = {
  type: 'Markdown'
  value: DataMarkDownBalue[]
}
