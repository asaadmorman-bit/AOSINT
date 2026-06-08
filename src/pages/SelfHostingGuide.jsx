import React, { useState, useEffect } from "react";
import { Server, Cloud, Shield, Monitor, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Terminal, Package, Globe, Lock, Cpu, Database, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const Section = ({ title, icon: Icon, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-white/5">{children}</div>}
    </div>
  );
};

const Step = ({ n, title, children }) => (
  <div className="flex gap-4 mt-4">
    <div className="w-7 h-7 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center shrink-0 text-[#00d4ff] text-xs font-bold mt-0.5">{n}</div>
    <div>
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <div className="text-xs text-gray-400 space-y-1">{children}</div>
    </div>
  </div>
);

const Code = ({ children }) => (
  <pre className="bg-[#0a0e1a] border border-white/10 rounded-lg p-3 text-xs text-[#2ed573] font-mono overflow-x-auto mt-2 whitespace-pre-wrap">{children}</pre>
);

const Check = ({ children, warn }) => (
  <div className={`flex items-start gap-2 text-xs mt-1.5 ${warn ? "text-yellow-400" : "text-gray-300"}`}>
    {warn ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-400" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#2ed573]" />}
    <span>{children}</span>
  </div>
);

export default function SelfHostingGuide() {
  const [activeTab, setActiveTab] = useState("self");
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      const allowed = user?.role === "admin" || user?.email?.endsWith("@eds-360.com");
      setAuthorized(allowed ? true : false);
    }).catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[#00d4ff] text-sm animate-pulse">Verifying access...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          This page is only available to EDS-360 team members and app administrators.
          Contact your administrator if you believe you should have access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1220] to-[#111827] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-3">
          <Server className="w-6 h-6 text-[#00d4ff]" />
          <h1 className="text-2xl font-black text-white">Hosting & Deployment Guide</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-2xl">
          Deploy your Base44 app on your own infrastructure or in the cloud. This guide covers a production-grade setup using <span className="text-[#00d4ff] font-semibold">SELinux</span> on the backend and <span className="text-[#00d4ff] font-semibold">Windows Server 2022+</span> on the frontend / reverse proxy layer.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {["SELinux Backend", "Windows Server 2022+", "Node.js Runtime", "Nginx / IIS", "TLS/SSL", "Zero-Trust Ready"].map(t => (
            <Badge key={t} className="bg-white/5 text-gray-300 border border-white/10 text-[10px]">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab("self")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "self" ? "bg-[#00d4ff] text-black" : "text-gray-400 hover:text-white"}`}>
          <Server className="w-4 h-4" /> Self-Hosted
        </button>
        <button onClick={() => setActiveTab("cloud")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "cloud" ? "bg-[#00d4ff] text-black" : "text-gray-400 hover:text-white"}`}>
          <Cloud className="w-4 h-4" /> Cloud-Hosted
        </button>
      </div>

      {activeTab === "self" && (
        <div className="space-y-4">

          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, color: "bg-red-500/10 text-red-400", label: "Backend (Linux + SELinux)", items: ["RHEL 9 / Rocky Linux 9", "SELinux Enforcing Mode", "Node.js / Deno runtime", "PostgreSQL or MongoDB", "Firewalld + iptables"] },
              { icon: Monitor, color: "bg-blue-500/10 text-blue-400", label: "Frontend (Windows Server)", items: ["Windows Server 2022+", "IIS 10 or Nginx for Win", "React build (static files)", "SSL/TLS via Let's Encrypt", "Windows Defender Firewall"] },
              { icon: Lock, color: "bg-purple-500/10 text-purple-400", label: "Network / Security", items: ["Reverse proxy (Nginx/IIS)", "mTLS between tiers", "WAF (ModSecurity/Azure)", "VPN or Zero Trust access", "SIEM log forwarding"] },
            ].map(card => (
              <div key={card.label} className="bg-[#111827] border border-white/5 rounded-xl p-5">
                <div className={`p-2 rounded-lg ${card.color} w-fit mb-3`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-white mb-3 uppercase tracking-wider">{card.label}</p>
                <div className="space-y-1.5">
                  {card.items.map(i => <Check key={i}>{i}</Check>)}
                </div>
              </div>
            ))}
          </div>

          {/* SELinux Backend Setup */}
          <Section title="Backend Setup — SELinux (RHEL 9 / Rocky Linux 9)" icon={Shield} color="bg-red-500/10 text-red-400" defaultOpen={true}>
            <Step n="1" title="Install OS & Verify SELinux is Enforcing">
              <p>After installing RHEL 9 or Rocky Linux 9, confirm SELinux is active:</p>
              <Code>{`getenforce
# Output should be: Enforcing

sestatus | grep "Current mode"
# Current mode: enforcing`}</Code>
              <Check warn>Never set SELinux to Permissive in production. Use targeted policy instead.</Check>
            </Step>

            <Step n="2" title="Install Node.js / Deno Runtime">
              <Code>{`# Node.js 20 LTS via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# OR install Deno
curl -fsSL https://deno.land/install.sh | sh

# Verify
node --version   # v20.x
deno --version   # 2.x`}</Code>
            </Step>

            <Step n="3" title="Configure SELinux Policy for Node / Deno">
              <Code>{`# Allow Node.js to bind to your app port (e.g. 3000)
sudo semanage port -a -t http_port_t -p tcp 3000

# Allow Node process to connect to the database
sudo setsebool -P httpd_can_network_connect_db 1

# If using Nginx as proxy on this same host
sudo setsebool -P httpd_can_network_connect 1

# Audit denied actions and build a custom module
sudo ausearch -c 'node' --raw | audit2allow -M myapp
sudo semodule -i myapp.pp`}</Code>
            </Step>

            <Step n="4" title="Set Up Systemd Service for the App Backend">
              <Code>{`# /etc/systemd/system/asosint-api.service
[Unit]
Description=ASOSINT API Backend
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/asosint/api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
# SELinux context for the service
SELinuxContext=system_u:system_r:httpd_t:s0

[Install]
WantedBy=multi-user.target`}</Code>
              <Code>{`sudo systemctl daemon-reload
sudo systemctl enable --now asosint-api`}</Code>
            </Step>

            <Step n="5" title="Firewall Rules">
              <Code>{`# Allow only necessary ports
sudo firewall-cmd --permanent --add-port=3000/tcp   # API (internal)
sudo firewall-cmd --permanent --add-port=443/tcp    # HTTPS
sudo firewall-cmd --permanent --add-port=80/tcp     # HTTP redirect
sudo firewall-cmd --reload`}</Code>
              <Check warn>Port 3000 should NOT be exposed publicly. Route all traffic through your reverse proxy.</Check>
            </Step>

            <Step n="6" title="Database (PostgreSQL with SELinux)">
              <Code>{`sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

# SELinux: allow PostgreSQL to accept connections
sudo semanage port -a -t postgresql_port_t -p tcp 5432`}</Code>
            </Step>
          </Section>

          {/* Windows Server Frontend */}
          <Section title="Frontend Setup — Windows Server 2022+" icon={Monitor} color="bg-blue-500/10 text-blue-400" defaultOpen={true}>
            <Step n="1" title="Build the React App">
              <p>On your dev machine or CI/CD pipeline, export the Base44 app and build it:</p>
              <Code>{`npm install
npm run build
# Output: /dist folder with static files`}</Code>
            </Step>

            <Step n="2" title="Install IIS on Windows Server 2022">
              <Code>{`# PowerShell (Run as Administrator)
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
Install-WindowsFeature -Name Web-Url-Auth, Web-IP-Security, Web-Windows-Auth

# Install URL Rewrite Module (required for SPA routing)
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
# Or via Chocolatey:
choco install urlrewrite`}</Code>
            </Step>

            <Step n="3" title="Deploy Static Files">
              <Code>{`# Copy /dist contents to IIS web root
Copy-Item -Path "C:\\build\\dist\\*" -Destination "C:\\inetpub\\wwwroot\\asosint" -Recurse

# Create web.config for SPA routing (React Router)
# Save as C:\\inetpub\\wwwroot\\asosint\\web.config`}</Code>
              <Code>{`<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="Content-Security-Policy" value="default-src 'self'; connect-src 'self' https://api.base44.com https://*.base44.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>`}</Code>
            </Step>

            <Step n="4" title="Enable HTTPS / TLS on IIS">
              <Code>{`# Option A: Use Win-ACME (Let's Encrypt for IIS)
# Download: https://www.win-acme.com/
.\\wacs.exe --target iis --siteid 1 --installation iis

# Option B: Import your enterprise cert via PowerShell
Import-PfxCertificate -FilePath "cert.pfx" -CertStoreLocation Cert:\\LocalMachine\\My -Password (ConvertTo-SecureString "yourpass" -AsPlainText -Force)

# Bind HTTPS in IIS Manager or:
New-WebBinding -Name "asosint" -Protocol "https" -Port 443 -SslFlags 1`}</Code>
            </Step>

            <Step n="5" title="Reverse Proxy IIS → Linux Backend (API)">
              <Code>{`# Install Application Request Routing (ARR) for IIS
# Download: https://www.iis.net/downloads/microsoft/application-request-routing

# In web.config, add a proxy rule for /api/* → Linux backend
<rule name="API Proxy" stopProcessing="true">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://LINUX_SERVER_IP:3000/api/{R:1}" />
</rule>`}</Code>
              <Check warn>Use your Linux server's private/internal IP — never expose port 3000 to the internet.</Check>
            </Step>

            <Step n="6" title="Windows Firewall Rules">
              <Code>{`# PowerShell — allow only HTTP/HTTPS inbound
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Block direct access to backend port from public
New-NetFirewallRule -DisplayName "Block 3000 Public" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Block`}</Code>
            </Step>
          </Section>

          {/* Security Hardening */}
          <Section title="Security Hardening Checklist" icon={Lock} color="bg-purple-500/10 text-purple-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Linux / SELinux</p>
                <Check>SELinux in Enforcing + Targeted policy</Check>
                <Check>Disable SSH password auth — use key only</Check>
                <Check>Run app as non-root user with minimal perms</Check>
                <Check>Enable auditd for syscall monitoring</Check>
                <Check>AIDE file integrity monitoring</Check>
                <Check>Automatic security patches via dnf-automatic</Check>
                <Check warn>Rotate secrets/env vars quarterly</Check>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Windows Server 2022+</p>
                <Check>Enable Windows Defender + ATP</Check>
                <Check>Credential Guard & Device Guard enabled</Check>
                <Check>TLS 1.3 only — disable TLS 1.0/1.1</Check>
                <Check>Apply monthly Patch Tuesday updates</Check>
                <Check>Enable Windows Event Log forwarding to SIEM</Check>
                <Check>Restrict RDP to VPN/Zero Trust only</Check>
                <Check warn>Run IIS application pool as least-privilege identity</Check>
              </div>
            </div>
          </Section>

        </div>
      )}

      {activeTab === "cloud" && (
        <div className="space-y-4">

          {/* Cloud Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "AWS", color: "text-orange-400", bg: "bg-orange-500/10", items: ["EC2 (RHEL 9) for backend", "EC2 (Win Server 2022) for frontend", "RDS PostgreSQL", "ALB + WAF", "CloudWatch logs", "KMS key management"] },
              { label: "Azure", color: "text-blue-400", bg: "bg-blue-500/10", items: ["Azure VM (RHEL 9) backend", "Azure VM (Win 2022) frontend", "Azure SQL / CosmosDB", "App Gateway + WAF", "Azure Monitor + Sentinel", "Azure Key Vault"] },
              { label: "GCP / On-Prem", color: "text-green-400", bg: "bg-green-500/10", items: ["GCE (RHEL 9) backend", "GCE (Win 2022) frontend", "Cloud SQL PostgreSQL", "Cloud Armor WAF", "Cloud Logging + SIEM", "Secret Manager"] },
            ].map(p => (
              <div key={p.label} className="bg-[#111827] border border-white/5 rounded-xl p-5">
                <p className={`text-sm font-black mb-3 ${p.color}`}>{p.label}</p>
                <div className="space-y-1.5">
                  {p.items.map(i => <Check key={i}>{i}</Check>)}
                </div>
              </div>
            ))}
          </div>

          <Section title="Cloud Deployment Steps (AWS Example)" icon={Cloud} color="bg-orange-500/10 text-orange-400" defaultOpen={true}>
            <Step n="1" title="Provision EC2 Instances">
              <Code>{`# Backend: RHEL 9 + SELinux
aws ec2 run-instances \\
  --image-id ami-RHEL9-ID \\
  --instance-type t3.medium \\
  --key-name my-key \\
  --security-group-ids sg-backend \\
  --subnet-id subnet-private \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=asosint-backend}]'

# Frontend: Windows Server 2022
aws ec2 run-instances \\
  --image-id ami-WIN2022-ID \\
  --instance-type t3.medium \\
  --key-name my-key \\
  --security-group-ids sg-frontend \\
  --subnet-id subnet-public`}</Code>
            </Step>

            <Step n="2" title="Security Groups">
              <Code>{`# Backend SG: allow only from frontend SG on port 3000
aws ec2 authorize-security-group-ingress \\
  --group-id sg-backend \\
  --protocol tcp --port 3000 \\
  --source-group sg-frontend

# Frontend SG: allow 443/80 from internet
aws ec2 authorize-security-group-ingress \\
  --group-id sg-frontend \\
  --protocol tcp --port 443 --cidr 0.0.0.0/0`}</Code>
            </Step>

            <Step n="3" title="Application Load Balancer + ACM SSL">
              <Code>{`# Request cert
aws acm request-certificate \\
  --domain-name app.yourdomain.com \\
  --validation-method DNS

# Create ALB pointing to Windows Server target group
# Attach SSL cert via HTTPS listener on port 443`}</Code>
            </Step>

            <Step n="4" title="Enable AWS WAF">
              <Code>{`# Attach managed rule groups to your ALB
aws wafv2 associate-web-acl \\
  --web-acl-arn arn:aws:wafv2:... \\
  --resource-arn arn:aws:elasticloadbalancing:...`}</Code>
              <Check>Enable AWSManagedRulesCommonRuleSet</Check>
              <Check>Enable AWSManagedRulesKnownBadInputsRuleSet</Check>
              <Check warn>Set WAF to block mode, not count, in production</Check>
            </Step>

            <Step n="5" title="Store Secrets Securely">
              <Code>{`# Store your Base44 API keys, DB passwords in Secrets Manager
aws secretsmanager create-secret \\
  --name asosint/prod/env \\
  --secret-string '{"BASE44_APP_ID":"...","DB_PASSWORD":"..."}'

# Retrieve in your app at startup
aws secretsmanager get-secret-value --secret-id asosint/prod/env`}</Code>
            </Step>
          </Section>

          <Section title="Cloud Security Hardening" icon={Lock} color="bg-purple-500/10 text-purple-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Cloud-Specific</p>
                <Check>Enable CloudTrail / Activity Log for all API calls</Check>
                <Check>Enable GuardDuty / Defender for Cloud</Check>
                <Check>Use IAM roles — no static access keys on EC2</Check>
                <Check>Enable VPC Flow Logs</Check>
                <Check>S3 / Storage buckets: block all public access</Check>
                <Check warn>Never store secrets in userdata or environment variables in plain text</Check>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Shared (Both Tiers)</p>
                <Check>Private subnet for backend, public only for LB</Check>
                <Check>mTLS between frontend and backend</Check>
                <Check>Patch AMIs monthly and rotate instances</Check>
                <Check>Enable auto-scaling for high availability</Check>
                <Check>Multi-AZ deployment for failover</Check>
                <Check warn>Always test disaster recovery runbooks quarterly</Check>
              </div>
            </div>
          </Section>

        </div>
      )}

      {/* Footer Note */}
      <div className="bg-[#111827] border border-[#00d4ff]/10 rounded-xl p-5 flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#00d4ff] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white mb-1">Base44 App Export</p>
          <p className="text-xs text-gray-400">
            Export your Base44 app source code from the dashboard under <span className="text-[#00d4ff]">Settings → Export</span>. 
            You'll receive a standard Vite + React project that can be built with <code className="text-[#2ed573] bg-white/5 px-1 rounded">npm run build</code> and deployed using the steps above. 
            The backend functions (Deno) can be self-hosted using <span className="text-[#00d4ff]">Deno Deploy</span>, a self-managed Deno server, or adapted to Node.js/Express.
          </p>
        </div>
      </div>

    </div>
  );
}