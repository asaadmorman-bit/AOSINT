import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Target, Brain, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";

export default function DWaveIntegration() {
  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="bg-[#111827] border border-purple-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">D-Wave Quantum Annealer Integration</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              D-Wave Systems provides quantum annealers (Advantage, Leap) optimized for combinatorial optimization and sampling problems. Integration enables near-term quantum advantage for resource allocation, threat actor network analysis, and supply chain optimization.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">5000+ qubits</Badge>
              <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">Cloud API</Badge>
              <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">Hybrid execution</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Hardware Specifications" icon={<Cpu className="w-4 h-4 text-[#00d4ff]" />}>
          <SpecItem label="Quantum Processor" value="Pegasus topology (5760 qubits)" />
          <SpecItem label="Operating Temperature" value="~15 mK" />
          <SpecItem label="Programmable Coupler Range" value="±2.5 GHz" />
          <SpecItem label="Annealing Time" value="1-2000 µs" />
          <SpecItem label="Chain Coupling Strength" value=">10 GHz" />
          <SpecItem label="QPU Access" value="Cloud via Leap platform" />
        </Section>

        <Section title="Algorithm Support" icon={<Brain className="w-4 h-4 text-[#a855f7]" />}>
          <SpecItem label="Quantum Annealing" value="Binary optimization (QUBO, Ising)" />
          <SpecItem label="Hybrid Solving" value="Classical + quantum orchestration" />
          <SpecItem label="Problem Classes" value="Max-SAT, Max-Cut, Clique, Partitioning" />
          <SpecItem label="Sampling" value="Probabilistic solution generation" />
          <SpecItem label="Embedding Service" value="Automatic logical-physical mapping" />
          <SpecItem label="Reverse Annealing" value="Fine-grained solution refinement" />
        </Section>
      </div>

      {/* Integration with Nation-State Use Cases */}
      <Section title="Strategic Applications" icon={<Target className="w-4 h-4 text-[#ffa502]" />} fullWidth>
        <div className="space-y-3">
          <UseCase
            title="Defense Resource Allocation"
            description="Optimize military asset deployment across cyber, air, naval, space domains"
            metrics={["15-20% efficiency gain", "50M+ variable space", "100-500ms solution time"]}
          />
          <UseCase
            title="Supply Chain Vulnerability Mapping"
            description="Identify critical dependencies and single-points-of-failure in adversary supply chains"
            metrics={["Map 100K+ relationships", "2hr optimization vs 2 weeks classical", "10x coverage"]}
          />
          <UseCase
            title="Threat Actor Network Analysis"
            description="Uncover organizational hierarchies, information flow, and vulnerabilities in APT ecosystems"
            metrics={["Analyze 50K+ nodes", "Sub-second community detection", "Predict reorganization"]}
          />
          <UseCase
            title="Geopolitical Scenario Optimization"
            description="Optimize strategic responses across multi-actor conflicts and diplomatic scenarios"
            metrics={["100-1000 scenario paths", "Real-time optimization", "Strategy space: 10^12+"]}
          />
        </div>
      </Section>

      {/* Integration Architecture */}
      <Section title="Integration Architecture" icon={<Zap className="w-4 h-4 text-purple-400" />} fullWidth>
        <div className="space-y-3 text-sm">
          <ArchBlock
            title="1. Problem Formulation"
            items={[
              "Convert operational problem to QUBO/Ising model",
              "Define objective function & constraints",
              "Set chain strength & annealing parameters",
              "Estimate problem difficulty & solution time",
            ]}
          />
          <ArchBlock
            title="2. Hybrid Execution"
            items={[
              "Submit to D-Wave Hybrid Solver Service",
              "Automatic classical preprocessing (reduce variables)",
              "Quantum annealing on subset (500-5000 qubits)",
              "Classical postprocessing (constraint satisfaction)",
            ]}
          />
          <ArchBlock
            title="3. Solution Refinement"
            items={[
              "Multiple annealing runs (statistical ensemble)",
              "Reverse annealing for local optimization",
              "Penalty-based constraint handling",
              "Confidence scoring & solution validation",
            ]}
          />
          <ArchBlock
            title="4. Operational Deployment"
            items={[
              "Solution extraction & formatting",
              "High-assurance validation & audit trail",
              "Decision support dashboard",
              "Explainability via classical model interpretation",
            ]}
          />
        </div>
      </Section>

      {/* Integration Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Prerequisites" icon={<CheckCircle2 className="w-4 h-4 text-[#2ed573]" />}>
          <li className="text-[10px] text-gray-300 flex gap-2">✓ D-Wave Leap account (cloud access)</li>
          <li className="text-[10px] text-gray-300 flex gap-2">✓ dimod + dwave-system SDK</li>
          <li className="text-[10px] text-gray-300 flex gap-2">✓ Problem modeling framework</li>
          <li className="text-[10px] text-gray-300 flex gap-2">✓ Network connectivity to AWS</li>
          <li className="text-[10px] text-gray-300 flex gap-2">✓ High-assurance API wrapper</li>
        </Section>

        <Section title="Deployment Timeline" icon={<AlertTriangle className="w-4 h-4 text-[#ffa502]" />}>
          <li className="text-[10px] text-gray-300 flex gap-2">Week 1-2: SDK integration & testing</li>
          <li className="text-[10px] text-gray-300 flex gap-2">Week 3-4: Proof-of-concept (resource allocation)</li>
          <li className="text-[10px] text-gray-300 flex gap-2">Week 5-6: High-assurance wrapper</li>
          <li className="text-[10px] text-gray-300 flex gap-2">Week 7-8: Validation & certification</li>
          <li className="text-[10px] text-gray-300 flex gap-2">Week 9+: Multi-use-case deployment</li>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, fullWidth, children }) {
  return (
    <div className={`bg-[#111827] border border-white/5 rounded-xl p-5 ${fullWidth ? "col-span-full" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-gray-400">{icon}</div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-b-0">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-[11px] text-white font-semibold">{value}</p>
    </div>
  );
}

function UseCase({ title, description, metrics }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-3">
      <p className="text-[11px] font-bold text-white mb-1">{title}</p>
      <p className="text-[10px] text-gray-400 mb-2">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((m, i) => (
          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function ArchBlock({ title, items }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-3">
      <p className="text-[11px] font-bold text-white mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[10px] text-gray-400 flex gap-2">
            <span className="text-purple-400 shrink-0">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}