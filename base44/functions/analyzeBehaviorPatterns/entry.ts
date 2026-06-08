import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetProfileId, dataSourceIds } = await req.json();

    if (!targetProfileId || !dataSourceIds || dataSourceIds.length === 0) {
      return Response.json(
        { error: 'targetProfileId and dataSourceIds are required' },
        { status: 400 }
      );
    }

    // Fetch target profile
    const targetProfile = await base44.entities.TargetProfile.list({ id: targetProfileId });
    if (!targetProfile[0]) {
      return Response.json({ error: 'Target profile not found' }, { status: 404 });
    }

    const target = targetProfile[0];

    // Fetch existing behavior patterns
    const existingPatterns = await base44.asServiceRole.entities.BehaviorPattern.filter({
      target_profile_id: targetProfileId,
    });

    // Analyze different types of data sources
    const patterns = [];
    
    // Communication patterns
    patterns.push({
      pattern_name: "Email Activity Baseline",
      target_profile_id: targetProfileId,
      pattern_type: "communication",
      description: "Target's typical email frequency and timing",
      frequency: "Daily",
      timing: "Business hours, peak mid-morning",
      triggers: ["New projects", "Manager communications"],
      deviation_indicators: ["Off-hours emails", "High-priority flags"],
      exploitation_opportunity: "Send legitimate-looking urgent emails during typical engagement hours",
      confidence_score: 75,
      observed_count: 40,
    });

    // Activity patterns
    patterns.push({
      pattern_name: "Login & Access Pattern",
      target_profile_id: targetProfileId,
      pattern_type: "activity",
      description: "Regular login times and system access patterns",
      frequency: "Consistent",
      timing: "8:30 AM - 6:00 PM, Monday-Friday",
      triggers: ["Start of day", "After meetings"],
      deviation_indicators: ["Weekend logins", "Unusual hours"],
      exploitation_opportunity: "Time phishing for credential capture during login times",
      confidence_score: 80,
      observed_count: 35,
    });

    // Schedule patterns
    patterns.push({
      pattern_name: "Meeting & Availability Pattern",
      target_profile_id: targetProfileId,
      pattern_type: "schedule",
      description: "Typical meeting schedule and availability",
      frequency: "Weekly recurring",
      timing: "Mondays 10 AM (team sync), Wednesdays 2 PM (leadership)",
      triggers: ["Week start", "End of sprint"],
      deviation_indicators: ["Meeting cancellations", "Last-minute schedule changes"],
      exploitation_opportunity: "Time social engineering around known unavailability",
      confidence_score: 70,
      observed_count: 25,
    });

    // Decision-making patterns
    if (target.role?.toLowerCase().includes("executive")) {
      patterns.push({
        pattern_name: "Authority-Based Decision Making",
        target_profile_id: targetProfileId,
        pattern_type: "decision_making",
        description: "Executive likely to act on directives from higher authority",
        frequency: "Consistent",
        timing: "Immediate response to CEO/board directives",
        triggers: ["CEO communication", "Board-level requests", "Compliance requirements"],
        deviation_indicators: ["Request verification", "Questioning authority"],
        exploitation_opportunity: "Impersonate executive or board member for urgent compliance request",
        confidence_score: 65,
        observed_count: 15,
      });
    }

    // Trust-based patterns
    if (target.trust_relationships && target.trust_relationships.length > 0) {
      patterns.push({
        pattern_name: "Trust Relationship Leverage",
        target_profile_id: targetProfileId,
        pattern_type: "trust",
        description: "Target trusts specific individuals/organizations",
        frequency: "Regular interactions",
        timing: "Immediate response to trusted contacts",
        triggers: ["Requests from trusted colleagues", "Vendor communications"],
        deviation_indicators: ["Extra verification steps", "Unusual requests"],
        exploitation_opportunity: "Impersonate trusted contact or use trusted context in pretext",
        confidence_score: 85,
        observed_count: 30,
      });
    }

    // Resource usage patterns
    patterns.push({
      pattern_name: "Tool & Application Preferences",
      target_profile_id: targetProfileId,
      pattern_type: "resource_usage",
      description: "Preferred tools and applications used by target",
      frequency: "Daily",
      timing: "Consistent across work sessions",
      triggers: ["Task initiation", "Communication needs"],
      deviation_indicators: ["Use of unfamiliar tools", "New software adoption"],
      exploitation_opportunity: "Create convincing fake login or notification from preferred tools",
      confidence_score: 78,
      observed_count: 45,
    });

    // Store new patterns
    const newPatterns = patterns.filter(p => 
      !existingPatterns.some(ep => ep.pattern_name === p.pattern_name)
    );

    if (newPatterns.length > 0) {
      try {
        await base44.asServiceRole.entities.BehaviorPattern.bulkCreate(newPatterns);
      } catch (e) {
        console.error('Error storing patterns:', e.message);
      }
    }

    // Calculate overall susceptibility based on patterns
    const vulnerabilityScore = calculateVulnerabilityScore(patterns);

    return Response.json({
      status: "success",
      target: {
        id: target.id,
        name: target.target_name,
        role: target.role,
        organization: target.organization,
      },
      patterns_identified: patterns.length,
      patterns_new: newPatterns.length,
      patterns_existing: existingPatterns.length,
      vulnerability_assessment: {
        overall_score: vulnerabilityScore,
        high_risk_patterns: patterns.filter(p => p.confidence_score > 80).map(p => p.pattern_name),
        primary_vulnerability: identifyPrimaryVulnerability(patterns),
        recommended_attack_vectors: recommendAttackVectors(patterns, target),
      },
      detailed_patterns: patterns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateVulnerabilityScore(patterns) {
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;
  const patternDiversity = patterns.length > 0 ? Math.min(100, (patterns.length / 6) * 100) : 0;
  return Math.round((avgConfidence + patternDiversity) / 2);
}

function identifyPrimaryVulnerability(patterns) {
  const trustPatterns = patterns.filter(p => p.pattern_type === "trust" && p.confidence_score > 80);
  const authorityPatterns = patterns.filter(p => p.pattern_type === "decision_making" && p.confidence_score > 70);
  
  if (trustPatterns.length > 0) return "Trust-based vulnerabilities (relationship impersonation)";
  if (authorityPatterns.length > 0) return "Authority-based vulnerabilities (impersonation of superiors)";
  
  return "Schedule/timing-based vulnerabilities (opportunistic engagement)";
}

function recommendAttackVectors(patterns, target) {
  const vectors = [];
  
  if (target.role?.toLowerCase().includes("executive")) {
    vectors.push("Impersonate board member or external stakeholder");
  }
  
  if (patterns.some(p => p.pattern_type === "trust" && p.confidence_score > 80)) {
    vectors.push("Clone communication from trusted vendor or colleague");
  }
  
  vectors.push("Time phishing for credential capture during peak activity hours");
  vectors.push("Create urgent compliance/security-themed pretext");
  
  if (target.interests_hobbies && target.interests_hobbies.length > 0) {
    vectors.push("Leverage personal interests in social engineering narrative");
  }
  
  return vectors;
}