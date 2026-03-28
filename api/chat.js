export const config = {
  runtime: 'edge', // Bypasses Vercel's 10-second timeout limit
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { messages, system } = await req.json();

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'CRITICAL_ERROR: Missing API Keys in Vercel Environment Variables.' }), { status: 500 });
    }

    // 1. Analyze the Payload Size & Content
    const hasImage = messages.some(msg => msg.content && msg.content.includes('[IMAGE_DATA:'));
    const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0);
    
    // If it's a massive PDF or an image, Groq will crash. Route directly to Gemini.
    const requiresGemini = hasImage || totalChars > 25000;

    // 2. ATTEMPT 1: GROQ (Only for fast, text-only queries under 25k chars)
    if (!requiresGemini && process.env.GROQ_API_KEY) {
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
        console.warn("Groq failed, falling back to Gemini...");
      }
    }

    // 3. ATTEMPT 2: GEMINI (For massive PDFs, Images, or if Groq failed)
    if (process.env.GEMINI_API_KEY) {
      
      const geminiMessages = [];
      let currentRole = null;
      let currentParts = [];

      messages.forEach(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts = [];
        let textContent = msg.content || "";

        // Extract Base64 Images safely
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

        // Merge logic to prevent consecutive role crashes
        if (role === currentRole) {
          currentParts.push(...parts);
        } else {
          if (currentRole) {
            geminiMessages.push({ role: currentRole, parts: currentParts });
          }
          currentRole = role;
          currentParts = parts;
        }
      });
      
      if (currentRole) {
        geminiMessages.push({ role: currentRole, parts: currentParts });
      }

      // THE FIX: Changed 'gemini-1.5-pro' to the active 'gemini-2.5-pro' model
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: { role: "user", parts: [{ text: system }] },
          generationConfig: { temperature: 0.3 }
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        if (data.candidates && data.candidates[0].content) {
            return new Response(JSON.stringify({ reply: data.candidates[0].content.parts[0].text }), { status: 200 });
        }
      } else {
         const errData = await geminiRes.json();
         return new Response(JSON.stringify({ error: `GEMINI_REJECTED: ${errData.error?.message || 'Unknown API Error'}` }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ error: 'AI_CRASH: Both engines failed. Please check Vercel Logs.' }), { status: 500 });

  } catch (error) {
    return new Response(JSON.stringify({ error: `BACKEND_FATAL: ${error.message}` }), { status: 500 });
  }
}
