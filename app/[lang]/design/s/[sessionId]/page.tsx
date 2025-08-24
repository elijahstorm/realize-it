'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import { Send, Sparkles, Loader2, UserRound, Download, Shirt } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'

interface PageProps {
    params: Promise<{ lang: string; sessionId: string }>
}

type DesignSession = {
    id: string
    prompt?: string | null
    status?: string | null
    language?: string | null
}

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    reasoning?: string
    image_status?: 'generating' | 'complete' | 'error'
    image_url?: string
    image_prompt?: string
    image_error?: string
    image_data?: string
    partial_index?: number
}

const DESIGN_PROMPTS = [
    'Help me design a trendy t-shirt for Gen Z',
    'I need a professional design for corporate merchandise',
    'Create something minimalist and modern',
    'Design something inspired by nature',
    'I want something bold and artistic',
]

export default function Page({ params }: PageProps) {
    const { sessionId, lang } = React.use(params)
    const { toast } = useToast()
    const supabase = useMemo(() => supabaseBrowser, [])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [authUserId, setAuthUserId] = useState<string | null>(null)
    const [session, setSession] = useState<DesignSession | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const load = useCallback(async () => {
        setIsLoading(true)
        setLoadError(null)
        try {
            const { data: auth } = await supabase.auth.getSession()
            setAuthUserId(auth?.session?.user?.id ?? null)

            const { data: sessionRow, error: sessionErr } = await supabase
                .from('design_sessions')
                .select('id,prompt,status,language')
                .eq('id', sessionId)
                .single()
            if (sessionErr) throw sessionErr
            setSession(sessionRow as DesignSession)
            const { data: sessionMessages, error: messagesErr } = await supabase
                .from('design_session_messages')
                .select('*')
                .eq('design_session_id', sessionId)
                .order('created_at', { ascending: true })

            if (messagesErr) throw messagesErr

            // Initialize with welcome message
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                role: 'assistant',
                content: `Hello! I'm your AI design assistant. I'll help you create the perfect design by understanding your vision, analyzing trends, and refining your ideas together. 

Let's start by discussing what you have in mind. I can help with:
• Style and trend analysis
• Creative refinement and variations  
• Storytelling and messaging
• Design appropriateness and cultural sensitivity
• Style matching and complementary elements

What kind of design are you looking to create?`,
                timestamp: new Date(),
                reasoning:
                    'Introducing the AI design assistant capabilities and setting expectations for collaborative design process.',
            }
            setMessages([
                welcomeMessage,
                ...sessionMessages.map((msg) => ({ ...msg, timestamp: new Date(msg.created_at) })),
            ])
        } catch (e: any) {
            setLoadError(e?.message || 'Failed to load design session.')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, supabase])

    useEffect(() => {
        load()
    }, [load])

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isStreaming) return

            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, userMessage])
            setInputValue('')
            setIsStreaming(true)

            try {
                const { data: possiblyIncompleteMessage, error } = await supabase
                    .from('design_session_messages')
                    .insert({
                        design_session_id: sessionId,
                        role: userMessage.role,
                        content: userMessage.content,
                        reasoning: null,
                        image_status: null,
                        image_data: null,
                        image_url: null,
                        image_prompt: null,
                        partial_index: null,
                    })
                    .select()
                    .single()

                if (error) console.error(error)

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [...messages, userMessage].map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        context: {
                            sessionId,
                            type: 'design_assistant',
                            prompt: session?.prompt,
                        },
                    }),
                })

                if (!response.ok) throw new Error('Failed to send message')

                const reader = response.body?.getReader()
                if (!reader) throw new Error('No response body')

                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                }

                setMessages((prev) => [...prev, assistantMessage])

                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6))

                                if (data.done) {
                                    break
                                }

                                if (data.error) {
                                    throw new Error(data.error)
                                }

                                // Handle streaming text content
                                if (data.content && data.streaming) {
                                    // Append new content for progressive streaming
                                    assistantMessage.content += data.content
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantMessage.id
                                                ? { ...assistantMessage }
                                                : m
                                        )
                                    )
                                }
                                // Handle complete structured response
                                else if (data.content && data.complete) {
                                    assistantMessage.content = data.content
                                    if (data.reasoning) {
                                        assistantMessage.reasoning = data.reasoning
                                    }

                                    const { error } = await supabase
                                        .from('design_session_messages')
                                        .upsert(
                                            {
                                                id: possiblyIncompleteMessage?.id,
                                                design_session_id: sessionId,
                                                role: 'assistant',
                                                content: data.content,
                                                reasoning: data.reasoning || null,
                                                image_status: 'complete',
                                                image_data: null,
                                                image_url: data.image_url || null,
                                                image_prompt: data.image_prompt || null,
                                                partial_index: null,
                                            },
                                            { onConflict: 'id' }
                                        )

                                    if (error) console.error(error)

                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantMessage.id
                                                ? { ...assistantMessage }
                                                : m
                                        )
                                    )
                                }
                                // Handle image generation status
                                else if (data.image_status) {
                                    switch (data.image_status) {
                                        case 'gen':
                                            // Set generating state
                                            assistantMessage.image_status = 'generating'
                                            assistantMessage.image_prompt = data.image_prompt
                                            setMessages((prev) =>
                                                prev.map((m) =>
                                                    m.id === assistantMessage.id
                                                        ? { ...assistantMessage }
                                                        : m
                                                )
                                            )
                                            break

                                        case 'partial':
                                            // Update with partial image
                                            assistantMessage.image_status = 'generating'
                                            assistantMessage.image_data = data.image_data
                                            assistantMessage.partial_index = data.partial_index
                                            assistantMessage.image_prompt = data.image_prompt
                                            setMessages((prev) =>
                                                prev.map((m) =>
                                                    m.id === assistantMessage.id
                                                        ? { ...assistantMessage }
                                                        : m
                                                )
                                            )
                                            break

                                        case 'done':
                                            // Set completed state with final image
                                            assistantMessage.image_status = 'complete'
                                            assistantMessage.image_data = data.image_data
                                            assistantMessage.image_url = data.image_url
                                            assistantMessage.image_prompt = data.image_prompt
                                            delete assistantMessage.partial_index

                                            const { error } = await supabase
                                                .from('design_session_messages')
                                                .insert({
                                                    design_session_id: sessionId,
                                                    role: 'assistant',
                                                    content: data.content,
                                                    reasoning: data.reasoning || null,
                                                    image_status: 'complete',
                                                    image_data: null,
                                                    image_url: data.image_url || null,
                                                    image_prompt: data.image_prompt || null,
                                                    partial_index: null,
                                                })

                                            if (error) console.error(error)

                                            setMessages((prev) =>
                                                prev.map((m) =>
                                                    m.id === assistantMessage.id
                                                        ? { ...assistantMessage }
                                                        : m
                                                )
                                            )
                                            break

                                        case 'error':
                                            // Set error state
                                            assistantMessage.image_status = 'error'
                                            assistantMessage.image_error = data.image_error
                                            setMessages((prev) =>
                                                prev.map((m) =>
                                                    m.id === assistantMessage.id
                                                        ? { ...assistantMessage }
                                                        : m
                                                )
                                            )
                                            break
                                    }
                                }
                            } catch (parseError) {
                                console.warn('Failed to parse streaming data:', parseError)
                                // Continue processing other chunks
                            }
                        }
                    }
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to send message. Please try again.',
                    variant: 'destructive',
                })
            } finally {
                setIsStreaming(false)
            }
        },
        [isStreaming, messages, session?.prompt, sessionId, toast]
    )

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            sendMessage(inputValue)
        },
        [inputValue, sendMessage]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(inputValue)
            }
        },
        [inputValue, sendMessage]
    )

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <div className="mx-auto w-full max-w-4xl px-4 pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            AI Design Assistant
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Session {sessionId.slice(0, 8)} • {session?.status || 'active'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/${lang}/help`}
                            className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-sm"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/cart`}
                            className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-sm"
                        >
                            Cart
                        </Link>
                    </div>
                </div>

                {session?.prompt && (
                    <div className="bg-card text-muted-foreground mt-4 rounded-lg p-4 text-sm">
                        <span className="text-foreground font-medium">Original Brief:</span>{' '}
                        {session.prompt}
                    </div>
                )}

                <Separator className="my-6" />
            </div>

            {loadError ? (
                <div className="mx-auto w-full max-w-4xl px-4">
                    <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                        <AlertTitle>Could not load design session</AlertTitle>
                        <AlertDescription>
                            {loadError}
                            <button
                                onClick={load}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium"
                            >
                                Retry
                            </button>
                        </AlertDescription>
                    </Alert>
                </div>
            ) : null}

            {/* Chat Messages Area */}
            <div className="mx-auto w-full max-w-4xl flex-1 px-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6 pb-6">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex gap-3',
                                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground'
                                    )}
                                >
                                    {message.role === 'user' ? (
                                        <UserRound />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        'max-w-[80%] flex-1',
                                        message.role === 'user' ? 'text-right' : 'text-left'
                                    )}
                                >
                                    <div className="text-muted-foreground mb-1 text-xs">
                                        {message.timestamp.toLocaleTimeString()}
                                    </div>
                                    <div
                                        className={cn(
                                            'prose prose-sm max-w-none rounded-lg p-4',
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground ml-auto'
                                                : 'bg-card border'
                                        )}
                                    >
                                        <div className="whitespace-pre-wrap">{message.content}</div>

                                        {/* Image Display Section */}
                                        {(message.image_status || message.image_prompt) && (
                                            <div className="mt-4 rounded-lg border bg-gray-50/50 p-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Generated Image
                                                    </span>
                                                    {message.image_status === 'generating' && (
                                                        <div className="flex items-center gap-1 text-xs text-blue-600">
                                                            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
                                                            Generating...
                                                        </div>
                                                    )}
                                                    {message.image_status === 'complete' && (
                                                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-600">
                                                            ✓ Complete
                                                        </span>
                                                    )}
                                                    {message.image_status === 'error' && (
                                                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                                            ✗ Failed
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Image Content */}
                                                {message.image_status === 'generating' &&
                                                    !message.image_data && (
                                                        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-200">
                                                            <div className="text-center text-gray-500">
                                                                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                                                                <p className="text-sm">
                                                                    Creating your image...
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                {message.image_status === 'generating' &&
                                                    message.image_data && (
                                                        <div className="space-y-2">
                                                            <div className="relative">
                                                                <img
                                                                    src={message.image_url}
                                                                    alt={
                                                                        message.image_prompt ||
                                                                        'Generated image (partial)'
                                                                    }
                                                                    className="w-full rounded-lg opacity-75 shadow-sm"
                                                                />
                                                                <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-blue-600/90 px-2 py-1 text-xs text-white">
                                                                    <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
                                                                    Partial{' '}
                                                                    {message.partial_index !==
                                                                    undefined
                                                                        ? `${message.partial_index + 1}`
                                                                        : ''}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-gray-600">
                                                                Image is being refined...
                                                            </p>
                                                        </div>
                                                    )}

                                                {message.image_status === 'complete' &&
                                                    message.image_data && (
                                                        <div className="space-y-2">
                                                            <img
                                                                src={`data:image/png;base64,${message.image_data}`}
                                                                alt={
                                                                    message.image_prompt ||
                                                                    'Generated image'
                                                                }
                                                                className="w-full rounded-lg shadow-sm"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="flex cursor-pointer items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow transition hover:bg-gray-200 disabled:cursor-not-allowed"
                                                                    onClick={() => {
                                                                        const link =
                                                                            document.createElement(
                                                                                'a'
                                                                            )
                                                                        link.href = `data:image/png;base64,${message.image_data}`
                                                                        link.download =
                                                                            'generated-image.png'
                                                                        link.click()
                                                                    }}
                                                                >
                                                                    <Download size={16} />
                                                                    Download
                                                                </button>

                                                                <Link
                                                                    href={`/${lang}/design/s/${sessionId}/select-product/${message.id}`}
                                                                    className="flex cursor-pointer items-center gap-1 rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700 shadow transition hover:bg-blue-200 disabled:cursor-not-allowed"
                                                                >
                                                                    <Shirt size={16} />
                                                                    Create Product
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}

                                                {message.image_status === 'error' && (
                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                        <p className="mb-1 text-sm font-medium text-red-800">
                                                            Image generation failed
                                                        </p>
                                                        <p className="text-xs text-red-600">
                                                            {message.image_error ||
                                                                'Unknown error occurred'}
                                                        </p>
                                                        <button className="mt-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-200">
                                                            Try Again
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Image Prompt Details */}
                                                {message.image_prompt && (
                                                    <details className="mt-3 text-xs opacity-70">
                                                        <summary className="cursor-pointer font-medium text-gray-600">
                                                            Image Prompt
                                                        </summary>
                                                        <div className="mt-2 border-l-2 border-gray-300 pl-2 text-gray-600">
                                                            {message.image_prompt}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        )}

                                        {/* Reasoning Section */}
                                        {message.reasoning && (
                                            <details className="mt-3 text-xs opacity-70">
                                                <summary className="cursor-pointer font-medium">
                                                    Reasoning
                                                </summary>
                                                <div className="mt-2 border-l-2 border-current/20 pl-2">
                                                    {message.reasoning}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t backdrop-blur">
                <div className="mx-auto w-full max-w-4xl px-4 py-4">
                    {/* Quick Prompts */}
                    <div className="mb-4">
                        <div className="text-muted-foreground mb-2 text-xs">Quick start:</div>
                        <div className="flex flex-wrap gap-2">
                            {DESIGN_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(prompt)}
                                    disabled={isStreaming}
                                    className="bg-secondary hover:bg-secondary/80 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your design ideas, ask for suggestions, or request variations..."
                                className="focus:ring-primary max-h-32 min-h-[60px] w-full resize-none rounded-lg border px-4 py-3 pr-12 focus:ring-2 focus:outline-none"
                                disabled={isStreaming}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!inputValue.trim() || isStreaming}
                                className="text-primary hover:bg-primary/10 absolute right-2 bottom-2 rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isStreaming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="text-muted-foreground mt-2 text-center text-xs">
                        Press Enter to send • Shift+Enter for new line
                    </div>
                </div>
            </div>
        </div>
    )
}
