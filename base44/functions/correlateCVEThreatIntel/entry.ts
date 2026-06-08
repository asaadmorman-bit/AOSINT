import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { cve_ids = [] } = await req.json();
  if (!cve_ids.length) return Response.json({ correlations: [] });

  // Use LLM with internet context to correlate CVEs against threat actor activity
  const prompt = `You are a cyber threat intelligence analyst. For the following CVEs found in an organization's environment, provide detailed threat intelligence correlation:

CVEs: ${cve_ids.slice(0, 20).join(', ')}

For each CVE, provide:
1. Known threat actor groups actively exploiting it (APT groups, ransomware gangs, criminal groups)
2. Known exploit kits that include this CVE
3. Attack campaigns using this CVE
4. MITRE ATT&CK techniques associated with exploitation
5. Geographic origin of threats (countries)
6. Exploitation timeline (when was it first weaponized)
7. Target industries most affected
8. Exploitation method (remote code execution, privilege escalation, etc.)
9. Severity context (is it being used in active ransomware campaigns?)

Return structured data for visualization. Focus on real, documented threat intelligence.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        correlations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cve_id: { type: "string" },
              threat_actors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    country: { type: "string" },
                    confidence: { type: "number" },
                    active_campaigns: { type: "array", items: { type: "string" } }
                  }
                }
              },
              exploit_kits: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    first_seen: { type: "string" },
                    activity_level: { type: "string" }
                  }
                }
              },
              attack_campaigns: {
                type: "array",
                items: { type: "string" }
              },
              mitre_techniques: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    tactic: { type: "string" }
                  }
                }
              },
              target_industries: { type: "array", items: { type: "string" } },
              origin_countries: { type: "array", items: { type: "string" } },
              exploitation_method: { type: "string" },
              first_weaponized: { type: "string" },
              ransomware_association: { type: "boolean" },
              ransomware_groups: { type: "array", items: { type: "string" } },
              exploitation_volume: { type: "string" },
              risk_context: { type: "string" }
            }
          }
        },
        summary: {
          type: "object",
          properties: {
            total_threat_actors: { type: "integer" },
            total_exploit_kits: { type: "integer" },
            ransomware_linked_cves: { type: "integer" },
            most_dangerous_cve: { type: "string" },
            top_targeting_country: { type: "string" },
            overall_risk_level: { type: "string" }
          }
        }
      }
    }
  });

  return Response.json(result);
});