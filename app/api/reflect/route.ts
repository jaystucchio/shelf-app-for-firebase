import { generateText } from 'ai'

export async function POST(req: Request) {
  const { bookTitle, bookAuthor, prompt, userThoughts } = await req.json()

  const systemPrompt = `You are a thoughtful literary companion helping a reader reflect on their reading experience. 
You're warm, insightful, and genuinely curious about the reader's experience with books.
Keep responses concise (2-3 sentences) but meaningful. 
Don't be generic - engage specifically with what the reader shared.`

  const userPrompt = userThoughts
    ? `The reader is reflecting on "${bookTitle}" by ${bookAuthor}.
    
Prompt: "${prompt}"

Their thoughts so far: "${userThoughts}"

Help them expand on this reflection with a brief, thoughtful follow-up or insight. Don't repeat what they said.`
    : `The reader is about to reflect on "${bookTitle}" by ${bookAuthor}.

Prompt: "${prompt}"

Give them a brief, engaging starter thought or question to help them begin their reflection. Be specific to this prompt.`

  const { text } = await generateText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 150,
    temperature: 0.8,
  })

  return Response.json({ text })
}
