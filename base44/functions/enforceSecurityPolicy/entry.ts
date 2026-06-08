import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, entityId, action, dataClassification } = await req.json();

    // Fetch all active security policies
    const policies = await base44.asServiceRole.entities.SecurityPolicy.filter(
      { status: 'active', enforcement_level: 'mandatory' },
      null,
      1000
    );

    const violations = [];
    const applicablePolicies = [];

    for (const policy of policies) {
      const scope = policy.scope || [];
      const dataClasses = policy.data_classifications_affected || [];

      // Check if policy applies to this entity/action
      if (scope.includes(entityType) || scope.includes('*')) {
        applicablePolicies.push(policy.id);

        const rules = JSON.parse(policy.rules || '{}');

        // Check encryption requirements
        if (policy.encryption_required && !rules.encrypted) {
          violations.push({
            policyId: policy.id,
            policyName: policy.policy_name,
            violation: `Encryption required but not found`,
            severity: 'high'
          });
        }

        // Check data classification access
        if (dataClasses.length > 0 && dataClasses.includes(dataClassification)) {
          if (policy.rbac_roles_restricted && !policy.rbac_roles_restricted.includes(user.role)) {
            violations.push({
              policyId: policy.id,
              policyName: policy.policy_name,
              violation: `User role ${user.role} not authorized for ${dataClassification}`,
              severity: 'critical'
            });
          }
        }

        // Check MFA requirement
        if (policy.requires_mfa && !user.mfa_enabled) {
          violations.push({
            policyId: policy.id,
            policyName: policy.policy_name,
            violation: 'MFA required but not enabled',
            severity: 'high'
          });
        }
      }
    }

    // Log the access attempt
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      event_type: violations.length > 0 ? 'policy_violation' : 'data_access',
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      status: violations.length > 0 ? 'blocked' : 'success',
      timestamp: new Date().toISOString(),
      policy_violation_id: violations.length > 0 ? violations[0].policyId : null,
      threat_level: violations.length > 0 ? 'high' : 'low',
      details: JSON.stringify({
        violations,
        applicablePolicies
      })
    });

    if (violations.length > 0) {
      return Response.json({
        allowed: false,
        violations,
        message: `Access blocked: ${violations[0].violation}`
      }, { status: 403 });
    }

    return Response.json({
      allowed: true,
      applicablePolicies,
      message: 'Access granted'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});