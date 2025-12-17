import React from 'react';
import { UserRole, View } from '../types';
import { Shield, Save, CheckCircle2, Lock } from 'lucide-react';

interface SettingsProps {
  permissions: Record<UserRole, View[]>;
  setPermissions: React.Dispatch<React.SetStateAction<Record<UserRole, View[]>>>;
}

export const Settings: React.FC<SettingsProps> = ({ permissions, setPermissions }) => {
  const views = Object.values(View).filter(v => v !== View.SETTINGS); // Admin can't disable settings for themselves easily here to avoid lockout
  const roles = [UserRole.TEACHER, UserRole.PARENT, UserRole.TRANSPORT]; // Exclude Admin from easy editing to prevent lockout

  const togglePermission = (role: UserRole, view: View) => {
    setPermissions(prev => {
      const currentRolePermissions = prev[role];
      const hasPermission = currentRolePermissions.includes(view);
      
      let newRolePermissions;
      if (hasPermission) {
        newRolePermissions = currentRolePermissions.filter(v => v !== view);
      } else {
        newRolePermissions = [...currentRolePermissions, view];
      }

      return {
        ...prev,
        [role]: newRolePermissions
      };
    });
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Manage role-based access control and module visibility.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" /> Admin Access
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Module Permissions</h3>
            <p className="text-sm text-slate-500">
               Control which components are visible to specific user roles. Unchecking a box will hide that module from the user's sidebar immediately.
            </p>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="p-4 font-bold text-slate-700 text-sm">Module / View</th>
                     {roles.map(role => (
                        <th key={role} className="p-4 font-bold text-slate-700 text-sm text-center w-48">{role}</th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {views.map(view => (
                     <tr key={view} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800 text-sm flex items-center gap-2">
                           {view}
                        </td>
                        {roles.map(role => {
                           const isEnabled = permissions[role].includes(view);
                           return (
                              <td key={`${role}-${view}`} className="p-4 text-center">
                                 <button 
                                    onClick={() => togglePermission(role, view)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                                 >
                                    <span 
                                       className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                 </button>
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <Lock className="w-4 h-4" />
                <span>Admin permissions are locked for safety.</span>
             </div>
         </div>
      </div>
    </div>
  );
};