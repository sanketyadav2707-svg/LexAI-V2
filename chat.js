// api/chat.js

export const config = {
  runtime: 'edge', // THE FIX: Bypasses Vercel's 10-second Hobby limit
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { messages, system } = await req.json();

    const hasImage = messages.some(msg => msg.content && msg.content.includes('[IMAGE_DATA:'));

    // ATTEMPT 1: GROQ (Fast Text/PDF Processing)
    if (!hasImage && process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: system }, ...messages],
            temperature: 0.3
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          return new Response(JSON.stringify({ reply: data.choices[0].message.content }), { status: 200 });
        }
      } catch (e) {
        console.warn("Groq encountered an error (likely context limit), failing over to Gemini...");
      }
    }

    // ATTEMPT 2: GEMINI (Deep Context & Vision)
    if (process.env.GEMINI_API_KEY) {
      
      // THE FIX: Gemini crashes if roles don't alternate perfectly. This merges consecutive roles.
      const mergedMessages = [];
      let currentRole = null;
      let currentParts = [];

      messages.forEach(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts = [];
        let textContent = msg.content;

        if (textContent.includes('[IMAGE_DATA:')) {
          const regex = /\[IMAGE_DATA:(.*?)\](.*?)(\n|$)/g;
          let match;
          while ((match = regex.exec(textContent)) !== null) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            textContent = textContent.replace(match[0], ''); 
          }
        }
        
        if (textContent.trim()) parts.push({ text: textContent.trim() });
        if (parts.length === 0) parts.push({ text: "(Attached File)" });

        if (role === currentRole) {
          currentParts.push(...parts); // Merge into the same role
        } else {
          if (currentRole) {
            mergedMessages.push({ role: currentRole, parts: currentParts });
          }
          currentRole = role;
          currentParts = parts;
        }
      });
      
      if (currentRole) {
        mergedMessages.push({ role: currentRole, parts: currentParts });
      }

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: mergedMessages,
          systemInstruction: { role: "user", parts: [{ text: system }] },
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json();
        throw new Error(errData.error?.message || 'Gemini API Error');
      }

      const data = await geminiRes.json();
      return new Response(JSON.stringify({ reply: data.candidates[0].content.parts[0].text }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'API Keys missing. Please check Vercel Environment Variables.' }), { status: 500 });

  } catch (error) {
    // Surface the EXACT error so we aren't guessing anymore
    return new Response(JSON.stringify({ error: `Backend Error: ${error.message}` }), { status: 500 });
  }
}
