// src/app/api/tts/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON payload
    const { text } = await request.json();

    // Get your API key from the environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error("Google Cloud API key is not set");
    }

    // Build the URL for the TTS endpoint with your API key
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    // Construct the request payload for TTS
    const payload = {
      input: { text },
      voice: { languageCode: 'hi-IN', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' }
    };

    // Call the TTS API
    const ttsResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS API error: ${ttsResponse.statusText}`);
    }

    const data = await ttsResponse.json();

    // Check for audio content in the response (base64-encoded)
    if (!data.audioContent) {
      throw new Error("No audio content returned from TTS API");
    }

    // Convert the base64-encoded audio content to a Buffer
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    // Return the audio with the proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
