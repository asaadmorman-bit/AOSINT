import { Route, Routes, Navigate } from 'react-router-dom';
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppWrapper from '@/components/AppWrapper';
import EyeOfShauntzeV2 from './pages/EyeOfShauntzeV2';
import ThreatEventDashboard from './pages/ThreatEventDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import OsintWorkbench from './pages/OsintWorkbench';
import SocialMediaMonitoring from './pages/SocialMediaMonitoring';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/EyeOfShauntzeV2" element={<LayoutWrapper currentPageName="EyeOfShauntzeV2"><EyeOfShauntzeV2 /></LayoutWrapper>} />
      <Route path="/SocialMediaMonitoring" element={<LayoutWrapper currentPageName="SocialMediaMonitoring"><SocialMediaMonitoring /></LayoutWrapper>} />
      <Route path="/OperatorDashboard" element={<OperatorDashboard />} />
      <Route path="/OsintWorkbench" element={<LayoutWrapper currentPageName="OsintWorkbench"><OsintWorkbench /></LayoutWrapper>} />
      <Route path="/ThreatEventDashboard" element={<LayoutWrapper currentPageName="ThreatEventDashboard"><ThreatEventDashboard /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AppWrapper>
      <AuthenticatedApp />
    </AppWrapper>
  );
}

export default App