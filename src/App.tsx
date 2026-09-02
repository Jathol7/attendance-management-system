import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { ForcePasswordModal } from './components/auth/ForcePasswordModal';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Clock } from 'lucide-react';
import { api } from './services/api';

function MainApp() {
  const { user, isAuthenticated, isLoading, viewMode } = useAuth();
  const [adminTab, setAdminTab] = useState<'live' | 'logs' | 'employees' | 'reports' | 'system'>('live');
  const [empTab, setEmpTab] = useState<'terminal' | 'history'>('terminal');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 animate-bounce">
          <Clock className="w-6 h-6" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">
          Initializing Attendance Management Engine...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  const handleQuickSeed = async () => {
    if (window.confirm('Reset and re-seed sample database with realistic records?')) {
      await api.seedDatabase();
      window.location.reload();
    }
  };

  const currentTab = viewMode === 'admin' && user.role === 'admin' ? adminTab : empTab;
  const handleTabChange = (tab: string) => {
    if (viewMode === 'admin' && user.role === 'admin') {
      setAdminTab(tab as any);
    } else {
      setEmpTab(tab as any);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-[#1e293b] overflow-hidden font-sans">
      {/* Dark Sidebar matching Professional Polish */}
      <Sidebar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onQuickSeed={handleQuickSeed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {viewMode === 'admin' && user.role === 'admin' ? (
            <AdminDashboard activeTab={adminTab} onTabChange={setAdminTab} />
          ) : (
            <EmployeePortal activeTab={empTab} onTabChange={setEmpTab} />
          )}
        </main>
      </div>

      {/* Force Password Change Modal for new hires / temporary credentials */}
      <ForcePasswordModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

