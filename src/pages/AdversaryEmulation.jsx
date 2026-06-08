import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmulationBuilder from "@/components/redteam/EmulationBuilder.jsx";
import C2Console from "@/components/redteam/C2Console.jsx";
import ImpactMap from "@/components/redteam/ImpactMap.jsx";
import EmulationLibrary from "@/components/redteam/EmulationLibrary.jsx";
import { Sword, Terminal, Radio, Map, BookOpen } from "lucide-react";

export default function AdversaryEmulation() {
  const [activeScenario, setActiveScenario] = useState(null);

  return (
    <div className="min-h-screen bg-[#07091a] text-gray-100 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Sword className="w-7 h-7 text-[#ff4757]" />
          <h1 className="text-2xl font-black text-white">Adversary Emulation Platform</h1>
          <span className="text-[10px] font-bold bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30 px-2 py-0.5 rounded uppercase tracking-widest">Red Team</span>
        </div>
        <p className="text-gray-400 text-sm">Chain MITRE ATT&CK TTPs, integrate live C2 frameworks, and visualize real-time impact on the intelligence picture and defense posture.</p>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="bg-[#0d1220] border border-white/5 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="builder" className="data-[state=active]:bg-[#ff4757]/20 data-[state=active]:text-[#ff4757] text-gray-400 gap-2 text-xs">
            <Sword className="w-3.5 h-3.5" /> TTP Chain Builder
          </TabsTrigger>
          <TabsTrigger value="c2" className="data-[state=active]:bg-[#ff4757]/20 data-[state=active]:text-[#ff4757] text-gray-400 gap-2 text-xs">
            <Terminal className="w-3.5 h-3.5" /> C2 Integration
          </TabsTrigger>
          <TabsTrigger value="impact" className="data-[state=active]:bg-[#ff4757]/20 data-[state=active]:text-[#ff4757] text-gray-400 gap-2 text-xs">
            <Map className="w-3.5 h-3.5" /> Impact & Defense Map
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-[#ff4757]/20 data-[state=active]:text-[#ff4757] text-gray-400 gap-2 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Scenario Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <EmulationBuilder activeScenario={activeScenario} setActiveScenario={setActiveScenario} />
        </TabsContent>
        <TabsContent value="c2">
          <C2Console activeScenario={activeScenario} />
        </TabsContent>
        <TabsContent value="impact">
          <ImpactMap activeScenario={activeScenario} />
        </TabsContent>
        <TabsContent value="library">
          <EmulationLibrary onLoad={setActiveScenario} />
        </TabsContent>
      </Tabs>
    </div>
  );
}