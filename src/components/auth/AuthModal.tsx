import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import { 
  loginWithGoogle, 
  syncUserProfileToFirestore 
} from '../../lib/firebase';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode }) => {
  const { setUserProfile, language } = useApp();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      await syncUserProfileToFirestore(user);

      setUserProfile(prev => ({
        ...prev,
        id: user.uid,
        email: user.email || prev.email,
        fullName: user.displayName || user.email?.split('@')[0] || prev.fullName,
        avatarUrl: user.photoURL || prev.avatarUrl,
      }));

      setSuccessMsg(language === 'en' ? 'Logged in successfully with Google!' : 'Berhasil masuk dengan akun Google!');
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);

    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(language === 'en' ? 'Sign-in cancelled. Please try again.' : 'Proses login dibatalkan. Silakan coba lagi.');
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMsg(language === 'en' ? 'Network error. Please check your connection.' : 'Koneksi bermasalah. Periksa jaringan internet Anda.');
      } else {
        setErrorMsg(err?.message || (language === 'en' ? 'Failed to sign in with Google.' : 'Gagal masuk dengan akun Google.'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Decorative Header */}
        <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 flex flex-col justify-end p-5 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-white">
            <Sparkles className="w-24 h-24 -translate-y-6 translate-x-6" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white relative z-10">
            {language === 'en' ? 'Welcome to Unlupa' : 'Masuk ke Unlupa'}
          </h2>
        </div>

        <div className="p-5 sm:p-6 sm:px-8 space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {language === 'en' 
              ? 'Sign in to sync your memory retention progress securely across all devices.' 
              : 'Masuk dengan akun Google Anda agar progres hafalan Anda tidak hilang dan tersinkronisasi.'}
          </p>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGoogleLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>{language === 'en' ? 'Continue with Google' : 'Masuk dengan Akun Google'}</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              {language === 'en'
                ? 'By continuing, you agree to our Terms of Service and Privacy Policy.'
                : 'Dengan mendaftar atau masuk, Anda menyetujui Syarat dan Ketentuan layanan kami.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
