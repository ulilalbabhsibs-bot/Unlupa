import React, { useState, useEffect, useRef } from 'react';
import { Book, Language } from '../../types';
import { Image as ImageIcon, X, UploadCloud, Tag, PenTool, BookOpen, Sparkles } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; coverUrl?: string; isPublic: boolean; category: string }) => void;
  initialData?: Partial<Book>;
  language: Language;
}

export const PREDEFINED_CATEGORIES = [
  { id: 'Agama & Keislaman', en: 'Religion & Islamic Studies' },
  { id: 'Bahasa & Linguistik', en: 'Language & Linguistics' },
  { id: 'Sains & Matematika', en: 'Science & Mathematics' },
  { id: 'Teknologi & Pemrograman', en: 'Technology & Programming' },
  { id: 'Kedokteran & Kesehatan', en: 'Medicine & Health' },
  { id: 'Bisnis & Finansial', en: 'Business & Finance' },
  { id: 'Sejarah & Peradaban', en: 'History & Civilization' },
  { id: 'Hukum & Sosial-Politik', en: 'Law & Social Sciences' },
  { id: 'Filsafat & Logika', en: 'Philosophy & Logic' },
  { id: 'Seni, Desain & Arsitektur', en: 'Art & Design' },
  { id: 'Sastra & Fiksi', en: 'Literature & Fiction' },
  { id: 'Psikologi & Pengembangan Diri', en: 'Psychology & Self-Help' },
  { id: 'Pendidikan & Pembelajaran', en: 'Education & Learning' },
  { id: 'Hobi & Keterampilan', en: 'Hobbies & Skills' },
  { id: 'Umum & Referensi', en: 'General Knowledge' },
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen, onClose, onSubmit, initialData, language
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    isPublic: false,
  });
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        coverUrl: initialData?.coverUrl || '',
        isPublic: initialData?.isPublic || false,
      });

      const initialCat = initialData?.category || '';
      if (!initialCat) {
        setSelectedCategoryType('');
        setCustomCategory('');
      } else {
        const found = PREDEFINED_CATEGORIES.find(c => c.id === initialCat || c.en === initialCat);
        if (found) {
          setSelectedCategoryType(language === 'en' ? found.en : found.id);
          setCustomCategory('');
        } else {
          setSelectedCategoryType('__CUSTOM__');
          setCustomCategory(initialCat);
        }
      }
    }
  }, [isOpen, initialData, language]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    let resolvedCategory = selectedCategoryType;
    if (selectedCategoryType === '__CUSTOM__') {
      resolvedCategory = customCategory.trim() || (language === 'en' ? 'Custom' : 'Lainnya');
    } else if (!resolvedCategory) {
      resolvedCategory = language === 'en' ? 'General' : 'Umum';
    }

    onSubmit({
      title: form.title,
      description: form.description,
      coverUrl: form.coverUrl || undefined,
      isPublic: form.isPublic,
      category: resolvedCategory,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImage(file);
      setForm(prev => ({ ...prev, coverUrl: compressedUrl }));
    } catch (err) {
      console.error('Image compression failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-modal w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] tracking-tight">
                {initialData ? (language === 'en' ? 'Edit Book' : 'Edit Buku / Kitab') : (language === 'en' ? 'Create New Book' : 'Buat Buku / Kitab Baru')}
              </h3>
              <p className="text-xs text-[#5E6D88] dark:text-[#94A3B8]">
                {language === 'en' ? 'Manage book details and category' : 'Atur rincian buku dan kategori materi'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5">
                {language === 'en' ? 'Book Title *' : 'Judul Buku *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'e.g. Arabic Vocabulary' : 'mis. Kosakata Bahasa Arab, Nahwu Dasar'}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full h-11 px-3.5 rounded-2xl clay-inset text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5">
                {language === 'en' ? 'Category *' : 'Pilihan Kategori *'}
              </label>
              <select
                value={selectedCategoryType}
                onChange={e => setSelectedCategoryType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl clay-inset text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all cursor-pointer"
              >
                <option value="">-- {language === 'en' ? 'Select Category' : 'Pilih Kategori'} --</option>
                <optgroup label={language === 'en' ? 'Standard Categories' : 'Kategori Bidang Ilmu'}>
                  {PREDEFINED_CATEGORIES.map(c => {
                    const label = language === 'en' ? c.en : c.id;
                    return (
                      <option key={c.id} value={label}>{label}</option>
                    );
                  })}
                </optgroup>
                <optgroup label={language === 'en' ? 'Custom Category' : 'Kategori Mandiri'}>
                  <option value="__CUSTOM__">
                    {language === 'en' ? '✍️ Other (Enter Custom Category)' : '✍️ Lainnya (Tulis Kategori Sendiri)'}
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Kolom Tulis Kategori Sendiri Ketika Opsi "Lainnya" Dipilih */}
            {selectedCategoryType === '__CUSTOM__' && (
              <div className="p-3.5 rounded-2xl clay-inset space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6F3D]">
                  <PenTool className="w-3.5 h-3.5 text-[#FF6F3D]" />
                  <span>{language === 'en' ? 'Specify Custom Category' : 'Isi Kategori Kustom Anda'}</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Astronomy, Cryptography, Robotics...' : 'mis. Astronomi, Kriptografi, Robotika, Farmasi...'}
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#121927] border border-black/[0.06] dark:border-white/[0.06] text-xs font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
                />
                <p className="text-[11px] text-[#5E6D88] dark:text-[#94A3B8] leading-relaxed">
                  {language === 'en' 
                    ? 'Enter a specific custom category name to organize your books according to your field of study.'
                    : 'Tuliskan nama kategori sendiri untuk mengelompokkan buku-buku Anda secara spesifik sesuai kebutuhan.'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5">
                {language === 'en' ? 'Description (Optional)' : 'Deskripsi (Opsional)'}
              </label>
              <textarea
                rows={2}
                placeholder={language === 'en' ? 'What is this book about?' : 'Tentang apa buku ini?'}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 rounded-2xl clay-inset text-sm font-semibold text-[#18234A] dark:text-[#F8FAFC] placeholder:text-[#8493AB] focus:outline-none focus:ring-2 focus:ring-[#FF6F3D]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] mb-1.5">
                {language === 'en' ? 'Cover Image' : 'Gambar Sampul'}
              </label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl clay-card-subtle text-[#18234A] dark:text-[#F8FAFC] hover:text-[#FF6F3D] text-xs font-bold transition-all w-full justify-center cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-4 h-4 text-[#FF6F3D]" />
                  <span>{language === 'en' ? 'Upload Cover Image' : 'Unggah Gambar Sampul'}</span>
                </button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
              {form.coverUrl && (
                <div className="mt-3 relative w-28 h-36 mx-auto rounded-2xl overflow-hidden shadow-md group border border-white/60 dark:border-white/10">
                  <img src={form.coverUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setForm({...form, coverUrl: ''})} 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-black/[0.04] dark:border-white/[0.04]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl clay-card-subtle text-xs font-bold text-[#5E6D88] hover:text-[#18234A] dark:hover:text-[#F8FAFC] cursor-pointer transition-all"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                disabled={!form.title.trim() || (selectedCategoryType === '__CUSTOM__' && !customCategory.trim())}
                className="px-5 py-2.5 rounded-2xl clay-btn-primary text-xs font-bold text-white disabled:opacity-50 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                {language === 'en' ? 'Save Book' : 'Simpan Buku'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
