// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  // Ensure at least one API key is available
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server missing both Groq and Gemini API Keys.' });
  }

  // --- ATTEMPT 1: GROQ (Primary Engine - Ultra Fast) ---
  if (process.env.GROQ_API_KEY) {
    try {
      const groqMessages = [{ role: 'system', content: system }, ...messages];
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          temperature: 0.3
        })
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        return res.status(200).json({ reply: data.choices[0].message.content });
      } else {
        console.warn("Groq failed, attempting Gemini fallback...");
      }
    } catch (error) {
      console.warn("Groq network error, attempting Gemini fallback...", error);
    }
  }

  // --- ATTEMPT 2: GEMINI (Fallback Engine - Highly Capable) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      // Gemini requires a slightly different message format
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: {
            role: "user",
            parts: [{ text: system }]
          },
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json();
        throw new Error(errData.error?.message || 'Gemini API Error');
      }

      const data = await geminiRes.json();
      const reply = data.candidates[0].content.parts[0].text;
      
      return res.status(200).json({ reply: reply });

    } catch (error) {
      console.error('Gemini Fallback Error:', error);
      return res.status(500).json({ error: 'Both AI engines failed to respond. Please try again.' });
    }
  }

  return res.status(500).json({ error: 'API configuration issue.' });
}
