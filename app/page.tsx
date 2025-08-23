'use client'

import { DOMAttributes, useState } from 'react'

export default function Home() {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const sendMessage: DOMAttributes<HTMLFormElement>['onSubmit'] = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { role: 'user' as const, content: input }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        const res = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [...messages, userMsg] }),
        })

        if (!res.body) return

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let botMsg = { role: 'assistant' as const, content: '' }
        setMessages((prev) => [...prev, botMsg])

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            botMsg.content += chunk
            setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...botMsg }
                return updated
            })
        }

        setLoading(false)
    }

    return (
        <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-6 p-8 font-sans sm:p-20">
            <main className="row-start-2 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-4">
                <div className="max-h-[70vh] flex-1 space-y-2 overflow-y-auto">
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`rounded-lg p-2 ${
                                m.role === 'user'
                                    ? 'self-end bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                            {m.content}
                        </div>
                    ))}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        className="flex-1 rounded-lg border px-3 py-2"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                    >
                        Send
                    </button>
                </form>
            </main>
        </div>
    )
}
