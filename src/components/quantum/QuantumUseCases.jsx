import React from "react";
import { Lock, Network, Brain, Target, Search, Cpu, Globe2, Shield, Zap } from "lucide-react";

const USE_CASES = [
  {
    icon: Lock,
    color: "#ff4757",
    title: "Cryptanalysis & Signal Intelligence",
    description: "Break RSA/ECC encryption using Shor's algorithm. Decrypt intercepted communications of adversary states within minutes instead of millennia.",
    nationStateChallenge: "Accessing encrypted communications of peer competitors (PRC, Russia, Iran)",
    quantumApproach: "Shor's Algorithm for discrete logarithm & factorization",
    timeline: "12-24 months (with 8000+ logical qubits)",
    impact: "Decrypt 15+ years of archived communications instantly",
  },
  {
    icon: Network,
    color: "#00d4ff",
    title: "Defense Optimization & Resource Allocation",
    description: "Allocate military assets, cyber defenses, and intelligence resources optimally across domains using QAOA and quantum annealing.",
    nationStateChallenge: "Budget optimization for multi-domain defense (cyber, air, space, maritime)",
    quantumApproach: "Quantum Approximate Optimization Algorithm (QAOA)",
    timeline: "6-12 months (with 2000+ logical qubits)",
    impact: "20-40% efficiency gain in resource deployment",
  },
  {
    icon: Brain,
    color: "#a855f7",
    title: "Adversary Decision Tree Simulation",
    description: "Simulate adversary decision-making, escalation paths, and strategic options using quantum machine learning and VQE.",
    nationStateChallenge: "Predicting peer-state military doctrine decisions and asymmetric responses",
    quantumApproach: "Variational Quantum Eigensolver (VQE) for behavioral modeling",
    timeline: "9-18 months (with 3000+ logical qubits)",
    impact: "Reduce strategic surprise; enable counter-strategies in 50ms",
  },
  {
    icon: Search,
    color: "#ffa502",
    title: "Quantum Database Search & Correlation",
    description: "Find hidden patterns and indicator correlations in massive datasets using Grover's algorithm.",
    nationStateChallenge: "Finding needle-in-haystack threat indicators across exabytes of SIGINT/OSINT data",
    quantumApproach: "Grover's Search Algorithm (quadratic speedup)",
    timeline: "6-9 months (with 1500+ logical qubits)",
    impact: "Search 10^18 data points in 30 billion steps (vs. classical 5 billion steps)",
  },
  {
    icon: Target,
    color: "#2ed573",
    title: "Supply Chain Risk Mapping",
    description: "Model interdependencies and vulnerabilities in global supply chains using quantum graph algorithms.",
    nationStateChallenge: "Identify critical supply chain chokepoints used by adversaries",
    quantumApproach: "Quantum Graph Analysis + Quantum Annealing",
    timeline: "12-18 months (with 4000+ logical qubits)",
    impact: "Map 10M+ relationships in hours vs. weeks",
  },
  {
    icon: Brain,
    color: "#ff6b35",
    title: "Threat Actor Network Analysis",
    description: "Analyze entangled threat actor networks, identify leadership hierarchies, and predict organizational changes using quantum ML.",
    nationStateChallenge: "Understanding complex APT ecosystems and attributed attribution relationships",
    quantumApproach: "Quantum ML for Network Topology + VQE Embedding",
    timeline: "9-15 months (with 2500+ logical qubits)",
    impact: "Uncover 10x more relationships; predict reorganization 60 days ahead",
  },
  {
    icon: Cpu,
    color: "#00d4ff",
    title: "Anomaly Detection at Scale",
    description: "Detect anomalies in sensor networks, cyber traffic, and HUMINT using quantum machine learning algorithms.",
    nationStateChallenge: "Detecting novel attack patterns and insider threats in real-time",
    quantumApproach: "Quantum Support Vector Machines (QSVM) + Quantum Neural Networks",
    timeline: "6-12 months (with 2000+ logical qubits)",
    impact: "99.2% detection rate on novel threats vs. 87% classical",
  },
  {
    icon: Globe2,
    color: "#a855f7",
    title: "Geopolitical Simulation & Forecasting",
    description: "Simulate geopolitical crises, conflict escalation scenarios, and international response using quantum simulators.",
    nationStateChallenge: "Predict outcomes of multi-actor conflicts (Taiwan scenario, Middle East escalation)",
    quantumApproach: "Quantum Phase Estimation + Quantum Walk Algorithms",
    timeline: "15-24 months (with 5000+ logical qubits)",
    impact: "Simulate 10,000 scenario paths in real-time vs. 3 paths classically",
  },
  {
    icon: Shield,
    color: "#ff4757",
    title: "Post-Quantum Cryptography Development",
    description: "Design and validate post-quantum cryptographic algorithms resistant to quantum attacks.",
    nationStateChallenge: "Preparing defense infrastructure for adversary quantum capabilities",
    quantumApproach: "Quantum Simulation of Lattice-based & Hash-based Crypto",
    timeline: "12-18 months (with 3000+ logical qubits)",
    impact: "Validate cryptography that survives 2035+ quantum threat environment",
  },
];

export default function QuantumUseCases() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {USE_CASES.map((uc, i) => {
          const Icon = uc.icon;
          return (
            <div
              key={i}
              className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
              style={{ borderColor: `${uc.color}20` }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ background: `${uc.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: uc.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white leading-snug">{uc.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">{uc.description}</p>

              {/* Details Grid */}
              <div className="space-y-3 text-[10px]">
                <Detail label="Nation-State Challenge" value={uc.nationStateChallenge} />
                <Detail label="Quantum Approach" value={uc.quantumApproach} />
                <Detail label="Development Timeline" value={uc.timeline} />
                <Detail label="Operational Impact" value={uc.impact} color="#2ed573" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Notes */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Quantum-Ready Architecture</h3>
        </div>
        <ul className="space-y-1.5 text-[10px] text-gray-400">
          <li>• <span className="text-gray-300">Error Mitigation:</span> Active Quantum Error Correction (AQEC) for logical qubits</li>
          <li>• <span className="text-gray-300">Hybrid Approach:</span> Quantum-Classical loop for near-term (NISQ) devices</li>
          <li>• <span className="text-gray-300">Scalability:</span> Architecture supports growth from 500→50,000 logical qubits</li>
          <li>• <span className="text-gray-300">Security:</span> Quantum-resistant cryptography for all quantum task telemetry</li>
          <li>• <span className="text-gray-300">Integration:</span> Seamless compatibility with existing OSINT/SIGINT infrastructure</li>
        </ul>
      </div>

      {/* Roadmap */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-[#ffa502]" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Quantum Deployment Roadmap</h3>
        </div>
        <div className="space-y-2 text-[10px] text-gray-400">
          <p><span className="text-[#ffa502] font-bold">2026-Q3:</span> Proof-of-concept with 100 logical qubits (Grover search demo)</p>
          <p><span className="text-[#a855f7] font-bold">2027-Q1:</span> 1000-qubit system (pattern search, resource optimization)</p>
          <p><span className="text-[#2ed573] font-bold">2027-Q4:</span> 5000-qubit system (cryptanalysis research, threat simulation)</p>
          <p><span className="text-[#ff4757] font-bold">2028-2030:</span> 50,000+ logical qubits (full nation-state operational capability)</p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, color = "#00d4ff" }) {
  return (
    <div>
      <p style={{ color }} className="font-bold mb-0.5 uppercase tracking-wider">{label}</p>
      <p className="text-gray-400 leading-relaxed">{value}</p>
    </div>
  );
}