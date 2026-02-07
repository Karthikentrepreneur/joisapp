
import React, { useState, useCallback } from 'react';
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
import { Settings } from './views/Settings';
import { Leave } from './views/Leave';
import { Toast, ToastMessage, ToastType } from './components/Toast';
import { UserRole, View, ProgramType } from './types';

const DEFAULT_PERMISSIONS = {
  [UserRole.ADMIN]: [
    View.DASHBOARD, View.STUDENTS, View.STAFF, View.ACADEMICS, 
    View.ATTENDANCE, View.LEAVE, View.FEES, View.TRANSPORT, View.SAFETY, 
    View.COMMUNICATION, View.SETTINGS
  ],
  [UserRole.FOUNDER]: [
    View.DASHBOARD, View.STUDENTS, View.STAFF, View.ACADEMICS, 
    View.ATTENDANCE, View.LEAVE, View.FEES, View.TRANSPORT, View.SAFETY, 
    View.COMMUNICATION, View.SETTINGS
  ],
  [UserRole.TEACHER]: [
    View.DASHBOARD, View.STUDENTS, View.ACADEMICS, View.ATTENDANCE, 
    View.LEAVE, View.COMMUNICATION, View.SETTINGS
  ],
  [UserRole.PARENT]: [
    View.DASHBOARD, View.ACADEMICS, View.ATTENDANCE, View.LEAVE, View.COMMUNICATION
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sharedFilter, setSharedFilter] = useState<'All' | ProgramType>('All');

  const showToast = useCallback((title: string, type: ToastType = 'success', description?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, type, description }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!permissions[newRole].includes(currentView)) {
      setCurrentView(View.DASHBOARD);
    }
    showToast(`Switched to ${newRole} View`, 'info');
  };

  const navigateToStudents = (program: 'All' | ProgramType) => {
    setSharedFilter(program);
    setCurrentView(View.STUDENTS);
    setIsMobileMenuOpen(false);
  };

  const renderView = () => {
    const commonProps = { role, showToast };
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard {...commonProps} onNavigate={setCurrentView} onFilterNavigate={navigateToStudents} />;
      case View.STUDENTS: return <Students {...commonProps} initialFilter={sharedFilter} />;
      case View.STAFF: return <Staff {...commonProps} />;
      case View.TRANSPORT: return <Transport showToast={showToast} />;
      case View.SAFETY: return <Safety />;
      case View.ACADEMICS: return <Academics {...commonProps} />;
      case View.AI_ASSISTANT: return <AIAssistant />;
      case View.FEES: return <Fees {...commonProps} />;
      case View.ATTENDANCE: return <Attendance {...commonProps} />;
      case View.LEAVE: return <Leave {...commonProps} />;
      case View.COMMUNICATION: return <Communication {...commonProps} />;
      case View.SETTINGS: return <Settings role={role} permissions={permissions} setPermissions={setPermissions} />;
      default: return <Dashboard {...commonProps} onNavigate={setCurrentView} onFilterNavigate={navigateToStudents} />;
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm transition-opacity duration-300 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-[70] w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <Sidebar 
          currentView={currentView} 
          role={role} 
          permissions={permissions}
          onChangeView={(view) => {
            if (view !== View.STUDENTS) setSharedFilter('All');
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }} 
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
        <Header 
          role={role} 
          setRole={handleRoleChange} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        {/* Main content scroll container - ensured vertical scroll is allowed and visible */}
        <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] no-scrollbar">
          <div className="w-full min-h-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
