'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Download, Maximize2, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvidencePreviewProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidencePreview({ url, isOpen, onClose }: EvidencePreviewProps) {
  if (!url) return null;

  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('image');
  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] md:h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-900/95 border-slate-800 backdrop-blur-xl shadow-2xl [&>button:last-child]:hidden">
        <DialogHeader className="p-4 bg-white/10 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                {isImage ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
             </div>
             <div>
               <DialogTitle className="text-white text-lg font-bold">Bukti Dokumentasi</DialogTitle>
               <DialogDescription className="sr-only">
                 Halaman pratinjau untuk bukti dokumentasi kegiatan pengurus.
               </DialogDescription>
               <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Pratinjau</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9"
              onClick={() => window.open(url, '_blank')}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Tab Baru
            </Button>
            <a href={url} download className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Unduh
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-full h-9 w-9"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950/50">
          {isImage ? (
            <div className="relative group max-w-full max-h-full">
              <img 
                src={url} 
                alt="Evidence" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5 animate-in zoom-in-95 duration-300" 
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in duration-500">
              <iframe 
                src={`${url}#toolbar=0`} 
                className="w-full h-full border-none" 
                title="PDF Evidence" 
              />
            </div>
          ) : (
            <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10 max-w-md w-full">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                <FileText className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Format Tidak Didukung</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">Format file ini tidak mendukung pratinjau langsung di dalam aplikasi. Silakan unduh file untuk melihatnya.</p>
              <a 
                href={url} 
                download 
                className="inline-flex items-center justify-center bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Download className="w-5 h-5 mr-2" />
                Unduh File Sekarang
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
