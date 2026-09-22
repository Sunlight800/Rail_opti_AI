import React, { useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Sidebar, NavigationItem } from './components/layout/Sidebar';
import { DashboardView } from './views/DashboardView';
import { DataIntegrationView } from './views/DataIntegrationView';
import { MaintenanceView } from './views/MaintenanceView';
import { AIIntelligenceView } from './views/AIIntelligenceView';
import { PriorityEngineView } from './views/PriorityEngineView';
import { ResourceManagementView } from './views/ResourceManagementView';
import { OperationsView } from './views/OperationsView';
import { ConflictDetectionView } from './views/ConflictDetectionView';
import { BlockPlannerView } from './views/BlockPlannerView';
import { ConsolidationView } from './views/ConsolidationView';
import { WhatIfSimulatorView } from './views/WhatIfSimulatorView';
import { ApprovalCenterView } from './views/ApprovalCenterView';
import { PlanVersionsView } from './views/PlanVersionsView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { LandingPageView } from './views/LandingPageView';
import { LoginModal } from './views/LoginModal';
import { UserProfileData } from './types/dashboard';
import { ROLE_ALLOWED_VIEWS } from './components/layout/Sidebar';
import { ShieldAlert } from 'lucide-react';
import { getStoredUser, clearAuth } from './services/api';


export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavigationItem | 'landing'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfileData | null>(() => {
    return getStoredUser() || {
      id: 'USR-ADM-01',
      username: 'admin',
      email: 'admin@railopt.ai',
      full_name: 'Shri Rajesh Sharma',
      role: 'ADMIN',
      department: 'Operations',
      avatar_initials: 'AD',
    };
  });

  const handleLogout = () => {
    clearAuth();
    setUser({
      id: 'USR-DEMO-01',
      username: 'demo_user',
      email: 'demo@railopt.ai',
      full_name: 'Demo Evaluation User',
      role: 'DEMO_USER',
      department: 'Operations',
      avatar_initials: 'DM',
    });
    setCurrentView('dashboard');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const activeRole = (user?.role || 'ADMIN').toUpperCase();
  const allowedViews = ROLE_ALLOWED_VIEWS[activeRole] || ROLE_ALLOWED_VIEWS['DEMO_USER'];
  const isAccessDenied = currentView !== 'landing' && !allowedViews.includes(currentView as NavigationItem);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-railnavy-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation Bar */}
      <TopBar
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onNavigate={(view) => setCurrentView(view as NavigationItem)}
      />

      {/* Main Layout Container */}
      <div className="flex">
        {currentView !== 'landing' && (
          <Sidebar
            currentView={currentView as NavigationItem}
            onSelectView={(view) => setCurrentView(view)}
            pendingApprovalsCount={5}
            userRole={user?.role || 'ADMIN'}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {isAccessDenied ? (
            <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 text-center">
              <div className="max-w-md w-full bg-railnavy-900 border border-rose-500/40 rounded-2xl p-8 shadow-2xl space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">403 — Access Denied</h2>
                  <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                    Role Restricted: {user?.role || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Your current role does not have authorization to view the module <span className="font-mono text-cyan-400 font-semibold">"{currentView}"</span>.
                    Access is restricted under RAILOPT AI Role-Based Access Control policies.
                  </p>
                </div>
                <div className="pt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white text-xs font-semibold border border-railnavy-700 transition"
                  >
                    Switch Role
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'landing' && (
                <LandingPageView
                  onEnterDashboard={() => setCurrentView('dashboard')}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                />
              )}

              {currentView === 'dashboard' && (
                <DashboardView
                  user={user}
                  onNavigate={(view) => setCurrentView(view as NavigationItem)}
                  onSelectTask={(taskId) => {
                    console.log('Selected task:', taskId);
                    setCurrentView('maintenance');
                  }}
                />
              )}

              {currentView === 'data-integration' && (
                <DataIntegrationView />
              )}

              {currentView === 'maintenance' && (
                <MaintenanceView />
              )}

              {currentView === 'ai-intelligence' && (
                <AIIntelligenceView />
              )}

              {currentView === 'priority-engine' && (
                <PriorityEngineView />
              )}

              {currentView === 'resources' && (
                <ResourceManagementView />
              )}

              {currentView === 'operations' && (
                <OperationsView />
              )}

              {currentView === 'conflict-detection' && (
                <ConflictDetectionView />
              )}

              {currentView === 'block-planning' && (
                <BlockPlannerView />
              )}

              {currentView === 'consolidation' && (
                <ConsolidationView />
              )}

              {currentView === 'what-if' && (
                <WhatIfSimulatorView />
              )}

              {currentView === 'approval-center' && (
                <ApprovalCenterView />
              )}

              {currentView === 'plan-versions' && (
                <PlanVersionsView />
              )}

              {currentView === 'analytics' && (
                <AnalyticsView />
              )}

              {currentView === 'reports' && (
                <ReportsView />
              )}

              {currentView === 'audit-log' && (
                <AuditLogView />
              )}

              {currentView === 'settings' && (
                <SettingsView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Login & Role Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          const newRole = loggedInUser.role.toUpperCase();
          const newAllowed = ROLE_ALLOWED_VIEWS[newRole] || ROLE_ALLOWED_VIEWS['DEMO_USER'];
          if (currentView !== 'landing' && !newAllowed.includes(currentView as NavigationItem)) {
            setCurrentView('dashboard');
          }
        }}
      />
    </div>
  );
};

export default App;
