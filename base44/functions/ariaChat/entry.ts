import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OpenAIARIA");

    if (!OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const SYSTEM_CONTEXT = `You are ARIA (ASOSINT Reasoning & Intelligence Assistant) — an advanced AI analyst embedded in the ASOSINT threat intelligence platform. Expert in CTI, OSINT tradecraft, MITRE ATT&CK, IR workflows, SOC operations, geopolitical analysis, and IC analytical standards (ICD 203, 206). Communicate in a precise, professional analyst voice. Use structured formatting. Cite MITRE technique IDs. Flag confidence levels.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          { role: "system", content: SYSTEM_CONTEXT + (context ? "\n\n" + context : "") },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err.error?.message || "OpenAI error" }, { status: response.status });
    }

    const data = await response.json();
    return Response.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});