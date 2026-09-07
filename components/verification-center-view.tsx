'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PermissionsView } from '@/components/permissions-view';
import { AdminClaimsView } from '@/components/admin-claims-view';
import { FileCheck, Award, ShieldCheck } from 'lucide-react';

interface VerificationCenterViewProps {
  sysSettings?: any;
  userRole?: string;
  userId?: string;
}

export function VerificationCenterView({ sysSettings, userRole, userId }: VerificationCenterViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'perizinan' | 'klaim'>('perizinan');

  return (
    <div className="space-y-6">
      {/* Tabs Container */}
      <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200">
          <TabsTrigger 
            value="perizinan" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <FileCheck className="w-4 h-4" />
            Perizinan
          </TabsTrigger>
          <TabsTrigger 
            value="klaim" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <Award className="w-4 h-4" />
            Klaim Prestasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perizinan" className="mt-6 focus-visible:outline-none">
          <PermissionsView 
            sysSettings={sysSettings} 
            userRole={userRole} 
            userId={userId} 
          />
        </TabsContent>

        <TabsContent value="klaim" className="mt-6 focus-visible:outline-none">
          <AdminClaimsView 
            userRole={userRole} 
            userId={userId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
