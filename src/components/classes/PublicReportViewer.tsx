import React, { useEffect, useState, useRef } from 'react';
import { 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Share2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  BookOpen, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Image as ImageIcon,
  Flame,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  CheckCheck,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { decodeReportPayload, StudentReportPayload } from '../../lib/studentReportShare';

export const PublicReportViewer: React.FC = () => {
  const [data, setData] = useState<StudentReportPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'certificate'>('report');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const reportCardRef = useRef<HTMLDivElement>(null);
  const certificateCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportParam = params.get('report');
    
    if (reportParam) {
      const decoded = decodeReportPayload(reportParam);
      if (decoded) {
        setData(decoded);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F3F6] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#F8FAFC] p-4 text-center">
        <div className="w-16 h-16 rounded-2xl clay-icon-pod-gold flex items-center justify-center mb-4 shadow-md">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-black font-serif mb-2 text-[#0F172A] dark:text-white">Tautan Rapor Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Tautan laporan evaluasi tidak valid atau telah kedaluwarsa. Silakan hubungi pengajar atau ustadz untuk mendapatkan tautan rapor terbaru.
        </p>
        <a 
          href="/" 
          className="px-5 py-2.5 rounded-full clay-btn-gold text-white font-black text-xs shadow-xs cursor-pointer"
        >
          Buka Beranda unlupa.id
        </a>
      </div>
    );
  }

  const printDate = (() => {
    try {
      if (data.date && !isNaN(new Date(data.date).getTime())) {
        return new Date(data.date).toLocaleDateString('id-ID', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    } catch { /* ignore */ }
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setExportMessage('Link rapor berhasil disalin ke papan klip!');
    setTimeout(() => {
      setCopied(false);
      setExportMessage(null);
    }, 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*,\n\nBerikut tautan resmi *Rapor & Kartu Prestasi Hafalan* ananda *${data.studentName}* (${data.className}):\n${window.location.href}\n\nBuka tautan ini untuk mengunduh dalam format PDF, Gambar (PNG), atau mencetaknya.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Direct PDF Download using jsPDF + html2canvas
  const handleDownloadPdf = async (target: 'report' | 'certificate') => {
    const element = target === 'certificate' ? certificateCardRef.current : reportCardRef.current;
    if (!element) return;

    try {
      setIsExportingPdf(true);
      setExportMessage(target === 'certificate' ? 'Menyiapkan dokumen PDF Kartu Prestasi...' : 'Menyiapkan dokumen PDF Rapor Santri...');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = target === 'certificate';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const renderedHeight = (imgHeight * pdfWidth) / imgWidth;

      let heightLeft = renderedHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Handle multi-page if the report card is taller than 1 A4 page
      while (heightLeft > 5) {
        position = heightLeft - renderedHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const cleanName = (data.studentName || 'Santri').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = target === 'certificate' 
        ? `Kartu_Prestasi_${cleanName}.pdf` 
        : `Rapor_Hafalan_${cleanName}.pdf`;

      pdf.save(filename);
      setExportMessage(`Berhasil mengunduh ${filename}!`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export PDF', err);
      setExportMessage('Gagal membuat PDF otomatis. Mengalihkan ke jendela cetak...');
      setTimeout(() => {
        setExportMessage(null);
        window.print();
      }, 1200);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct PNG Image Download using html2canvas
  const handleDownloadImage = async (target: 'report' | 'certificate') => {
    const element = target === 'certificate' ? certificateCardRef.current : reportCardRef.current;
    if (!element) return;

    try {
      setIsExportingImage(true);
      setExportMessage(target === 'certificate' ? 'Menyiapkan Gambar Kartu Prestasi...' : 'Menyiapkan Gambar Rapor...');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanName = (data.studentName || 'Santri').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = target === 'certificate' 
        ? `Kartu_Prestasi_${cleanName}.png` 
        : `Rapor_Hafalan_${cleanName}.png`;
      link.href = imgData;
      link.click();
      
      setExportMessage('Gambar resolusi tinggi berhasil diunduh!');
      setTimeout(() => setExportMessage(null), 2500);
    } catch (err) {
      console.error('Failed to export image', err);
      setExportMessage('Gagal mengunduh gambar. Silakan gunakan opsi Cetak/PDF.');
      setTimeout(() => setExportMessage(null), 3000);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F3F6] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#F8FAFC] pb-24 font-sans selection:bg-orange-200">
      
      {/* 1. TOP STICKY ACTIONS BAR (HIDDEN IN PRINT) */}
      <nav className="print:hidden sticky top-0 z-50 bg-[#F0F3F6]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b-2 border-white/80 dark:border-white/5 shadow-md px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Student Identity */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[200px] sm:max-w-xs">
                  {data.studentName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full clay-badge-gold text-[#1E293B]">
                  {data.className}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Rapor Resmi unlupa.id
              </p>
            </div>
          </div>

          {/* Action Buttons: PDF, Image, Print, WhatsApp, Copy */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-end sm:self-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center clay-inset p-1 rounded-full text-xs font-black mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'report'
                    ? 'clay-pill text-[#FA522A] dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                📄 Rapor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'certificate'
                    ? 'clay-pill text-[#FA522A] dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                🏅 Kartu Prestasi
              </button>
            </div>

            {/* Direct Download as PDF */}
            <button
              type="button"
              disabled={isExportingPdf || isExportingImage}
              onClick={() => handleDownloadPdf(activeTab)}
              className="px-3 py-1.5 rounded-full clay-btn-gold text-white hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Unduh langsung file Dokumen PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PDF</span>
            </button>

            {/* Download as Image PNG */}
            <button
              type="button"
              disabled={isExportingPdf || isExportingImage}
              onClick={() => handleDownloadImage(activeTab)}
              className="px-3 py-1.5 rounded-full clay-pill text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Unduh sebagai Gambar PNG resolusi tinggi"
            >
              {isExportingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-[#FA522A]" />
              )}
              <span>Gambar</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-full clay-pill text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Cetak Fisik / Jendela Cetak Browser"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Share to WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 rounded-full clay-pill text-emerald-700 dark:text-emerald-400 hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-full clay-pill text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Salin Tautan Rapor"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {exportMessage && (
          <div className="max-w-4xl mx-auto mt-2 text-center text-xs font-bold text-orange-800 dark:text-orange-300 animate-in fade-in py-1 px-3 bg-orange-100/80 dark:bg-orange-950/60 rounded-xl border border-orange-300 dark:border-orange-800">
            {exportMessage}
          </div>
        )}
      </nav>

      {/* 2. MAIN REPORT CANVAS */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-5 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* Parent Guidance Callout (Hidden in print) */}
        <div className="print:hidden clay-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent border border-orange-500/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                Ekspor & Unduh Rapor Mandiri
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Anda dapat mengunduh dokumen resmi ini dalam bentuk <strong>File PDF</strong>, <strong>Gambar (PNG)</strong>, atau mencetaknya secara bebas langsung dari ponsel atau laptop.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={() => handleDownloadPdf(activeTab)}
              className="px-3.5 py-2 rounded-xl clay-btn-gold text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-102 active:scale-95 transition-all"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Unduh PDF</span>
            </button>
            <button
              type="button"
              disabled={isExportingImage}
              onClick={() => handleDownloadImage(activeTab)}
              className="px-3.5 py-2 rounded-xl clay-pill text-slate-800 dark:text-slate-200 font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-102 active:scale-95 transition-all"
            >
              {isExportingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 text-[#FA522A]" />}
              <span>Gambar PNG</span>
            </button>
          </div>
        </div>

        {/* VIEW A: RAPOR EVALUASI LENGKAP (EXPLICIT 2-PAGE LAYOUT) */}
        {activeTab === 'report' && (
          <div 
            ref={reportCardRef}
            id="printable-student-report"
            className="space-y-8"
            style={{ color: '#18234A' }}
          >
            {/* PAGE 1: Header, Identity, Metrics, Recommendation, Teacher Note */}
            <div 
              className="p-6 sm:p-10 space-y-6 bg-white border-2 border-slate-300 shadow-2xl rounded-3xl flex flex-col justify-between"
              style={{ pageBreakAfter: 'always', breakAfter: 'page', minHeight: '277mm' }}
            >
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl sm:text-2xl font-black font-serif tracking-tight" style={{ color: '#18234A' }}>
                          unlupa<span className="text-orange-600">.id</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Rapor Resmi
                        </span>
                      </div>
                      <h1 className="text-base sm:text-lg font-black mt-0.5" style={{ color: '#18234A' }}>
                        Laporan Capaian Hafalan & Retensi Santri
                      </h1>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5 shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                      Tanggal Terbit
                    </span>
                    <span className="text-xs sm:text-sm font-black" style={{ color: '#18234A' }}>
                      {printDate}
                    </span>
                  </div>
                </div>

                {/* Student & Class Identity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                      Identitas Santri
                    </span>
                    <div className="text-lg sm:text-xl font-black" style={{ color: '#18234A' }}>
                      {data.studentName}
                    </div>
                    <div className="text-xs font-medium flex items-center gap-2" style={{ color: '#18234A' }}>
                      <span className="font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-md text-slate-800">
                        ID: {data.studentId}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                      Kelas / Halaqah
                    </span>
                    <div className="text-lg sm:text-xl font-black" style={{ color: '#18234A' }}>
                      {data.className}
                    </div>
                    <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#18234A' }}>
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <span>Pengampu: Ust. {data.teacherName}</span>
                    </div>
                  </div>
                </div>

                {/* 4 Core Quantitative Retention Metrics */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#18234A' }}>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span>Ringkasan Ketahanan Memori & Kualitas Hafalan</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Metric 1: Total Active */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          Hafalan Aktif
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <BookOpen className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="text-2xl font-black" style={{ color: '#18234A' }}>
                        {data.totalActive}
                        <span className="text-xs font-normal text-slate-600 ml-1">
                          {data.classType === 'quran' ? 'halaman' : 'materi'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Terjadwal berkala
                      </div>
                    </div>

                    {/* Metric 2: Mastered (Mutqin) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">
                          Mutqin (Mapan)
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-emerald-800">
                        {data.totalMastered}
                        <span className="text-xs font-normal text-emerald-700 ml-1">
                          ({Math.round((data.totalMastered / Math.max(1, data.totalActive)) * 100)}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        Interval panjang (&gt;30 hari)
                      </div>
                    </div>

                    {/* Metric 3: Retention Rate */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-orange-800 uppercase">
                          Ketepatan Waktu
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                          <Flame className="w-3 h-3 fill-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-orange-700">
                        {data.retentionRate}%
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Tingkat kedisiplinan
                      </div>
                    </div>

                    {/* Metric 4: Total Reviews */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          Total Setoran
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="text-2xl font-black" style={{ color: '#18234A' }}>
                        {data.totalReviews || data.totalActive * 4}
                        <span className="text-xs font-normal text-slate-600 ml-1">kali</span>
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Akumulasi murajaah
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualitative Evaluation & Readiness Recommendation */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#18234A' }}>
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Rekomendasi Kemajuan & Status Kesiapan</span>
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                      {data.awardTitle || 'Hafidz Berprestasi'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
                    <h4 className="font-extrabold text-sm mb-1 text-orange-950">
                      {data.readinessTitle || 'Kesiapan Tambah Materi Baru'}
                    </h4>
                    <p className="text-xs leading-relaxed font-medium text-slate-700">
                      {data.readinessDesc || 'Hafalan yang ada telah terjaga dengan baik. Santri direkomendasikan untuk menambah halaman baru secara bertahap.'}
                    </p>
                  </div>
                </div>

                {/* Teacher's Personal Note */}
                {data.teacherNote && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#18234A' }}>
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                      <span>Catatan Khusus dari Ustadz / Pengajar</span>
                    </span>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                      <p className="text-xs sm:text-sm font-serif italic leading-relaxed" style={{ color: '#18234A' }}>
                        "{data.teacherNote}"
                      </p>
                      <span className="text-[10px] font-bold text-slate-600 block mt-2">
                        — Ust. {data.teacherName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t border-slate-200 mt-6">
                Halaman 1 dari 2 — unlupa.id Learning Center Report
              </div>
            </div>

            {/* PAGE 2: Breakdown per Juz & Signature Block */}
            <div 
              className="p-6 sm:p-10 space-y-6 bg-white border-2 border-slate-300 shadow-2xl rounded-3xl flex flex-col justify-between"
              style={{ pageBreakBefore: 'always', breakBefore: 'page', minHeight: '277mm' }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Rincian Capaian & Evaluasi Lanjutan
                  </span>
                  <span className="text-xs font-black" style={{ color: '#18234A' }}>
                    {data.studentName} ({data.className})
                  </span>
                </div>

                {/* Breakdown per Juz (if Quran) */}
                {data.classType === 'quran' && data.juzBreakdown && data.juzBreakdown.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#18234A' }}>
                      <BookOpen className="w-4 h-4 text-orange-600" />
                      <span>Rincian Capaian per Juz (Juz 1 s.d. 30)</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {data.juzBreakdown.map(juz => (
                        <div key={juz.juzNumber} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs" style={{ color: '#18234A' }}>
                              Juz {juz.juzNumber}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              {juz.activeCount} Hal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-700 mt-2">
                            <span>Mutqin: <strong className="text-emerald-700">{juz.masteredCount}</strong></span>
                            <span>Perlu Review: <strong className="text-orange-600">{juz.dueCount}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Signature & Verification Block */}
              <div className="space-y-6">
                <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-600 block">
                      Diverifikasi secara digital oleh sistem kurikulum unlupa.id
                    </span>
                    <span className="text-xs font-mono font-black" style={{ color: '#18234A' }}>
                      KODE VERIFIKASI: {data.reportId || `REP-${Date.now().toString(36).toUpperCase()}`}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-600 block">
                      Pengajar Halaqah
                    </span>
                    <div className="text-sm font-black font-serif mt-4" style={{ color: '#18234A' }}>
                      Ust. {data.teacherName}
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t border-slate-200">
                  Halaman 2 dari 2 — unlupa.id Learning Center Report
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW B: KARTU PRESTASI SANTRI (ELEGANT LUXURY HONOR CARD) */}
        {activeTab === 'certificate' && (
          <div 
            ref={certificateCardRef}
            id="printable-achievement-card"
            className="clay-card p-6 sm:p-10 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#1E293B] dark:to-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] border-4 border-amber-400/50 shadow-2xl rounded-3xl relative overflow-hidden"
          >
            {/* Elegant Outer Border Trim */}
            <div className="absolute inset-2 sm:inset-3 border-2 border-amber-500/30 dark:border-amber-400/20 rounded-2xl pointer-events-none" />
            <div className="absolute inset-3 sm:inset-4 border border-dashed border-amber-500/30 pointer-events-none" />

            <div className="relative z-10 text-center space-y-4 sm:space-y-6">
              
              {/* Emblem Medallion */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl clay-icon-pod-gold flex items-center justify-center shadow-lg border-2 border-white/80">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/20" />
              </div>

              {/* Title & Badge */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full clay-badge-gold text-xs font-black uppercase tracking-widest text-[#1E293B]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>PIAGAM PENGHARGAAN SANTRI</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black font-serif text-[#0F172A] dark:text-[#F8FAFC] tracking-tight clay-title">
                  {data.awardTitle || 'Hafidz Istiqomah Berprestasi'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {data.awardDescription || 'Diberikan atas ketekunan, kedisiplinan murajaah, dan ketahanan memori hafalan yang sangat memuaskan.'}
                </p>
              </div>

              {/* Recipient Student Name */}
              <div className="py-2 sm:py-3 border-y-2 border-amber-400/40 max-w-md mx-auto">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Dianugerahkan Kepada:
                </span>
                <h1 className="text-2xl sm:text-4xl font-black font-serif text-[#FA522A] dark:text-[#FB923C] drop-shadow-sm tracking-wide">
                  {data.studentName}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                  ID: {data.studentId} • Kelas: {data.className}
                </span>
              </div>

              {/* Achievement Highlights */}
              <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto pt-1">
                <div className="clay-card-subtle p-2.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    Hafalan Aktif
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#0F172A] dark:text-[#F8FAFC] clay-title">
                    {data.totalActive}
                  </span>
                </div>
                <div className="clay-card-subtle p-2.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    Mutqin
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 clay-title">
                    {data.totalMastered}
                  </span>
                </div>
                <div className="clay-card-subtle p-2.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 uppercase block">
                    Retensi
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#FA522A] dark:text-[#FB923C] clay-title">
                    {data.retentionRate}%
                  </span>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="pt-6 flex items-center justify-between text-left max-w-lg mx-auto text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                    Tanggal Terbit:
                  </span>
                  <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {printDate}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                    Pengajar / Musyrif:
                  </span>
                  <span className="font-black font-serif text-[#0F172A] dark:text-[#F8FAFC]">
                    Ust. {data.teacherName}
                  </span>
                </div>
              </div>

              {/* Watermark Branding */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider pt-2">
                DITERBITKAN OLEH UNLUPA.ID — SISTEM MURAJAAH BERKALA & RETENSI MEMORI
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
};
