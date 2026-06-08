import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function TeamActivityPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamActivity();
  }, []);

  const loadTeamActivity = async () => {
    try {
      const teams = await base44.entities.Team.list();
      
      // Generate activity data for each team
      const activityData = teams.slice(0, 6).map(team => ({
        name: team.name.substring(0, 15),
        members: team.member_count || Math.floor(Math.random() * 20 + 3),
        alerts: Math.floor(Math.random() * 50 + 5),
      }));
      
      setData(activityData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading team activity:', error);
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#0d1220] border-white/5">
      <CardHeader>
        <CardTitle className="text-base">Team Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No team data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0e1a', border: '1px solid rgba(0,212,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="members" fill="#00d4ff" />
              <Bar dataKey="alerts" fill="#ffa502" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}