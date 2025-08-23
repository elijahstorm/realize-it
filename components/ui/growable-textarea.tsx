'use client'

import { useEffect, useRef, useState } from 'react'

export function GrowableTextarea({
    value = '',
    placeholder,
    required = false,
    autoFocus = false,
    disabled = false,
    onChange,
    onEnter,
}: {
    value?: string
    placeholder?: string
    required?: boolean
    autoFocus?: boolean
    disabled?: boolean
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onEnter: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}) {
    const mirrorRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [height, setHeight] = useState('2.13rem')

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (mirrorRef.current && textareaRef.current) {
            const mirrorHeight = mirrorRef.current.offsetHeight
            setHeight(mirrorHeight + 'px')
        }
    }, [value])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (textareaRef.current && autoFocus) {
            const length = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(length, length)
            textareaRef.current.focus()
        }
    }, [autoFocus])

    return (
        <div className="relative w-full">
            <div
                ref={mirrorRef}
                className="invisible m-0 max-h-60 w-full overflow-hidden rounded-md border bg-red-200 px-3 py-1 pr-12 break-words break-all whitespace-pre-wrap text-transparent"
            >
                {value ? value : 'test'}
            </div>
            <textarea
                ref={textareaRef}
                className="ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring absolute top-0 left-0 m-0 flex w-full min-w-0 flex-1 resize-none overflow-auto rounded-md border border-gray-300 bg-gray-50 px-3 py-1 pr-12 text-base break-words break-all text-slate-500 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-blue-500 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                style={{ height }}
                value={value}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (onEnter) onEnter(e)
                    }
                }}
                onChange={onChange}
            ></textarea>
        </div>
    )
}
