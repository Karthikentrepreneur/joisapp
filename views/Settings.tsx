import React, { useState, useEffect } from 'react';
import { UserRole, View } from '../types';
import { Shield, Save, CheckCircle2, Lock, PenTool, Upload } from 'lucide-react';
import { mockStaff } from '../data/mockData';

interface SettingsProps {
  role: UserRole;
  permissions: Record<UserRole, View[]>;
  setPermissions: React.Dispatch<React.SetStateAction<Record<UserRole, View[]>>>;
}

export const Settings: React.FC<SettingsProps> = ({ role, permissions, setPermissions }) => {
  const views = Object.values(View).filter(v => v !== View.SETTINGS); 
  const roles = [UserRole.TEACHER, UserRole.PARENT, UserRole.TRANSPORT]; 

  // Dynamically find the staff member associated with the current role
  // For demo: Teacher -> First Teacher, Admin -> First Admin, etc.
  const getStaffForRole = () => {
    if (role === UserRole.TEACHER) return mockStaff.find(s => s.role === 'Teacher');
    if (role === UserRole.ADMIN) return mockStaff.find(s => s.role === 'Admin');
    if (role === UserRole.TRANSPORT) return mockStaff.find(s => s.role === 'Driver');
    return undefined; // Parents usually don't have staff signatures in this context
  };

  const [currentStaff, setCurrentStaff] = useState(getStaffForRole());
  const [signaturePreview, setSignaturePreview] = useState<string | undefined>(currentStaff?.signature);

  // Update local state when role changes
  useEffect(() => {
    const staff = getStaffForRole();
    setCurrentStaff(staff);
    setSignaturePreview(staff?.signature);
  }, [role]);

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

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSignature = () => {
    if (signaturePreview && currentStaff) {
      // Find the actual object in mockStaff array and update it (simulating backend update)
      const staffIndex = mockStaff.findIndex(s => s.id === currentStaff.id);
      if (staffIndex !== -1) {
        mockStaff[staffIndex].signature = signaturePreview;
        setCurrentStaff({ ...mockStaff[staffIndex] }); // Update local state
        alert("Signature saved successfully! It will now appear on your official documents.");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Manage profile, access control, and configurations.</p>
        </div>
        {role === UserRole.ADMIN && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Admin Access
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Digital Signature Section - Only for Staff Roles */}
        {(role === UserRole.TEACHER || role === UserRole.ADMIN || role === UserRole.TRANSPORT) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
              <div>
                 <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-500" /> Digital Signature
                 </h3>
                 <p className="text-sm text-slate-500">
                    {currentStaff?.name}, upload your signature for official documents (Payslips, Notices).
                 </p>
              </div>
              {signaturePreview && signaturePreview !== currentStaff?.signature && (
                 <button 
                    onClick={saveSignature}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
                 >
                    <Save className="w-4 h-4" /> Save Signature
                 </button>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative group h-64">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                     <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-lg">Upload New Signature</h4>
                  <p className="text-sm text-slate-400 mt-2">Click or drag image here</p>
                  <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG (Transparent BG recommended)</p>
               </div>
               
               <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center h-64 relative">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Current Preview</div>
                  {signaturePreview ? (
                     <div className="w-full h-full flex items-center justify-center p-4">
                        <img src={signaturePreview} alt="Signature Preview" className="max-w-full max-h-40 object-contain mix-blend-multiply" />
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center text-slate-400">
                        <PenTool className="w-12 h-12 mb-2 opacity-20" />
                        <p className="italic">No signature on file.</p>
                     </div>
                  )}
                  {signaturePreview && (
                     <div className="w-48 border-b-2 border-slate-300 mt-auto mb-4"></div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Permissions Section - Only visible to Admin */}
        {role === UserRole.ADMIN && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-2">Module Permissions</h3>
                <p className="text-sm text-slate-500">
                   Control which components are visible to specific user roles.
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
        )}
      </div>
    </div>
  );
};