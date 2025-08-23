import OpenAI from 'openai'

const apiKey = process.env.SOLARAI_API_KEY
const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.upstage.ai/v1',
})

export async function POST(req: Request) {
    const {
        context,
        messages,
    }: {
        context: { prompt: string; type: string; sessionId: string }
        messages: []
    } = await req.json()

    const chatCompletion = await openai.chat.completions.create({
        model: 'solar-pro2',
        messages: [
            {
                role: 'system',
                content: `You are an AI design assistant. This tool is called RealizeIt and it generates AI images and then makes real life products using those images. You will output JSON with the \`image_gen_prompt\` value being your summarized prompt to generate the AI image. you are located in the new design creation page. you are helping the user figure out what their initial deisgn idea is so we can generate it. you will also recieve feedback from the user and will make updates to your design prompt. Your aim is to find the user's perfect design. the design in their mind. the user might not always know what they want, so it's your job to find that out using follow up questions and leading idea suggestions. Always return structured json. Never reply with text or address the user's response directly.
{
    "content": "your main response here. talk to the user here. ask follow ups to help get a clear picture of what the user wants.",
    "reasoning": "your thought process and reasoning here",
    "image_gen_prompt": "optional - only when ready to generate an image. we should be sure of the user's requested image before acting. image generation is expensive and we want to make sure we are ready to commit to a design before sending this. if the user is talking without a specific request, do not generate an iamge. providing this value will automatically trigger an image generation job."
}
`,
            },
            {
                role: 'user',
                content: context.prompt,
            },
            ...messages,
        ],
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            try {
                let accumulatedContent = ''

                for await (const chunk of chatCompletion) {
                    const content = chunk.choices[0]?.delta?.content || ''
                    accumulatedContent += content

                    // Try to parse complete JSON objects
                    try {
                        const parsed = JSON.parse(accumulatedContent)
                        // If parsing succeeds, we have a complete JSON object
                        const responseChunk = JSON.stringify(parsed)
                        controller.enqueue(new TextEncoder().encode(`data: ${responseChunk}\n`))
                        accumulatedContent = '' // Reset for next potential object
                    } catch (parseError) {
                        // JSON is incomplete, continue accumulating
                        // Send incremental content updates if we can extract partial content
                        const contentMatch = accumulatedContent.match(/"content":\s*"([^"]*)"/)
                        if (contentMatch && contentMatch[1]) {
                            const partialChunk = JSON.stringify({
                                content: contentMatch[1],
                                partial: true,
                            })
                            controller.enqueue(new TextEncoder().encode(`data: ${partialChunk}\n`))
                        }
                    }
                }

                // Final attempt to parse any remaining content
                if (accumulatedContent.trim()) {
                    try {
                        const parsed = JSON.parse(accumulatedContent)
                        const responseChunk = JSON.stringify(parsed)
                        controller.enqueue(new TextEncoder().encode(`data: ${responseChunk}\n`))
                    } catch (parseError) {
                        // If we can't parse, send the raw content
                        const fallbackChunk = JSON.stringify({
                            content: accumulatedContent,
                            reasoning: 'Failed to parse structured response',
                        })
                        controller.enqueue(new TextEncoder().encode(`data: ${fallbackChunk}\n`))
                    }
                }

                controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n`)
                )
            } catch (err: any) {
                const errorChunk = JSON.stringify({ error: err.message })
                controller.enqueue(new TextEncoder().encode(`data: ${errorChunk}\n`))
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    })
}
