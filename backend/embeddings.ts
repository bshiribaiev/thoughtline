import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  const embedding = res.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Failed to generate embedding: empty response from OpenAI");
  }
  return embedding;
}

export function toPgVectorLiteral(v: number[]) {
  return `[${v.join(",")}]`;
}