import React from 'react'
import { cn } from './ui'
import Link from 'next/link'

/**
 * Parses text with highlight tags and renders it with appropriate styling
 * Example: "This is [highlight]important[/highlight] text"
 *
 * @param text - The text to parse, which may contain [highlight] tags
 * @returns React elements with highlighted spans
 */
export const parseHighlightedText = (text: string) => {
  if (!text) return null

  // Split the text by highlight tags
  const parts = text.split(/(\[highlight\]|\[\/highlight\])/g)
  let isHighlighted = false

  return (
    <>
      {parts.map((part, index) => {
        if (part === '[highlight]') {
          isHighlighted = true
          return null
        } else if (part === '[/highlight]') {
          isHighlighted = false
          return null
        } else {
          return (
            <span key={index} className={cn({ 'font-bold text-mustard': isHighlighted })}>
              {part}
            </span>
          )
        }
      })}
    </>
  )
}

/**
 * Parses text with [paragraph]...[/paragraph] blocks and highlights text inside each paragraph.
 * Returns an array of <p> elements with highlighted text.
 */
export const parseParagraphsWithHighlight = (text: string) => {
  if (!text) return null
  // Match all [paragraph]...[/paragraph] blocks
  const paragraphRegex = /\[paragraph\]([\s\S]*?)\[\/paragraph\]/g
  const paragraphs = []
  let match
  let idx = 0
  while ((match = paragraphRegex.exec(text)) !== null) {
    const paraText = match[1]?.trim() ?? ''
    paragraphs.push(
      <p key={idx++} className="mb-4">
        {parseHighlightedText(paraText)}
      </p>,
    )
  }
  // If no [paragraph] tags, fallback to highlighting the whole text
  if (paragraphs.length === 0) {
    return parseHighlightedText(text)
  }
  return paragraphs
}

/**
 * Parses text with paragraphs, highlights, and links all together.
 * Supports: [paragraph]...[/paragraph], [highlight]...[/highlight], [link:url]...[/link]
 *
 * @param text - The text to parse with formatting tags
 * @returns React elements with proper formatting
 */
export const parseTextWithFormatting = (text: string) => {
  if (!text) return null

  // First, split by paragraph tags
  const paragraphRegex = /\[paragraph\]([\s\S]*?)\[\/paragraph\]/g
  const paragraphs = []
  let match
  let idx = 0
  let lastIndex = 0

  while ((match = paragraphRegex.exec(text)) !== null) {
    // Add any text before the paragraph tag
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index).trim()
      if (beforeText) {
        paragraphs.push(
          <p key={`before-${idx++}`} className="mb-4">
            {parseHighlightedTextWithLinks(beforeText)}
          </p>,
        )
      }
    }

    const paraText = match[1]?.trim() ?? ''
    if (paraText) {
      paragraphs.push(
        <p key={idx++} className="mb-4">
          {parseHighlightedTextWithLinks(paraText)}
        </p>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add any remaining text after the last paragraph
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim()
    if (remainingText) {
      paragraphs.push(
        <p key={`after-${idx++}`} className="mb-4">
          {parseHighlightedTextWithLinks(remainingText)}
        </p>,
      )
    }
  }

  // If no paragraphs found, treat the whole text as one paragraph
  if (paragraphs.length === 0) {
    return <p className="mb-4">{parseHighlightedTextWithLinks(text)}</p>
  }

  return paragraphs
}

/**
 * Parses text with highlights and links (used within paragraphs)
 *
 * @param text - The text to parse for highlights and links
 * @returns React elements with highlights and links
 */
const parseHighlightedTextWithLinks = (text: string) => {
  if (!text) return null

  // Pattern to match [link:url]text[/link] format
  const linkPattern = /\[link:([^\]]+)\](.*?)\[\/link\]/g

  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      if (beforeText) {
        parts.push(parseHighlightedText(beforeText))
      }
    }

    const url = match[1] || ''
    const linkText = match[2] || ''

    // Parse the link text for highlights
    const parsedLinkText = parseHighlightedText(linkText)

    // Determine link type and handle accordingly
    if (url.startsWith('mailto:')) {
      // Handle mailto links
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          className="text-mustard hover:text-yellow-600 underline transition-colors duration-200"
        >
          {parsedLinkText}
        </a>,
      )
    } else if (url.startsWith('tel:')) {
      // Handle phone number links
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          className="text-mustard hover:text-yellow-600 underline transition-colors duration-200"
        >
          {parsedLinkText}
        </a>,
      )
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // Handle external links
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-mustard hover:text-yellow-600 underline transition-colors duration-200"
        >
          {parsedLinkText}
        </a>,
      )
    } else {
      // Handle internal links (Next.js Link)
      parts.push(
        <Link
          key={`link-${match.index}`}
          href={url}
          className="text-mustard hover:text-yellow-600 underline transition-colors duration-200"
        >
          {parsedLinkText}
        </Link>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      parts.push(parseHighlightedText(remainingText))
    }
  }

  return parts.length > 0 ? parts : parseHighlightedText(text)
}

export function formatPhone(phone?: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Format phone number for email display as XXX-XXX-XXXX
 * @param phone - Phone number string (can contain formatting)
 * @returns Formatted phone number as XXX-XXX-XXXX or original string if invalid
 */
export function formatPhoneForEmail(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  // If 11 digits and starts with 1 (US country code), remove it
  if (digits.length === 11 && digits[0] === '1') {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  // Return original if doesn't match expected format
  return phone
}