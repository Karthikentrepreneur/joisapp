import React, { useState } from 'react';
import { UserRole, View } from '../types';
import { Shield, Save, CheckCircle2, Lock, PenTool, Upload } from 'lucide-react';
import { mockStaff } from '../data/mockData';

interface SettingsProps {
  permissions: Record<UserRole, View[]>;
  setPermissions: React.Dispatch<React.SetStateAction<Record<UserRole, View[]>>>;
}

export const Settings: React.FC<SettingsProps> = ({ permissions, setPermissions }) => {
  const views = Object.values(View).filter(v => v !== View.SETTINGS); 
  const roles = [UserRole.TEACHER, UserRole.PARENT, UserRole.TRANSPORT]; 

  // Simulate currently logged in staff (first teacher for demo)
  const [currentStaff, setCurrentStaff] = useState(mockStaff[0]);
  const [signaturePreview, setSignaturePreview] = useState<string | undefined>(currentStaff.signature);

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
    if (signaturePreview) {
      currentStaff.signature = signaturePreview; // Update mock data
      alert("Signature saved successfully! It will now appear on official documents.");
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Manage profile, access control, and configurations.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" /> Admin Access
        </div>
      </div>

      <div className="space-y-6">
        {/* Digital Signature Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-purple-500" /> Digital Signature
               </h3>
               <p className="text-sm text-slate-500">
                  Upload your signature to use in official documents like Payslips and Notices.
               </p>
            </div>
            {signaturePreview && signaturePreview !== currentStaff.signature && (
               <button 
                  onClick={saveSignature}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
               >
                  <Save className="w-4 h-4" /> Save Signature
               </button>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
                   <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700">Upload Signature Image</h4>
                <p className="text-xs text-slate-400 mt-1">PNG or JPG, transparent background recommended</p>
             </div>
             
             <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preview</p>
                {signaturePreview ? (
                   <img src={signaturePreview} alt="Signature Preview" className="max-h-24 object-contain mix-blend-multiply" />
                ) : (
                   <p className="text-slate-400 italic text-sm">No signature uploaded yet.</p>
                )}
                <div className="w-32 border-b border-slate-300 mt-4"></div>
             </div>
          </div>
        </div>

        {/* Permissions Section */}
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
      </div>
    </div>
  );
};