import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

import { SYSTEM_INSTRUCTION } from '@/content/site';

// The Gemini key now stays on the server (GEMINI_API_KEY) instead of being
// shipped to every visitor's browser as NEXT_PUBLIC_GEMINI_API_KEY.
export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "I'm offline at the moment. Please reach out to Clark directly.",
    });
  }

  let message = '';
  try {
    const body = await req.json();
    message = String(body?.message ?? '').slice(0, 2000);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!message.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview',
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });
    const result = await chat.sendMessage({ message });
    return NextResponse.json({ reply: result.text ?? null });
  } catch (err) {
    console.error('Assistant error', err);
    return NextResponse.json({ reply: null }, { status: 502 });
  }
}
