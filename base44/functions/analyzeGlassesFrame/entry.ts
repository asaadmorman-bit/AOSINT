import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { agent_id, device, location, frame_base64, frame_url } = await req.json();
  if (!agent_id || !device || !location) {
    return Response.json({ error: 'agent_id, device, location are required' }, { status: 400 });
  }

  // Upload frame if base64 provided
  let uploadedUrl = frame_url || null;
  if (frame_base64) {
    const byteStr = atob(frame_base64.replace(/^data:image\/\w+;base64,/, ''));
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');
    const upload = await base44.integrations.Core.UploadFile({ file: blob });
    uploadedUrl = upload.file_url;
  }

  // Build AI prompt
  const promptBase = `You are a tactical threat assessment AI analyzing a live camera feed from smart glasses worn by a field agent.

Agent: ${agent_id}
Device: ${device}
Location: ${location}

${uploadedUrl ? "Analyze the provided camera frame image." : "No image frame was provided — generate a realistic situational assessment based on location context."}

Respond with a JSON object:
{
  "ai_description": "1-2 sentence tactical assessment of what is visible and any threat indicators",
  "severity": "CRIT | HIGH | MED | LOW | CLEAR",
  "threat_detected": true or false,
  "confidence": 0-100,
  "tags": ["array", "of", "threat", "tags"]
}

Be concise. Focus on: suspicious behavior, weapons, crowds, vehicles, environmental hazards.`;

  const aiResult = await base44.integrations.Core.InvokeLLM({
    prompt: promptBase,
    file_urls: uploadedUrl ? [uploadedUrl] : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        ai_description: { type: "string" },
        severity:       { type: "string" },
        threat_detected:{ type: "boolean" },
        confidence:     { type: "number" },
        tags:           { type: "array", items: { type: "string" } }
      }
    }
  });

  // Save to GlassesFeed entity
  const record = await base44.entities.GlassesFeed.create({
    agent_id,
    device,
    location,
    frame_url:       uploadedUrl,
    ai_description:  aiResult.ai_description  || "No threats detected.",
    severity:        aiResult.severity         || "CLEAR",
    threat_detected: aiResult.threat_detected  || false,
    confidence:      aiResult.confidence       || 0,
    tags:            aiResult.tags             || [],
  });

  return Response.json({ success: true, record });
});