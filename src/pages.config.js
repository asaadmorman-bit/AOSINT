/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AboutEDS from './pages/AboutEDS';
import AcceptableUseEnforcement from './pages/AcceptableUseEnforcement';
import AcceptableUsePolicy from './pages/AcceptableUsePolicy';
import AccountManagement from './pages/AccountManagement';
import AdminConsole from './pages/AdminConsole';
import AdvancedArchitecture from './pages/AdvancedArchitecture';
import AdversaryEmulation from './pages/AdversaryEmulation';
import AgentMarketplace from './pages/AgentMarketplace';
import AgentOps from './pages/AgentOps';
import AgentRoster from './pages/AgentRoster';
import AlertConfiguration from './pages/AlertConfiguration';
import AnalyticQuestions from './pages/AnalyticQuestions';
import ApiKeys from './pages/ApiKeys';
import Assessments from './pages/Assessments';
import Assets from './pages/Assets';
import BehaviorAnalyticsDashboard from './pages/BehaviorAnalyticsDashboard';
import BigQueryThreatAnalysis from './pages/BigQueryThreatAnalysis';
import BillingPortal from './pages/BillingPortal';
import BrandIdentity from './pages/BrandIdentity';
import BriefingEngine from './pages/BriefingEngine';
import CapabilityShowcase from './pages/CapabilityShowcase';
import Careers from './pages/Careers';
import CertificationEngine from './pages/CertificationEngine';
import CommunityReportAdmin from './pages/CommunityReportAdmin';
import CommunityReporting from './pages/CommunityReporting';
import Comparison from './pages/Comparison';
import ComplianceControls from './pages/ComplianceControls';
import ComplianceDocumentation from './pages/ComplianceDocumentation';
import CustomAlertRuleManagement from './pages/CustomAlertRuleManagement';
import Dashboard from './pages/Dashboard';
import DataFlowsAndWorkflows from './pages/DataFlowsAndWorkflows';
import DemoMode from './pages/DemoMode';
import DevOpsDashboard from './pages/DevOpsDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import DiscordIntegrationHub from './pages/DiscordIntegrationHub';
import DiscordServerManagement from './pages/DiscordServerManagement';
import Documentation from './pages/Documentation';
import DocumentationHub from './pages/DocumentationHub';
import EntityGraph from './pages/EntityGraph';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import EyeOfShauntzeV2 from './pages/EyeOfShauntzeV2';
import FeedSubscriptions from './pages/FeedSubscriptions';
import Forum from './pages/Forum';
import FounderBios from './pages/FounderBios';
import GlobalSituationalAwareness from './pages/GlobalSituationalAwareness';
import GlobalThreatObservatory from './pages/GlobalThreatObservatory';
import GovIntelFeeds from './pages/GovIntelFeeds';
import Home from './pages/Home';
import Homepage from './pages/Homepage';
import Indicators from './pages/Indicators';
import IntegrationGuide from './pages/IntegrationGuide';
import IntegrationHub from './pages/IntegrationHub';
import Integrations from './pages/Integrations';
import IntelFeeds from './pages/IntelFeeds';
import IntelReports from './pages/IntelReports';
import InvestigationDashboard from './pages/InvestigationDashboard';
import Investigations from './pages/Investigations';
import LegalObligations from './pages/LegalObligations';
import Marketplace from './pages/Marketplace';
import MarketplaceAppDetail from './pages/MarketplaceAppDetail';
import MasterBlueprint from './pages/MasterBlueprint';
import MaturityDashboard from './pages/MaturityDashboard';
import MitreAttackDashboard from './pages/MitreAttackDashboard';
import MobileAppSubmission from './pages/MobileAppSubmission';
import ModelLifecycleManagement from './pages/ModelLifecycleManagement';
import Modules from './pages/Modules';
import MyApps from './pages/MyApps';
import NotionSync from './pages/NotionSync';
import OperatorMode from './pages/OperatorMode';
import OsintHub from './pages/OsintHub';
import PartnerAdmin from './pages/PartnerAdmin';
import PartnerOnboarding from './pages/PartnerOnboarding';
import PartnerPortal from './pages/PartnerPortal';
import Partners from './pages/Partners';
import PersonOsintSearch from './pages/PersonOsintSearch';
import PlatformArchitecture from './pages/PlatformArchitecture';
import PlaybookExecutionEngine from './pages/PlaybookExecutionEngine';
import PolicyHub from './pages/PolicyHub';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProgramBlueprint from './pages/ProgramBlueprint';
import ProgramBuilder from './pages/ProgramBuilder';
import QuantumOps from './pages/QuantumOps';
import QuantumOrchestration from './pages/QuantumOrchestration';
import QuestionLab from './pages/QuestionLab';
import ResearchHub from './pages/ResearchHub';
import SEOAndRetention from './pages/SEOAndRetention';
import SaDashboard from './pages/SaDashboard';
import SecurityBriefings from './pages/SecurityBriefings';
import SecurityDashboard from './pages/SecurityDashboard';
import SecurityOperationsCenter from './pages/SecurityOperationsCenter';
import SecuritySettings from './pages/SecuritySettings';
import SelfHostingGuide from './pages/SelfHostingGuide';
import SocialMediaMonitoring from './pages/SocialMediaMonitoring';
import SocialSharing from './pages/SocialSharing';
import Support from './pages/Support';
import SystemRequirements from './pages/SystemRequirements';
import TTPAnalysis from './pages/TTPAnalysis';
import TeamManagement from './pages/TeamManagement';
import TermsOfService from './pages/TermsOfService';
import TestingSuite from './pages/TestingSuite';
import ThreatActorProfiles from './pages/ThreatActorProfiles';
import ThreatActors from './pages/ThreatActors';
import ThreatFeeds from './pages/ThreatFeeds';
import ThreatGeoTimeline from './pages/ThreatGeoTimeline';
import ThreatHunting from './pages/ThreatHunting';
import ThreatIntelByRegion from './pages/ThreatIntelByRegion';
import ThreatIntelCorrelation from './pages/ThreatIntelCorrelation';
import ThreatIntelligenceVisualization from './pages/ThreatIntelligenceVisualization';
import TierServerSetup from './pages/TierServerSetup';
import ToolComparison from './pages/ToolComparison';
import Transforms from './pages/Transforms';
import TrialManagement from './pages/TrialManagement';
import TrialSignup from './pages/TrialSignup';
import UATReportTemplate from './pages/UATReportTemplate';
import UATScript from './pages/UATScript';
import UATSignOff from './pages/UATSignOff';
import UAT_Briefing from './pages/UAT_Briefing';
import UserProfile from './pages/UserProfile';
import VulnerabilityManagement from './pages/VulnerabilityManagement';
import WarRooms from './pages/WarRooms';
import WatchlistConfig from './pages/WatchlistConfig';
import WhyAsoint from './pages/WhyAsoint';
import AIAnalystAssistant from './pages/AIAnalystAssistant';
import IOCManagement from './pages/IOCManagement';
import MobileCompanion from './pages/MobileCompanion';
import SOCCaseManagement from './pages/SOCCaseManagement';
import SocialMediaIntelligence from './pages/SocialMediaIntelligence';
import TeamSync from './pages/TeamSync';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutEDS": AboutEDS,
    "AcceptableUseEnforcement": AcceptableUseEnforcement,
    "AcceptableUsePolicy": AcceptableUsePolicy,
    "AccountManagement": AccountManagement,
    "AdminConsole": AdminConsole,
    "AdvancedArchitecture": AdvancedArchitecture,
    "AdversaryEmulation": AdversaryEmulation,
    "AgentMarketplace": AgentMarketplace,
    "AgentOps": AgentOps,
    "AgentRoster": AgentRoster,
    "AlertConfiguration": AlertConfiguration,
    "AnalyticQuestions": AnalyticQuestions,
    "ApiKeys": ApiKeys,
    "Assessments": Assessments,
    "Assets": Assets,
    "BehaviorAnalyticsDashboard": BehaviorAnalyticsDashboard,
    "BigQueryThreatAnalysis": BigQueryThreatAnalysis,
    "BillingPortal": BillingPortal,
    "BrandIdentity": BrandIdentity,
    "BriefingEngine": BriefingEngine,
    "CapabilityShowcase": CapabilityShowcase,
    "Careers": Careers,
    "CertificationEngine": CertificationEngine,
    "CommunityReportAdmin": CommunityReportAdmin,
    "CommunityReporting": CommunityReporting,
    "Comparison": Comparison,
    "ComplianceControls": ComplianceControls,
    "ComplianceDocumentation": ComplianceDocumentation,
    "CustomAlertRuleManagement": CustomAlertRuleManagement,
    "Dashboard": Dashboard,
    "DataFlowsAndWorkflows": DataFlowsAndWorkflows,
    "DemoMode": DemoMode,
    "DevOpsDashboard": DevOpsDashboard,
    "DeveloperDashboard": DeveloperDashboard,
    "DiscordIntegrationHub": DiscordIntegrationHub,
    "DiscordServerManagement": DiscordServerManagement,
    "Documentation": Documentation,
    "DocumentationHub": DocumentationHub,
    "EntityGraph": EntityGraph,
    "ExecutiveDashboard": ExecutiveDashboard,
    "EyeOfShauntzeV2": EyeOfShauntzeV2,
    "FeedSubscriptions": FeedSubscriptions,
    "Forum": Forum,
    "FounderBios": FounderBios,
    "GlobalSituationalAwareness": GlobalSituationalAwareness,
    "GlobalThreatObservatory": GlobalThreatObservatory,
    "GovIntelFeeds": GovIntelFeeds,
    "Home": Home,
    "Homepage": Homepage,
    "Indicators": Indicators,
    "IntegrationGuide": IntegrationGuide,
    "IntegrationHub": IntegrationHub,
    "Integrations": Integrations,
    "IntelFeeds": IntelFeeds,
    "IntelReports": IntelReports,
    "InvestigationDashboard": InvestigationDashboard,
    "Investigations": Investigations,
    "LegalObligations": LegalObligations,
    "Marketplace": Marketplace,
    "MarketplaceAppDetail": MarketplaceAppDetail,
    "MasterBlueprint": MasterBlueprint,
    "MaturityDashboard": MaturityDashboard,
    "MitreAttackDashboard": MitreAttackDashboard,
    "MobileAppSubmission": MobileAppSubmission,
    "ModelLifecycleManagement": ModelLifecycleManagement,
    "Modules": Modules,
    "MyApps": MyApps,
    "NotionSync": NotionSync,
    "OperatorMode": OperatorMode,
    "OsintHub": OsintHub,
    "PartnerAdmin": PartnerAdmin,
    "PartnerOnboarding": PartnerOnboarding,
    "PartnerPortal": PartnerPortal,
    "Partners": Partners,
    "PersonOsintSearch": PersonOsintSearch,
    "PlatformArchitecture": PlatformArchitecture,
    "PlaybookExecutionEngine": PlaybookExecutionEngine,
    "PolicyHub": PolicyHub,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "ProgramBlueprint": ProgramBlueprint,
    "ProgramBuilder": ProgramBuilder,
    "QuantumOps": QuantumOps,
    "QuantumOrchestration": QuantumOrchestration,
    "QuestionLab": QuestionLab,
    "ResearchHub": ResearchHub,
    "SEOAndRetention": SEOAndRetention,
    "SaDashboard": SaDashboard,
    "SecurityBriefings": SecurityBriefings,
    "SecurityDashboard": SecurityDashboard,
    "SecurityOperationsCenter": SecurityOperationsCenter,
    "SecuritySettings": SecuritySettings,
    "SelfHostingGuide": SelfHostingGuide,
    "SocialMediaMonitoring": SocialMediaMonitoring,
    "SocialSharing": SocialSharing,
    "Support": Support,
    "SystemRequirements": SystemRequirements,
    "TTPAnalysis": TTPAnalysis,
    "TeamManagement": TeamManagement,
    "TermsOfService": TermsOfService,
    "TestingSuite": TestingSuite,
    "ThreatActorProfiles": ThreatActorProfiles,
    "ThreatActors": ThreatActors,
    "ThreatFeeds": ThreatFeeds,
    "ThreatGeoTimeline": ThreatGeoTimeline,
    "ThreatHunting": ThreatHunting,
    "ThreatIntelByRegion": ThreatIntelByRegion,
    "ThreatIntelCorrelation": ThreatIntelCorrelation,
    "ThreatIntelligenceVisualization": ThreatIntelligenceVisualization,
    "TierServerSetup": TierServerSetup,
    "ToolComparison": ToolComparison,
    "Transforms": Transforms,
    "TrialManagement": TrialManagement,
    "TrialSignup": TrialSignup,
    "UATReportTemplate": UATReportTemplate,
    "UATScript": UATScript,
    "UATSignOff": UATSignOff,
    "UAT_Briefing": UAT_Briefing,
    "UserProfile": UserProfile,
    "VulnerabilityManagement": VulnerabilityManagement,
    "WarRooms": WarRooms,
    "WatchlistConfig": WatchlistConfig,
    "WhyAsoint": WhyAsoint,
    "AIAnalystAssistant": AIAnalystAssistant,
    "IOCManagement": IOCManagement,
    "MobileCompanion": MobileCompanion,
    "SOCCaseManagement": SOCCaseManagement,
    "SocialMediaIntelligence": SocialMediaIntelligence,
    "TeamSync": TeamSync,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};