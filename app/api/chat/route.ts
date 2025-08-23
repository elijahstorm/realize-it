import OpenAI from 'openai'

const apiKey = process.env.SOLARAI_API_KEY
const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.upstage.ai/v1',
})

export async function POST(req: Request) {
    const {
        messages,
    }: {
        messages: []
    } = await req.json()

    const chatCompletion = await openai.chat.completions.create({
        model: 'solar-pro2',
        messages,
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of chatCompletion) {
                    const content = chunk.choices[0]?.delta?.content || ''
                    controller.enqueue(new TextEncoder().encode(content))
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
        },
    })
}
