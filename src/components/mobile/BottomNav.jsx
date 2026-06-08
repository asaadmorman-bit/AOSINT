import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Map, Radio, QrCode, Settings } from "lucide-react";

// Filled SVG icons for active state (native app feel)
const HomeFilled = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.55 2.533a2 2 0 0 1 2.9 0l7 7.467A2 2 0 0 1 21 11.467V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.533a2 2 0 0 1 .55-1.367l7-7.467Z"/>
  </svg>
);
const RadioFilled = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M5.636 5.636a1 1 0 0 1 1.414 0 7 7 0 0 1 0 9.9 1 1 0 0 1-1.414-1.415 5 5 0 0 0 0-7.07 1 1 0 0 1 0-1.415Zm12.728 0a1 1 0 0 1 0 1.415 5 5 0 0 0 0 7.07 1 1 0 0 1-1.414 1.415 7 7 0 0 1 0-9.9 1 1 0 0 1 1.414 0ZM3.515 3.515a1 1 0 0 1 1.414 0 10 10 0 0 1 0 14.142 1 1 0 0 1-1.414-1.414 8 8 0 0 0 0-11.314 1 1 0 0 1 0-1.414Zm16.97 0a1 1 0 0 1 0 1.414 8 8 0 0 0 0 11.314 1 1 0 0 1-1.414 1.414 10 10 0 0 1 0-14.142 1 1 0 0 1 1.414 0Z"/>
  </svg>
);
const BarChartFilled = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="10" width="4" height="11" rx="1"/>
    <rect x="10" y="4" width="4" height="17" rx="1"/>
    <rect x="18" y="7" width="4" height="14" rx="1"/>
  </svg>
);
const UserFilled = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7H4Z"/>
  </svg>
);

const NAV_ITEMS = [
  { label: "Home", page: "Dashboard", icon: LayoutDashboard },
  { label: "Map", page: "OperatorDashboard", icon: Map },
  { label: "Feeds", page: "IntelFeeds", icon: Radio },
  { label: "Workbench", page: "OsintWorkbench", icon: QrCode },
  { label: "Settings", page: "AccountSettings", icon: Settings },
];

const ROOT_PAGES = new Set(NAV_ITEMS.map(i => i.page));

const SUB_PAGE_TAB_MAP = {
  "GlobalThreatObservatory": "Dashboard", "ThreatFeeds": "Dashboard", "BriefingEngine": "Dashboard",
  "ExecutiveDashboard": "Dashboard", "OperatorMode": "Dashboard", "SaDashboard": "Dashboard",
  "ThreatActors": "IntelFeeds", "Indicators": "IntelFeeds", "Transforms": "IntelFeeds",
  "OsintHub": "IntelFeeds", "IntelReports": "IntelFeeds", "ThreatHunting": "IntelFeeds",
  "EvasionMap": "OperatorDashboard",
  "CaseDrillDown": "OsintWorkbench",
  "AccountManagement": "AccountSettings", "SecuritySettings": "AccountSettings",
  "NotificationSettings": "AccountSettings", "ApiKeys": "AccountSettings", "UserProfile": "AccountSettings",
};

// Map each tab root to its last visited sub-page
const tabHistory = (() => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('bottomTabHistory');
    return stored ? JSON.parse(stored) : NAV_ITEMS.reduce((acc, i) => ({ ...acc, [i.page]: i.page }), {});
  } catch {
    return NAV_ITEMS.reduce((acc, i) => ({ ...acc, [i.page]: i.page }), {});
  }
})();

// Called by Layout whenever the page changes, to remember where we were
export function recordTabPage(pageName) {
  const tabRoot = SUB_PAGE_TAB_MAP[pageName] || (ROOT_PAGES.has(pageName) ? pageName : null);
  if (tabRoot) {
    tabHistory[tabRoot] = pageName;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bottomTabHistory', JSON.stringify(tabHistory));
    }
  }
}

export default function BottomNav({ currentPageName }) {
  const navigate = useNavigate();

  // Determine active tab root (handle sub-pages too)
  const activeTab = NAV_ITEMS.find(i => i.page === currentPageName)?.page
    || SUB_PAGE_TAB_MAP[currentPageName]
    || null;

  const handleTabPress = useCallback((item) => {
    if (activeTab === item.page) {
      // Already on this tab — reset history and navigate to tab root
      tabHistory[item.page] = item.page;
      navigate(createPageUrl(item.page));
      return;
    }
    // Navigate to the last known page within this tab
    const dest = tabHistory[item.page] || item.page;
    navigate(createPageUrl(dest));
  }, [currentPageName, activeTab, navigate]);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1220]/95 backdrop-blur-xl border-t border-white/8 flex items-center justify-around"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const { label, page, icon: Icon } = item;
        const isActive = activeTab === page;
        return (
          <button
            key={page}
            onClick={() => handleTabPress(item)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all active:scale-95"
            style={{ minHeight: 56 }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ backgroundColor: isActive ? "rgba(0,212,255,0.12)" : "transparent" }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "#00d4ff" : "#6b7280" }} />
            </div>
            <span className="text-[9px] font-medium" style={{ color: isActive ? "#00d4ff" : "#6b7280" }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}