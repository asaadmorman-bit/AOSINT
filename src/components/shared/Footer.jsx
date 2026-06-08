import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Phone, Globe, Linkedin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Why ASOSINT", page: "WhyAsoint" },
        { name: "Platform", page: "Dashboard" },
        { name: "vs. OSINT Tools", page: "Comparison" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About EDS", page: "AboutEDS" },
        { name: "Founders", page: "FounderBios" },
        { name: "Careers", page: "Careers" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", page: "Documentation" },
        { name: "Support", page: "Support" },
        { name: "Community Forum", page: "Forum" },
        { name: "Intel Briefs", page: "BriefingEngine" }
      ]
    },
    {
      title: "Partners",
      links: [
        { name: "Partner Program", page: "Partners" },
        { name: "Partner Portal", page: "PartnerPortal" },
        { name: "Integrations", page: "IntegrationHub" },
        { name: "Marketplace", page: "Marketplace" }
      ]
    }
  ];

  const contactInfo = [
    { icon: Mail, label: "Email", value: "info@eds-360.com", href: "mailto:info@eds-360.com" },
    { icon: Phone, label: "Phone", value: "(866) 208-3674", href: "tel:+1-866-208-3674" },
    { icon: Globe, label: "Web", value: "www.emergingdefensesolutions.com", href: "https://www.emergingdefensesolutions.com" }
  ];

  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/company/emerging-defense-solutions/?viewAsMember=true", label: "LinkedIn" },
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61585307485703", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/eds_360?igsh=eGJodHNsaHl2MjVx", label: "Instagram" }
  ];

  return (
    <footer className="bg-[#0d1220] border-t border-white/5 mt-12">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-white mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      to={createPageUrl(link.page)}
                      className="text-gray-400 text-sm hover:text-[#00d4ff] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-12">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
              <ul className="space-y-3">
                {contactInfo.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <a
                        href={item.href}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition-colors text-sm"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.value}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Follow Us</h4>
              <div className="flex gap-4">
                {socialLinks.map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-[#00d4ff] transition-colors"
                      title={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Company Info */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">About</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                ASOSINT is a threat intelligence platform powered by Emerging Defense Solutions, delivering advanced open-source intelligence capabilities to security organizations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 px-4 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {currentYear} Emerging Defense Solutions. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#00d4ff] transition-colors">
              Privacy
            </Link>
            <span className="text-gray-700">·</span>
            <Link to={createPageUrl("TermsOfService")} className="hover:text-[#00d4ff] transition-colors">
              Terms
            </Link>
            <span className="text-gray-700">·</span>
            <Link to={createPageUrl("AcceptableUsePolicy")} className="hover:text-[#00d4ff] transition-colors">
              Acceptable Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}