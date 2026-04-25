'use client';

import { Edit2, Plus, Trash2 } from 'lucide-react';
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

interface MembersTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onAddPoints?: (member: Member) => void;
  onDelete?: (memberId: string) => void;
}

export function MembersTable({ members, onEdit, onAddPoints, onDelete }: MembersTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold text-slate-700">Name</TableHead>
            <TableHead className="font-semibold text-slate-700">PRN</TableHead>
            <TableHead className="font-semibold text-slate-700">Department</TableHead>
            <TableHead className="font-semibold text-slate-700">Points</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Join Date</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="hover:bg-slate-50">
              <TableCell className="font-medium text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                    {getInitials(member.name)}
                  </div>
                  <span>{member.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{member.prn}</TableCell>
              <TableCell className="text-slate-600">{member.department}</TableCell>
              <TableCell className="font-semibold text-slate-900">{member.points ?? 0}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    member.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }
                >
                  {member.status === 'active' ? '✓ Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">{member.joinDate}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddPoints?.(member)}
                    title="Add Points"
                    className="text-slate-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(member)}
                    title="Edit"
                    className="text-slate-600 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(member.id)}
                    title="Delete"
                    className="text-slate-600 hover:text-red-600"
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
