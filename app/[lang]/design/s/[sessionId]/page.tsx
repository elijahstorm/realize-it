'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import { Send, Sparkles, ImageIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type ChatMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    images?: string[]
    reasoning?: string
    image_gen_prompt?: string
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
    const router = useRouter()
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
    const [isGeneratingImages, setIsGeneratingImages] = useState(false)
    const [generatedImages, setGeneratedImages] = useState<string[]>([])

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
            setMessages([welcomeMessage])
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

                let assistantMessage: ChatMessage = {
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
                    const lines = buffer.split('\n')
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

                                // Handle complete structured response
                                if (data.content && data.reasoning && !data.partial) {
                                    assistantMessage.content = data.content
                                    assistantMessage.reasoning = data.reasoning
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantMessage.id
                                                ? { ...assistantMessage }
                                                : m
                                        )
                                    )
                                }
                                // Handle partial updates during streaming
                                else if (data.content && data.partial) {
                                    assistantMessage.content = data.content
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantMessage.id
                                                ? { ...assistantMessage }
                                                : m
                                        )
                                    )
                                }
                                // Handle incremental content (fallback)
                                else if (data.content && !assistantMessage.content) {
                                    assistantMessage.content = data.content
                                    if (data.reasoning) {
                                        assistantMessage.reasoning = data.reasoning
                                    }
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantMessage.id
                                                ? { ...assistantMessage }
                                                : m
                                        )
                                    )
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

    const generateImages = useCallback(async () => {
        if (isGeneratingImages) return

        setIsGeneratingImages(true)
        try {
            // This would integrate with your image generation API
            // For now, simulating the process
            await new Promise((resolve) => setTimeout(resolve, 3000))

            // Mock generated images - replace with actual API call
            const mockImages = [
                '/api/placeholder/400/400',
                '/api/placeholder/400/400',
                '/api/placeholder/400/400',
            ]
            setGeneratedImages(mockImages)

            toast({
                title: 'Images Generated',
                description: 'Your design variations are ready!',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate images. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsGeneratingImages(false)
        }
    }, [isGeneratingImages, toast])

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
                                        'You'
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
                                        {message.reasoning && (
                                            <details className="mt-3 text-xs opacity-70">
                                                <summary className="cursor-pointer font-medium">
                                                    Reasoning
                                                </summary>
                                                <div className="mt-2 border-l-2 border-current/20 pl-2">
                                                    {message.reasoning}
                                                </div>
                                                <div className="mt-2 border-l-2 border-current/20 pl-2">
                                                    {message.image_gen_prompt ?? 'no image prompt'}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Generated Images Section */}
                        {generatedImages.length > 0 && (
                            <div className="bg-card rounded-lg border p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                    <ImageIcon className="h-4 w-4" />
                                    Generated Design Variations
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {generatedImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-muted aspect-square overflow-hidden rounded-lg"
                                        >
                                            <img
                                                src={img}
                                                alt={`Design variation ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm">
                                        Select & Continue
                                    </button>
                                    <button
                                        onClick={generateImages}
                                        className="hover:bg-accent rounded-md border px-4 py-2 text-sm"
                                    >
                                        Generate More
                                    </button>
                                </div>
                            </div>
                        )}

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
                        <button
                            onClick={generateImages}
                            disabled={isGeneratingImages || messages.length < 3}
                            className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
                        >
                            {isGeneratingImages ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ImageIcon className="h-4 w-4" />
                            )}
                            Generate Images
                        </button>
                    </div>

                    <div className="text-muted-foreground mt-2 text-center text-xs">
                        Press Enter to send • Shift+Enter for new line
                    </div>
                </div>
            </div>
        </div>
    )
}
