import React from 'react'
import RichText from '@/components/RichText'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import styles from './ContentRichText.module.css'

type ContentRichTextProps = {
  data: DefaultTypedEditorState
}

export const ContentRichText: React.FC<ContentRichTextProps> = ({ data }) => {
  return (
    <div className="content-rich-text-wrapper bg-white">
      <RichText
        data={data}
        enableGutter={false}
        enableProse={false}
        className={styles.contentRichText}
      />
    </div>
  )
}

export default ContentRichText
