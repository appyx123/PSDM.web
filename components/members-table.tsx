'use client';

import { Edit2, Trash2, Eye, UserCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Member } from '@/app/page';
import { cn } from '@/lib/utils';

interface MembersTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
  onView: (member: Member) => void;
}

export function MembersTable({ members, onEdit, onDelete, onView }: MembersTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="font-bold text-slate-700 py-4">Nama Pengurus</TableHead>
            <TableHead className="font-bold text-slate-700">PRN</TableHead>
            <TableHead className="font-bold text-slate-700">Departemen</TableHead>
            <TableHead className="font-bold text-slate-700">Jabatan</TableHead>
            <TableHead className="font-bold text-slate-700 text-center">Poin</TableHead>
            <TableHead className="font-bold text-slate-700">Status</TableHead>
            <TableHead className="font-bold text-slate-700 text-right pr-6">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow 
              key={member.id} 
              className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              onClick={() => onView(member)}
            >
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  {member.user?.image ? (
                    <img src={member.user.image} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 border border-indigo-50">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{member.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-0.5">{member.joinDate}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-600">{member.prn}</TableCell>
              <TableCell>
                <span className={cn(
                  "text-sm font-medium",
                  member.department === 'Trisula' ? "text-slate-400 italic" : "text-slate-700"
                )}>
                  {member.department === 'Trisula' ? '-' : member.department}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                  {member.position}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn(
                  "text-sm font-bold",
                  (member.points ?? 100) < 50 ? "text-red-600" : "text-indigo-600"
                )}>
                  {member.points ?? 100}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", member.status === 'AKTIF' ? "bg-green-500" : member.status === 'ALUMNI' ? "bg-indigo-400" : "bg-slate-400")} />
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {member.status}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(member)}
                    className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(member)}
                    className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(member.id)}
                    className="w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
