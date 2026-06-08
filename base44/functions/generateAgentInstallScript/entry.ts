import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { target_type, agent_name, asset_id, asset_name, scan_interval_minutes = 60, auto_scan = true } = await req.json();

  // Generate a unique agent token
  const tokenBytes = new Uint8Array(24);
  crypto.getRandomValues(tokenBytes);
  const agentToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Create the DeployedAgent record
  const agent = await base44.asServiceRole.entities.DeployedAgent.create({
    agent_name: agent_name || `Agent-${target_type}-${Date.now()}`,
    target_type,
    asset_id: asset_id || '',
    asset_name: asset_name || '',
    status: 'pending',
    agent_token: agentToken,
    scan_interval_minutes,
    auto_scan,
    deployed_by: user.email,
    agent_version: '1.0.0',
  });

  const appUrl = Deno.env.get('APP_BASE_URL') || 'https://your-asosint-instance.com';
  const apiEndpoint = `${appUrl}/api/agent/checkin`;

  // Generate install scripts per platform
  const scripts = {
    linux: generateLinuxScript(agentToken, apiEndpoint, scan_interval_minutes, agent.id),
    windows: generateWindowsScript(agentToken, apiEndpoint, scan_interval_minutes, agent.id),
    macos: generateMacosScript(agentToken, apiEndpoint, scan_interval_minutes, agent.id),
    android: generateAndroidInstructions(agentToken, apiEndpoint, agent.id),
    ios: generateIOSInstructions(agentToken, apiEndpoint, agent.id),
    docker: generateDockerScript(agentToken, apiEndpoint, scan_interval_minutes, agent.id),
    kubernetes: generateK8sScript(agentToken, apiEndpoint, scan_interval_minutes, agent.id),
  };

  return Response.json({
    agent_id: agent.id,
    agent_token: agentToken,
    install_script: scripts[target_type] || scripts.linux,
    instructions: getInstructions(target_type),
  });
});

function generateLinuxScript(token, endpoint, interval, agentId) {
  return `#!/bin/bash
# ASOSINT Lightweight Scan Agent — Linux
# Agent ID: ${agentId}
set -e

AGENT_TOKEN="${token}"
API_ENDPOINT="${endpoint}"
SCAN_INTERVAL=${interval * 60}
INSTALL_DIR="/opt/asosint-agent"

echo "[ASOSINT] Installing lightweight scan agent..."
mkdir -p $INSTALL_DIR

cat > $INSTALL_DIR/agent.sh << 'AGENT_EOF'
#!/bin/bash
TOKEN="${AGENT_TOKEN}"
ENDPOINT="${API_ENDPOINT}"

collect_system_info() {
  HOSTNAME=$(hostname)
  OS=$(uname -s -r)
  IP=$(hostname -I | awk '{print $1}')
  OPEN_PORTS=$(ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | cut -d: -f2 | sort -u | tr '\\n' ',')
  KERNEL=$(uname -r)
  USERS=$(who | wc -l)
  PROCS=$(ps aux | wc -l)
  DISK=$(df -h / | awk 'NR==2{print $5}')
  
  # Check for common vulnerable software versions
  VULN_CHECKS=""
  command -v openssl &>/dev/null && VULN_CHECKS+="openssl:$(openssl version 2>/dev/null);"
  command -v curl &>/dev/null && VULN_CHECKS+="curl:$(curl --version 2>/dev/null | head -1);"
  command -v python3 &>/dev/null && VULN_CHECKS+="python3:$(python3 --version 2>/dev/null);"
  command -v apache2 &>/dev/null && VULN_CHECKS+="apache:$(apache2 -v 2>/dev/null | head -1);"
  command -v nginx &>/dev/null && VULN_CHECKS+="nginx:$(nginx -v 2>&1);"
  
  echo "{\\"hostname\\":\\"$HOSTNAME\\",\\"os\\":\\"$OS\\",\\"ip\\":\\"$IP\\",\\"open_ports\\":\\"$OPEN_PORTS\\",\\"kernel\\":\\"$KERNEL\\",\\"active_users\\":$USERS,\\"processes\\":$PROCS,\\"disk_usage\\":\\"$DISK\\",\\"software_versions\\":\\"$VULN_CHECKS\\"}"
}

while true; do
  PAYLOAD=$(collect_system_info)
  curl -s -X POST "$ENDPOINT" \\
    -H "Content-Type: application/json" \\
    -H "X-Agent-Token: $TOKEN" \\
    -d "$PAYLOAD" || true
  sleep $SCAN_INTERVAL
done
AGENT_EOF

chmod +x $INSTALL_DIR/agent.sh

# Create systemd service
cat > /etc/systemd/system/asosint-agent.service << EOF
[Unit]
Description=ASOSINT Lightweight Scan Agent
After=network.target

[Service]
ExecStart=$INSTALL_DIR/agent.sh
Restart=always
RestartSec=30
Environment="AGENT_TOKEN=${token}"
Environment="API_ENDPOINT=${endpoint}"
Environment="SCAN_INTERVAL=${interval * 60}"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable asosint-agent
systemctl start asosint-agent
echo "[ASOSINT] Agent installed and running. Agent ID: ${agentId}"
`;
}

function generateWindowsScript(token, endpoint, interval, agentId) {
  return `# ASOSINT Lightweight Scan Agent — Windows PowerShell
# Agent ID: ${agentId}
# Run as Administrator

$AgentToken = "${token}"
$ApiEndpoint = "${endpoint}"
$ScanInterval = ${interval * 60}
$InstallDir = "C:\\\\ProgramData\\\\ASOSINT\\\\Agent"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$AgentScript = @'
$Token = $env:AGENT_TOKEN
$Endpoint = $env:API_ENDPOINT
$Interval = [int]$env:SCAN_INTERVAL

function Get-SystemInfo {
    $hostname = $env:COMPUTERNAME
    $os = (Get-WmiObject Win32_OperatingSystem).Caption
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -ne 'WellKnown'} | Select-Object -First 1).IPAddress
    $openPorts = (Get-NetTCPConnection -State Listen | Select-Object -ExpandProperty LocalPort | Sort-Object -Unique) -join ","
    $installedSoftware = (Get-ItemProperty HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\* | Select-Object DisplayName, DisplayVersion | Where-Object {$_.DisplayName}) | ConvertTo-Json -Compress
    
    return @{
        hostname = $hostname
        os = $os
        ip = $ip
        open_ports = $openPorts
        installed_software = $installedSoftware
        scan_time = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json -Compress
}

while ($true) {
    $payload = Get-SystemInfo
    Invoke-RestMethod -Uri $Endpoint -Method Post -Body $payload -ContentType "application/json" -Headers @{"X-Agent-Token"=$Token} -ErrorAction SilentlyContinue
    Start-Sleep -Seconds $Interval
}
'@

$AgentScript | Out-File "$InstallDir\\\\agent.ps1" -Encoding UTF8

# Register scheduled task
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File $InstallDir\\\\agent.ps1"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$Env = @(
    New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest,
    [System.Environment]::SetEnvironmentVariable("AGENT_TOKEN", "$AgentToken", "Machine"),
    [System.Environment]::SetEnvironmentVariable("API_ENDPOINT", "$ApiEndpoint", "Machine"),
    [System.Environment]::SetEnvironmentVariable("SCAN_INTERVAL", "$ScanInterval", "Machine")
)

Register-ScheduledTask -TaskName "ASOSINT-Agent" -Action $Action -Trigger $Trigger -Settings $Settings -RunLevel Highest -Force
Start-ScheduledTask -TaskName "ASOSINT-Agent"

Write-Host "[ASOSINT] Agent installed successfully. Agent ID: ${agentId}"
`;
}

function generateMacosScript(token, endpoint, interval, agentId) {
  return `#!/bin/bash
# ASOSINT Lightweight Scan Agent — macOS
# Agent ID: ${agentId}

AGENT_TOKEN="${token}"
API_ENDPOINT="${endpoint}"
SCAN_INTERVAL=${interval * 60}
INSTALL_DIR="$HOME/.asosint-agent"

mkdir -p $INSTALL_DIR

cat > $INSTALL_DIR/agent.sh << 'AGENT_EOF'
#!/bin/bash
collect_system_info() {
  HOSTNAME=$(hostname)
  OS=$(sw_vers -productVersion)
  IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
  OPEN_PORTS=$(lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR>1{print $9}' | cut -d: -f2 | sort -u | tr '\\n' ',')
  
  echo "{\\"hostname\\":\\"$HOSTNAME\\",\\"os\\":\\"macOS $OS\\",\\"ip\\":\\"$IP\\",\\"open_ports\\":\\"$OPEN_PORTS\\"}"
}

while true; do
  PAYLOAD=$(collect_system_info)
  curl -s -X POST "${API_ENDPOINT}" \\
    -H "Content-Type: application/json" \\
    -H "X-Agent-Token: ${AGENT_TOKEN}" \\
    -d "$PAYLOAD" || true
  sleep ${SCAN_INTERVAL}
done
AGENT_EOF

chmod +x $INSTALL_DIR/agent.sh

# Create LaunchAgent plist
cat > ~/Library/LaunchAgents/com.asosint.agent.plist << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.asosint.agent</string>
    <key>ProgramArguments</key>
    <array><string>$INSTALL_DIR/agent.sh</string></array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>AGENT_TOKEN</key><string>${token}</string>
        <key>API_ENDPOINT</key><string>${endpoint}</string>
        <key>SCAN_INTERVAL</key><string>${scan_interval_minutes * 60}</string>
    </dict>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
</dict>
</plist>
PLIST_EOF

launchctl load ~/Library/LaunchAgents/com.asosint.agent.plist
echo "[ASOSINT] Agent installed. Agent ID: ${agentId}"
`;
}

function generateAndroidInstructions(token, endpoint, agentId) {
  return `# ASOSINT Mobile Agent — Android
# Agent ID: ${agentId}
# Agent Token: ${token}

## Option A: ASOSINT Mobile App (Recommended)
1. Download the ASOSINT Mobile Agent APK from your admin portal
2. Install via: adb install asosint-agent.apk
3. Launch the app and enter:
   - Agent Token: ${token}
   - Server: ${endpoint}
4. Grant permissions: READ_PHONE_STATE, ACCESS_NETWORK_STATE, PACKAGE_USAGE_STATS

## Option B: ADB Shell (Rooted devices / MDM)
adb shell am start -n com.asosint.agent/.MainActivity \\
  --es agent_token "${token}" \\
  --es api_endpoint "${endpoint}"

## Collected telemetry:
- Installed apps & versions
- Open network connections
- OS version & security patch level
- Device identifiers (anonymized)
- Running services

## MDM Enrollment (Enterprise)
Configure your MDM (Intune/JAMF/VMware WS1) with:
  Bundle ID: com.asosint.agent
  Token: ${token}
  Endpoint: ${endpoint}
`;
}

function generateIOSInstructions(token, endpoint, agentId) {
  return `# ASOSINT Mobile Agent — iOS/iPadOS
# Agent ID: ${agentId}
# Agent Token: ${token}

## MDM Profile Installation (Recommended for Enterprise)
1. In your MDM (Jamf Pro / Intune / ABM), create a new managed app config:
   Key: agent_token  → Value: ${token}
   Key: api_endpoint → Value: ${endpoint}
2. Push the ASOSINT Agent app (Bundle: com.asosint.agent) to enrolled devices
3. The agent will auto-configure using the managed app config

## Manual Installation
1. Open the ASOSINT Mobile app on your iOS device
2. Navigate to Settings → Agent Config
3. Enter:
   - Agent Token: ${token}
   - Server URL: ${endpoint}
4. Tap "Activate Agent"

## What is collected (iOS sandbox-compliant):
- Network connectivity status
- iOS version & security patch
- Installed profile configurations
- VPN/proxy detection
- Jailbreak indicators
- Certificate trust chain anomalies

## Apple Configurator 2 Enrollment
Export .mobileconfig profile with AgentToken="${token}" and deploy via USB or supervised mode.
`;
}

function generateDockerScript(token, endpoint, interval, agentId) {
  return `# ASOSINT Lightweight Scan Agent — Docker
# Agent ID: ${agentId}

# Quick run:
docker run -d \\
  --name asosint-agent \\
  --restart=unless-stopped \\
  --network=host \\
  --pid=host \\
  -e AGENT_TOKEN="${token}" \\
  -e API_ENDPOINT="${endpoint}" \\
  -e SCAN_INTERVAL=${interval} \\
  -v /proc:/host/proc:ro \\
  -v /sys:/host/sys:ro \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  asosint/scan-agent:latest

# Or via docker-compose:
cat > docker-compose.asosint.yml << 'EOF'
version: '3.8'
services:
  asosint-agent:
    image: asosint/scan-agent:latest
    container_name: asosint-agent
    restart: unless-stopped
    network_mode: host
    pid: host
    environment:
      AGENT_TOKEN: "${token}"
      API_ENDPOINT: "${endpoint}"
      SCAN_INTERVAL: "${interval}"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
EOF

docker-compose -f docker-compose.asosint.yml up -d
echo "Agent ${agentId} deployed in Docker"
`;
}

function generateK8sScript(token, endpoint, interval, agentId) {
  return `# ASOSINT Lightweight Scan Agent — Kubernetes DaemonSet
# Agent ID: ${agentId}
# Deploys to every node in the cluster

cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: asosint-scan-agent
  namespace: kube-system
  labels:
    app: asosint-agent
spec:
  selector:
    matchLabels:
      app: asosint-agent
  template:
    metadata:
      labels:
        app: asosint-agent
    spec:
      hostPID: true
      hostNetwork: true
      tolerations:
      - effect: NoSchedule
        operator: Exists
      containers:
      - name: asosint-agent
        image: asosint/scan-agent:latest
        env:
        - name: AGENT_TOKEN
          value: "${token}"
        - name: API_ENDPOINT
          value: "${endpoint}"
        - name: SCAN_INTERVAL
          value: "${interval}"
        securityContext:
          privileged: false
          readOnlyRootFilesystem: true
        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
EOF
echo "ASOSINT DaemonSet deployed. Agent ID: ${agentId}"
`;
}

function getInstructions(target_type) {
  const map = {
    linux: "Run the script as root: sudo bash install-agent.sh",
    windows: "Run in PowerShell as Administrator",
    macos: "Run in Terminal: bash install-agent.sh",
    android: "Follow the MDM or ADB instructions above",
    ios: "Deploy via MDM (Jamf/Intune) or manually via the ASOSINT app",
    docker: "Run the docker command or use docker-compose",
    kubernetes: "Apply the DaemonSet manifest with kubectl",
  };
  return map[target_type] || "Follow the script instructions above";
}