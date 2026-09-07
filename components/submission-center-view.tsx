'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Member, Activity } from '@/app/page';
import { WidgetIzinSaya } from '@/components/widget-izin-saya';
import { PengurusPelaporanView } from '@/components/pengurus-pelaporan-view';
import { FileText, Award, Send } from 'lucide-react';

interface SubmissionCenterViewProps {
  member: Member;
}

export function SubmissionCenterView({ member }: SubmissionCenterViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'izin' | 'klaim'>('izin');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tabs Container */}
      <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200">
          <TabsTrigger 
            value="izin" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            Izin
          </TabsTrigger>
          <TabsTrigger 
            value="klaim" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <Award className="w-4 h-4" />
            Prestasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="izin" className="mt-6 focus-visible:outline-none">
          <WidgetIzinSaya member={member} />
        </TabsContent>

        <TabsContent value="klaim" className="mt-6 focus-visible:outline-none">
          <PengurusPelaporanView member={member} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
