import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Smartphone, Key, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MFAManagement() {
  const [mfaSettings, setMFASettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(null); // 'totp' or 'sms'
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [verifying, setVerifying] = useState(false);

  // Load MFA settings
  useEffect(() => {
    const loadMFASettings = async () => {
      try {
        const user = await base44.auth.me();
        const settings = await base44.entities.MFASettings.filter({ user_email: user.email });
        setMFASettings(settings[0] || null);
      } catch (error) {
        console.error("Error loading MFA settings:", error);
        toast.error("Failed to load MFA settings");
      } finally {
        setLoading(false);
      }
    };

    loadMFASettings();
  }, []);

  // Setup TOTP
  const handleSetupTOTP = async () => {
    try {
      setVerifying(true);
      const response = await base44.functions.invoke("setupTOTP");
      setTotpSetup(response.data);
      setSetupMode("totp");
    } catch (error) {
      toast.error("Failed to generate TOTP");
    } finally {
      setVerifying(false);
    }
  };

  // Verify TOTP code
  const handleVerifyTOTP = async () => {
    if (totpCode.length !== 6) {
      toast.error("Code must be 6 digits");
      return;
    }

    try {
      setVerifying(true);
      const response = await base44.functions.invoke("verifyTOTP", { code: totpCode });
      setBackupCodes(response.data.backup_codes);
      toast.success("TOTP activated successfully!");
      setSetupMode(null);
      setTotpCode("");
      const user = await base44.auth.me();
      const updated = await base44.entities.MFASettings.filter({ user_email: user.email });
      setMFASettings(updated[0]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // Setup SMS
  const handleSetupSMS = async () => {
    if (!smsPhone.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error("Invalid phone number");
      return;
    }

    try {
      setVerifying(true);
      const response = await base44.functions.invoke("setupSMS", { phone_number: smsPhone });
      toast.success("Code sent to " + response.data.masked_phone);
      setSetupMode("sms-verify");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send code");
    } finally {
      setVerifying(false);
    }
  };

  // Verify SMS code
  const handleVerifySMS = async () => {
    if (smsCode.length !== 6) {
      toast.error("Code must be 6 digits");
      return;
    }

    try {
      setVerifying(true);
      await base44.functions.invoke("verifySMS", { code: smsCode });
      toast.success("SMS MFA activated successfully!");
      setSetupMode(null);
      setSmsCode("");
      const user = await base44.auth.me();
      const updated = await base44.entities.MFASettings.filter({ user_email: user.email });
      setMFASettings(updated[0]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // Disable MFA method
  const handleDisableMFA = async (method) => {
    if (!window.confirm(`Disable ${method.toUpperCase()} MFA?`)) return;

    try {
      const updateData = {};
      if (method === "totp") {
        updateData.totp_enabled = false;
        updateData.totp_verified = false;
      } else {
        updateData.sms_enabled = false;
        updateData.sms_verified = false;
      }

      await base44.asServiceRole.entities.MFASettings.update(mfaSettings.id, updateData);
      toast.success(`${method.toUpperCase()} MFA disabled`);
      setMFASettings({ ...mfaSettings, ...updateData });
    } catch (error) {
      toast.error("Failed to disable MFA");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-lg font-semibold">Multi-Factor Authentication</h2>
        </div>
        <p className="text-xs text-gray-400">Enhance your account security with additional verification</p>
      </div>

      {/* TOTP Section */}
      <div className="border border-white/10 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-[#00d4ff] mt-0.5" />
            <div>
              <h3 className="font-medium">Authenticator App (TOTP)</h3>
              <p className="text-xs text-gray-400 mt-1">Use Google Authenticator, Authy, or Microsoft Authenticator</p>
            </div>
          </div>
          {mfaSettings?.totp_enabled && <Check className="w-5 h-5 text-[#2ed573]" />}
        </div>

        {mfaSettings?.totp_enabled ? (
          <div className="mt-4">
            <div className="bg-[#2ed573]/10 border border-[#2ed573]/20 rounded px-3 py-2 text-xs mb-3">
              ✓ Authenticator app is enabled
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDisableMFA("totp")}>
              Disable TOTP
            </Button>
          </div>
        ) : setupMode === "totp" ? (
          <div className="mt-4 space-y-4">
            {totpSetup && (
              <>
                <div className="bg-white/5 p-4 rounded text-center">
                  <img src={totpSetup.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Manual entry key:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/5 px-3 py-2 rounded text-xs font-mono">{totpSetup.secret}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSetup.secret);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.slice(0, 6))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-center font-mono"
                    maxLength="6"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSetupMode(null); setTotpCode(""); }} disabled={verifying}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleVerifyTOTP} disabled={verifying || totpCode.length !== 6}>
                    {verifying ? "Verifying..." : "Verify & Activate"}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Button className="mt-4" size="sm" onClick={handleSetupTOTP} disabled={verifying}>
            {verifying ? "Setting up..." : "Set Up Authenticator"}
          </Button>
        )}
      </div>

      {/* SMS Section */}
      <div className="border border-white/10 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-[#00d4ff] mt-0.5" />
            <div>
              <h3 className="font-medium">SMS Verification</h3>
              <p className="text-xs text-gray-400 mt-1">Receive verification codes via text message</p>
            </div>
          </div>
          {mfaSettings?.sms_enabled && <Check className="w-5 h-5 text-[#2ed573]" />}
        </div>

        {mfaSettings?.sms_enabled ? (
          <div className="mt-4">
            <div className="bg-[#2ed573]/10 border border-[#2ed573]/20 rounded px-3 py-2 text-xs mb-3">
              ✓ SMS verification enabled for {mfaSettings.sms_phone}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDisableMFA("sms")}>
              Disable SMS
            </Button>
          </div>
        ) : setupMode === "sms" ? (
          <div className="mt-4 space-y-3">
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSetupMode(null); setSmsPhone(""); }} disabled={verifying}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSetupSMS} disabled={verifying}>
                {verifying ? "Sending..." : "Send Code"}
              </Button>
            </div>
          </div>
        ) : setupMode === "sms-verify" ? (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.slice(0, 6))}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-center font-mono"
              maxLength="6"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSetupMode(null); setSmsCode(""); }} disabled={verifying}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleVerifySMS} disabled={verifying || smsCode.length !== 6}>
                {verifying ? "Verifying..." : "Verify & Activate"}
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4" size="sm" onClick={() => setSetupMode("sms")} disabled={verifying}>
            Set Up SMS
          </Button>
        )}
      </div>

      {/* Backup Codes */}
      {backupCodes.length > 0 && (
        <div className="border border-[#ffa502]/30 bg-[#ffa502]/5 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-[#ffa502] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Save Your Backup Codes</h4>
              <p className="text-xs text-gray-400 mt-1">Store these in a safe place. Use if you lose access to your MFA device.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <code key={i} className="bg-white/5 px-2 py-1 rounded text-xs font-mono">{code}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}