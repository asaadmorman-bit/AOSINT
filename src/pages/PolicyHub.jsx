import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Shield, AlertCircle, Scale, Eye, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PolicyHub() {
  const policies = [
    {
      title: "Privacy Policy",
      icon: Eye,
      description: "Learn how we collect, use, and protect your personal information",
      lastUpdated: "January 1, 2026",
      link: "PrivacyPolicy",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Terms of Service",
      icon: FileText,
      description: "Review the terms and conditions governing your use of ASOSINT",
      lastUpdated: "January 1, 2026",
      link: "TermsOfService",
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Acceptable Use Policy",
      icon: AlertCircle,
      description: "Understand permitted and prohibited uses of the platform",
      lastUpdated: "January 1, 2026",
      link: "AcceptableUsePolicy",
      color: "from-red-500 to-pink-500"
    },
    {
      title: "Legal & Compliance",
      icon: Scale,
      description: "Compliance frameworks, certifications, and legal obligations",
      lastUpdated: "January 1, 2026",
      link: "LegalObligations",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link to={createPageUrl("Homepage")} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Legal & Policy Center</h1>
            <p className="text-xl text-gray-600">
              Review all policies, terms, and compliance information for ASOSINT
            </p>
          </div>
        </div>

        {/* Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy, idx) => {
            const Icon = policy.icon;
            return (
              <Link key={idx} to={createPageUrl(policy.link)}>
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${policy.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <span className="text-xs text-gray-500">{policy.lastUpdated}</span>
                    </div>
                    <CardTitle className="text-lg mt-2">{policy.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{policy.description}</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Read Policy
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Key Points */}
        <Card>
          <CardHeader>
            <CardTitle>Key Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Protection</h4>
                <p className="text-sm text-gray-600">
                  We employ encryption, access controls, and regular security audits to protect your data. Your intelligence information is never sold to third parties.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Responsible Use</h4>
                <p className="text-sm text-gray-600">
                  ASOSINT is designed for defensive security operations. Unauthorized access, surveillance, or harassment is strictly prohibited.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">User Rights</h4>
                <p className="text-sm text-gray-600">
                  You have the right to access, correct, and delete your personal information. Contact privacy@asosint.com to exercise your rights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Compliance</h4>
                <p className="text-sm text-gray-600">
                  ASOSINT maintains SOC 2 alignment and complies with major data protection regulations including GDPR, CCPA, and export controls.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Questions About Our Policies?</h3>
            <p className="text-sm text-gray-700 mb-4">
              If you have questions about any of these policies or need clarification, please contact us:
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Legal Inquiries:</strong>{" "}
                <a href="mailto:legal@asosint.com" className="text-blue-600 hover:text-blue-800">
                  legal@asosint.com
                </a>
              </p>
              <p>
                <strong>Privacy Requests:</strong>{" "}
                <a href="mailto:privacy@asosint.com" className="text-blue-600 hover:text-blue-800">
                  privacy@asosint.com
                </a>
              </p>
              <p>
                <strong>General Support:</strong>{" "}
                <a href="mailto:support@asosint.com" className="text-blue-600 hover:text-blue-800">
                  support@asosint.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+1-866-208-3674" className="text-blue-600 hover:text-blue-800">
                  (866) 208-3674
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center space-y-2 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Emerging Defense Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}