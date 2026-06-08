import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Mail, Linkedin, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FounderBios() {
  const founders = [
    {
      name: "Asaad",
      title: "Founder & CEO",
      email: "info@eds-360.com",
      linkedin: "https://www.linkedin.com/in/asaad-morman-4403423b/",
      bio: "Asaad brings over 15 years of experience in cyber threat intelligence and defense operations. With a deep background in OSINT, threat analysis, and security operations, Asaad founded ASOSINT to democratize access to advanced threat intelligence tools for organizations of all sizes. His expertise spans from tactical IOC enrichment to strategic geopolitical threat assessment. Previously, Asaad served in senior intelligence roles where he led threat hunting operations and built AI-powered threat correlation systems. His mission is to enable defenders globally with the tools needed to stay ahead of sophisticated threat actors.",
      expertise: [
        "Threat Intelligence Architecture",
        "OSINT Methodologies",
        "AI/ML in Security",
        "Geopolitical Analysis",
        "Incident Response",
        "Threat Actor Attribution"
      ],
      achievements: [
        "Built threat intelligence platform processing 50M+ indicators daily",
        "Led threat hunts resulting in attribution of 200+ campaigns",
        "Developed AI models for threat correlation with 95%+ accuracy",
        "Published research on emerging threat landscapes",
        "Speaker at security conferences and industry events"
      ],
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a02e84d20c4e5765cf405d/64f033491_1661030090872.jpg"
    },
    {
      name: "Shauntze",
      title: "Founder & Chief Strategy Officer",
      email: "info@eds-360.com",
      linkedin: "https://www.linkedin.com/in/shauntze-morman-cmcp-aa41a3239/",
      bio: "Shauntze brings over 23 years of progressive leadership in public safety, emergency communications, and organizational development. As Co-Founder and Chief Strategy Officer of Emerging Defense Solutions, Shauntze leads strategic direction across multiple business divisions including cybersecurity, defensive training, legal services, and community protection initiatives. With deep expertise in 911 consulting, emergency response coordination, and leadership development, Shauntze architected the public safety and protective intelligence components of ASOSINT. Her mission-driven approach combines real-world operational knowledge with innovative technology to protect and empower communities at every level.",
      expertise: [
        "Public Safety Operations",
        "Emergency Communications",
        "911 Consulting & Training",
        "Leadership Development",
        "Organizational Strategy",
        "Crisis Management",
        "Community Protection"
      ],
      achievements: [
        "23+ years in public safety and emergency communications",
        "Co-Founder of Heritage Shield Defense Academy",
        "Chief Strategy Officer for Cyber Dojo Solutions",
        "APCO Communications Training Officer-Instructor",
        "NENA Center Manager Certification Program Graduate",
        "Led regional 911 training and leadership development initiatives",
        "American Heart Association CPR Instructor"
      ],
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a02e84d20c4e5765cf405d/04709accb_Screenshot2025-11-18090738.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link to={createPageUrl("Homepage")} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Meet the Founders</h1>
          <p className="text-xl text-gray-600">
            The visionary leaders behind ASOSINT's mission to advance global threat intelligence
          </p>
        </div>

        {/* Founders Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {founders.map((founder, idx) => (
            <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Founder Image */}
              <div className="h-64 bg-gradient-to-br from-blue-400 to-cyan-400 overflow-hidden">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardHeader>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{founder.name}</h2>
                  <p className="text-blue-600 font-semibold">{founder.title}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Bio */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Biography</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{founder.bio}</p>
                  {founder.name === "Asaad" && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Tactical Instruction</h4>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Asaad provides hands-on tactical instruction in threat hunting methodologies, intelligence analysis tradecraft, and security operations. His courses emphasize real-world scenario-based learning, from IOC enrichment and correlation techniques to adversary emulation and red/blue operations. He regularly conducts workshops for SOC teams, threat hunters, and security analysts seeking to sharpen their operational capabilities.
                      </p>
                    </div>
                  )}
                </div>

                {/* Expertise */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Core Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {founder.expertise.map((exp, eIdx) => (
                      <span
                        key={eIdx}
                        className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Achievements</h3>
                  <ul className="space-y-2">
                    {founder.achievements.map((achievement, aIdx) => (
                      <li key={aIdx} className="flex gap-2 text-xs text-gray-700">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <a
                    href={`mailto:${founder.email}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {founder.email}
                  </a>
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn Profile
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Statement */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Asaad and Shauntze founded ASOSINT with a singular vision: to build the world's most advanced threat intelligence platform that empowers defenders globally. Combining deep expertise in intelligence analysis, distributed systems, and artificial intelligence, they created a platform that transforms how organizations understand and respond to threats.
            </p>
            <p className="text-gray-700">
              Together, they lead a team of world-class engineers, threat researchers, and security experts dedicated to advancing the state of threat intelligence. Their commitment to innovation, security, and customer success drives ASOSINT's evolution as a market leader in threat intelligence technology.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Interested in learning more about ASOSINT or connecting with the team?
          </p>
          <div className="flex gap-4 justify-center">
            <Link to={createPageUrl("Support")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get in Touch
              </Button>
            </Link>
            <Link to={createPageUrl("Pricing")}>
              <Button variant="outline">
                Explore Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}