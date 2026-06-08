// MITRE ATT&CK Enterprise Tactics + key techniques (abridged but representative)
export const MITRE_TACTICS = [
  {
    id: "TA0043", name: "Reconnaissance", color: "#546e7a",
    techniques: [
      { id: "T1595", name: "Active Scanning" },
      { id: "T1592", name: "Gather Victim Host Info" },
      { id: "T1589", name: "Gather Victim Identity Info" },
      { id: "T1590", name: "Gather Victim Network Info" },
      { id: "T1597", name: "Search Closed Sources" },
      { id: "T1596", name: "Search Open Technical Databases" },
    ],
  },
  {
    id: "TA0042", name: "Resource Development", color: "#6d4c41",
    techniques: [
      { id: "T1583", name: "Acquire Infrastructure" },
      { id: "T1586", name: "Compromise Accounts" },
      { id: "T1584", name: "Compromise Infrastructure" },
      { id: "T1587", name: "Develop Capabilities" },
      { id: "T1585", name: "Establish Accounts" },
      { id: "T1588", name: "Obtain Capabilities" },
    ],
  },
  {
    id: "TA0001", name: "Initial Access", color: "#4527a0",
    techniques: [
      { id: "T1189", name: "Drive-by Compromise" },
      { id: "T1190", name: "Exploit Public-Facing App" },
      { id: "T1566", name: "Phishing" },
      { id: "T1078", name: "Valid Accounts" },
      { id: "T1195", name: "Supply Chain Compromise" },
      { id: "T1199", name: "Trusted Relationship" },
    ],
  },
  {
    id: "TA0002", name: "Execution", color: "#283593",
    techniques: [
      { id: "T1059", name: "Command & Scripting Interpreter" },
      { id: "T1203", name: "Exploitation for Client Execution" },
      { id: "T1106", name: "Native API" },
      { id: "T1053", name: "Scheduled Task/Job" },
      { id: "T1204", name: "User Execution" },
      { id: "T1047", name: "Windows Mgmt Instrumentation" },
    ],
  },
  {
    id: "TA0003", name: "Persistence", color: "#1565c0",
    techniques: [
      { id: "T1098", name: "Account Manipulation" },
      { id: "T1547", name: "Boot/Logon Autostart" },
      { id: "T1136", name: "Create Account" },
      { id: "T1133", name: "External Remote Services" },
      { id: "T1574", name: "Hijack Execution Flow" },
      { id: "T1505", name: "Server Software Component" },
    ],
  },
  {
    id: "TA0004", name: "Privilege Escalation", color: "#00695c",
    techniques: [
      { id: "T1548", name: "Abuse Elevation Control Mechanism" },
      { id: "T1134", name: "Access Token Manipulation" },
      { id: "T1068", name: "Exploitation for Privilege Escalation" },
      { id: "T1055", name: "Process Injection" },
      { id: "T1053", name: "Scheduled Task/Job" },
      { id: "T1078", name: "Valid Accounts" },
    ],
  },
  {
    id: "TA0005", name: "Defense Evasion", color: "#2e7d32",
    techniques: [
      { id: "T1140", name: "Deobfuscate/Decode Files" },
      { id: "T1070", name: "Indicator Removal" },
      { id: "T1036", name: "Masquerading" },
      { id: "T1027", name: "Obfuscated Files or Info" },
      { id: "T1055", name: "Process Injection" },
      { id: "T1218", name: "System Binary Proxy Execution" },
    ],
  },
  {
    id: "TA0006", name: "Credential Access", color: "#e65100",
    techniques: [
      { id: "T1110", name: "Brute Force" },
      { id: "T1555", name: "Credentials from Password Stores" },
      { id: "T1212", name: "Exploitation for Credential Access" },
      { id: "T1056", name: "Input Capture" },
      { id: "T1003", name: "OS Credential Dumping" },
      { id: "T1528", name: "Steal App Access Token" },
    ],
  },
  {
    id: "TA0007", name: "Discovery", color: "#bf360c",
    techniques: [
      { id: "T1087", name: "Account Discovery" },
      { id: "T1482", name: "Domain Trust Discovery" },
      { id: "T1083", name: "File & Directory Discovery" },
      { id: "T1046", name: "Network Service Discovery" },
      { id: "T1057", name: "Process Discovery" },
      { id: "T1018", name: "Remote System Discovery" },
    ],
  },
  {
    id: "TA0008", name: "Lateral Movement", color: "#880e4f",
    techniques: [
      { id: "T1210", name: "Exploitation of Remote Services" },
      { id: "T1534", name: "Internal Spearphishing" },
      { id: "T1570", name: "Lateral Tool Transfer" },
      { id: "T1563", name: "Remote Service Session Hijacking" },
      { id: "T1021", name: "Remote Services" },
      { id: "T1080", name: "Taint Shared Content" },
    ],
  },
  {
    id: "TA0009", name: "Collection", color: "#4a148c",
    techniques: [
      { id: "T1560", name: "Archive Collected Data" },
      { id: "T1119", name: "Automated Collection" },
      { id: "T1115", name: "Clipboard Data" },
      { id: "T1530", name: "Data from Cloud Storage" },
      { id: "T1213", name: "Data from Info Repositories" },
      { id: "T1056", name: "Input Capture" },
    ],
  },
  {
    id: "TA0011", name: "Command & Control", color: "#1a237e",
    techniques: [
      { id: "T1071", name: "Application Layer Protocol" },
      { id: "T1132", name: "Data Encoding" },
      { id: "T1001", name: "Data Obfuscation" },
      { id: "T1568", name: "Dynamic Resolution" },
      { id: "T1573", name: "Encrypted Channel" },
      { id: "T1572", name: "Protocol Tunneling" },
    ],
  },
  {
    id: "TA0010", name: "Exfiltration", color: "#b71c1c",
    techniques: [
      { id: "T1020", name: "Automated Exfiltration" },
      { id: "T1030", name: "Data Transfer Size Limits" },
      { id: "T1048", name: "Exfiltration Over Alt Protocol" },
      { id: "T1041", name: "Exfiltration Over C2 Channel" },
      { id: "T1567", name: "Exfiltration Over Web Service" },
      { id: "T1029", name: "Scheduled Transfer" },
    ],
  },
  {
    id: "TA0040", name: "Impact", color: "#c62828",
    techniques: [
      { id: "T1531", name: "Account Access Removal" },
      { id: "T1485", name: "Data Destruction" },
      { id: "T1486", name: "Data Encrypted for Impact" },
      { id: "T1490", name: "Inhibit System Recovery" },
      { id: "T1498", name: "Network Denial of Service" },
      { id: "T1491", name: "Defacement" },
    ],
  },
];