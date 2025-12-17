import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { Transport } from './views/Transport';
import { Safety } from './views/Safety';
import { Academics } from './views/Academics';
import { AIAssistant } from './views/AIAssistant';
import { Students } from './views/Students';
import { Fees } from './views/Fees';
import { Attendance } from './views/Attendance';
import { Communication } from './views/Communication';
import { Staff } from './views/Staff';
import { Documents } from './views/Documents';
import { Settings } from './views/Settings';
import { Leave } from './views/Leave';
import { UserRole, View } from './types';

// Default configuration for role-based access
const DEFAULT_PERMISSIONS = {
  [UserRole.ADMIN]: [
    View.DASHBOARD, View.STUDENTS, View.STAFF, View.ACADEMICS, 
    View.ATTENDANCE, View.LEAVE, View.FEES, View.TRANSPORT, View.SAFETY, 
    View.COMMUNICATION, View.DOCUMENTS, View.SETTINGS
  ],
  [UserRole.TEACHER]: [
    View.DASHBOARD, View.STUDENTS, View.ACADEMICS, View.ATTENDANCE, 
    View.LEAVE, View.COMMUNICATION, View.SETTINGS
  ],
  [UserRole.PARENT]: [
    View.DASHBOARD, View.ACADEMICS, View.ATTENDANCE, View.LEAVE, View.FEES, 
    View.TRANSPORT, View.COMMUNICATION, View.DOCUMENTS, View.SETTINGS
  ],
  [UserRole.TRANSPORT]: [
    View.DASHBOARD, View.TRANSPORT, View.SAFETY, View.SETTINGS
  ]
};

function App() {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<UserRole, View[]>>(DEFAULT_PERMISSIONS);

  // Reset view when role changes if the current view isn't accessible
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!permissions[newRole].includes(currentView)) {
      setCurrentView(View.DASHBOARD);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard role={role} onNavigate={setCurrentView} />;
      case View.STUDENTS:
        return <Students role={role} />;
      case View.STAFF:
        return <Staff role={role} />;
      case View.TRANSPORT:
        return <Transport />;
      case View.SAFETY:
        return <Safety />;
      case View.ACADEMICS:
        return <Academics />;
      case View.AI_ASSISTANT:
        return <AIAssistant />;
      case View.FEES:
        return <Fees role={role} />;
      case View.ATTENDANCE:
        return <Attendance role={role} />;
      case View.LEAVE:
        return <Leave role={role} />;
      case View.COMMUNICATION:
        return <Communication />;
      case View.DOCUMENTS:
        return <Documents />;
      case View.SETTINGS:
        return <Settings role={role} permissions={permissions} setPermissions={setPermissions} />;
      default:
        return <Dashboard role={role} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Container - Logic to show/hide on mobile */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentView={currentView} 
          role={role} 
          permissions={permissions}
          onChangeView={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          role={role} 
          setRole={handleRoleChange} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <main className="flex-1 overflow-hidden relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;