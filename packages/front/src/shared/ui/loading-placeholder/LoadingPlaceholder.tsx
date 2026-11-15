import { type CSSProperties, type HTMLAttributes } from 'react'
import './LoadingPlaceholder.css'

interface LoadingPlaceholderProps extends HTMLAttributes<HTMLSpanElement> {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  borderRadius?: CSSProperties['borderRadius']
}

export const LoadingPlaceholder = ({ width, height, borderRadius, className = '', style, ...props }: LoadingPlaceholderProps) => (
  <span {...props} className={`vkap_loading_placeholder ${className}`} style={{ width, height, borderRadius, ...style }}>{'\u200c'}</span>
)
