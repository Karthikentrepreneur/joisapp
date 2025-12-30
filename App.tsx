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
import { Documents } from './views/Documents';
import { Settings } from './views/Settings';
import { Leave } from './views/Leave';
import { Toast, ToastMessage, ToastType } from './components/Toast';
import { UserRole, View } from './types';

const DEFAULT_PERMISSIONS = {
  [UserRole.ADMIN]: [
    View.DASHBOARD, View.STUDENTS, View.STAFF, View.ACADEMICS, 
    View.ATTENDANCE, View.LEAVE, View.FEES, View.TRANSPORT, View.SAFETY, 
    View.COMMUNICATION, View.DOCUMENTS, View.SETTINGS
  ],
  [UserRole.TEACHER]: [
    View.DASHBOARD, View.STUDENTS, View.ACADEMICS, View.ATTENDANCE, 
    View.LEAVE, View.COMMUNICATION, View.DOCUMENTS, View.SETTINGS
  ],
  [UserRole.PARENT]: [
    View.DASHBOARD, View.ACADEMICS, View.ATTENDANCE, View.LEAVE, View.COMMUNICATION, View.DOCUMENTS
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

  const renderView = () => {
    const commonProps = { role, showToast };
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard {...commonProps} onNavigate={setCurrentView} />;
      case View.STUDENTS:
        return <Students {...commonProps} />;
      case View.STAFF:
        return <Staff {...commonProps} />;
      case View.TRANSPORT:
        return <Transport showToast={showToast} />;
      case View.SAFETY:
        return <Safety />;
      case View.ACADEMICS:
        return <Academics {...commonProps} />;
      case View.AI_ASSISTANT:
        return <AIAssistant />;
      case View.FEES:
        return <Fees {...commonProps} />;
      case View.ATTENDANCE:
        return <Attendance {...commonProps} />;
      case View.LEAVE:
        return <Leave {...commonProps} />;
      case View.COMMUNICATION:
        return <Communication {...commonProps} />;
      case View.DOCUMENTS:
        return <Documents {...commonProps} />;
      case View.SETTINGS:
        return <Settings role={role} permissions={permissions} setPermissions={setPermissions} />;
      default:
        return <Dashboard {...commonProps} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
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
