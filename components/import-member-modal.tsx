'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
  Loader2, X, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Mapping {
  name: string;
  prn: string;
  position: string;
  department: string;
  status: string;
}

export function ImportMemberModal({ open, onOpenChange, onSuccess }: ImportMemberModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'result'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    name: '',
    prn: '',
    position: '',
    department: '',
    status: '',
  });
  
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 5MB.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        const headerRow = data[0] as string[];
        setHeaders(headerRow);
        setRawData(XLSX.utils.sheet_to_json(ws));
        
        // Auto-mapping attempt
        const newMapping = { ...mapping };
        headerRow.forEach(h => {
          const lowerH = h.toLowerCase();
          if (lowerH.includes('nama')) newMapping.name = h;
          if (lowerH.includes('prn') || lowerH.includes('id')) newMapping.prn = h;
          if (lowerH.includes('jabatan')) newMapping.position = h;
          if (lowerH.includes('dept')) newMapping.department = h;
          if (lowerH.includes('status')) newMapping.status = h;
        });
        setMapping(newMapping);
        setStep('mapping');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleNextToPreview = () => {
    if (!mapping.name || !mapping.prn || !mapping.position) {
      alert("Nama, PRN, dan Jabatan wajib di-mapping.");
      return;
    }

    const mapped = rawData.map(row => ({
      name: row[mapping.name],
      prn: row[mapping.prn],
      position: row[mapping.position],
      department: row[mapping.department] || '',
      status: row[mapping.status] || 'AKTIF'
    }));

    setProcessedData(mapped);
    setStep('preview');
  };

  const handleStartImport = async () => {
    setStep('processing');
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: processedData })
      });
      const result = await res.json();
      setImportResult(result);
      setStep('result');
      if (result.success > 0) onSuccess();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Terjadi kesalahan saat mengimpor data.');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setMapping({ name: '', prn: '', position: '', department: '', status: '' });
    setImportResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isLoading) onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Massal Pengurus
          </DialogTitle>
          <DialogDescription>
            Unggah file Excel atau CSV untuk menambah banyak pengurus sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-slate-900 font-semibold text-lg">Pilih File XLSX atau CSV</p>
              <p className="text-slate-500 text-sm mt-1">Maksimal ukuran file 5MB</p>
              <div className="mt-6 flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Nama Lengkap</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> PRN</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Jabatan</span>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Pastikan header kolom di file Anda sesuai dengan field sistem. Sesuaikan mapping di bawah jika diperlukan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(mapping) as Array<keyof Mapping>).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">
                      {key === 'name' ? 'Nama Lengkap *' : key === 'prn' ? 'PRN *' : key === 'position' ? 'Jabatan *' : key === 'department' ? 'Departemen' : 'Status Keanggotaan'}
                    </Label>
                    <select 
                      value={mapping[key]} 
                      onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Preview Data ({processedData.length} Baris)</h3>
                <span className="text-xs text-slate-500 italic">* Menampilkan 5 baris pertama</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">PRN</th>
                      <th className="px-3 py-2">Jabatan</th>
                      <th className="px-3 py-2">Dept</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">{row.prn}</td>
                        <td className="px-3 py-2">{row.position}</td>
                        <td className="px-3 py-2">{row.department || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", 
                            row.status === 'AKTIF' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-[11px] text-indigo-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Sistem akan membuat akun User otomatis dengan password default: <strong>SALAMINOVATOR</strong>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-lg">Memproses Data...</p>
                <p className="text-slate-500 text-sm">Harap tunggu, sistem sedang membuat akun member dan user.</p>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Berhasil</p>
                  <p className="text-4xl font-black text-green-700">{importResult.success}</p>
                </div>
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Gagal</p>
                  <p className="text-4xl font-black text-red-700">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800">Detail Kegagalan:</h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {importResult.errors.map((err: any, i: number) => (
                      <div key={i} className="p-3 text-xs flex items-start gap-3 bg-red-50/30">
                        <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700">{err.prn}: {err.row.name}</p>
                          <p className="text-red-600 mt-0.5">{err.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t">
          {step === 'upload' && (
             <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="ghost" onClick={() => setStep('upload')}>Kembali</Button>
              <Button onClick={handleNextToPreview} className="bg-indigo-600">
                Lanjut ke Preview <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => setStep('mapping')}>Kembali</Button>
              <Button onClick={handleStartImport} className="bg-green-600 hover:bg-green-700 text-white">
                Mulai Import Sekarang
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => onOpenChange(false)} className="w-full bg-indigo-600">Selesai</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
