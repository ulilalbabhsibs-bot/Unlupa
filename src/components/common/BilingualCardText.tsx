import React, { useMemo } from 'react';
import { detectScript, ScriptType } from '../../utils/bilingualHelper';

export interface BilingualCardTextProps {
  text: string;
  type?: 'question' | 'answer' | 'general';
  variant?: 'card-list' | 'detail-modal' | 'review' | 'compact';
  className?: string;
  emptyFallback?: string;
}

interface TextBlock {
  id: string;
  text: string;
  script: ScriptType;
  isArabic: boolean;
  isTranslationTransition?: boolean;
}

/**
 * Isolates embedded Arabic snippets inside a Latin/Indonesian paragraph
 * so that quotes, colons, brackets, and sentences never reverse.
 */
export function renderBilingualInline(text: string): React.ReactNode {
  if (!text) return null;
  const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s،؛؟]{2,})/g;
  const parts = text.split(arabicRegex);
  if (parts.length <= 1) return text;
  
  return parts.map((part, i) => {
    if (i % 2 === 1 && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(part)) {
      return (
        <bdi 
          key={i} 
          dir="rtl" 
          className="font-arabic font-normal inline-block text-[1.18em] px-0.5 leading-normal text-amber-900 dark:text-amber-200"
        >
          {part}
        </bdi>
      );
    }
    return part;
  });
}

/**
 * Parses raw text into semantic blocks while preserving paragraphs,
 * detecting Arabic vs. Latin, and avoiding repetitive translation tags.
 */
function parseTextBlocks(rawText: string, isGeneral: boolean): TextBlock[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Split into paragraphs (respecting double newlines or single newlines)
  const paragraphs = rawText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);

  // If there are no double newlines, fallback to line-by-line
  const units = paragraphs.length > 1 
    ? paragraphs 
    : rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let hasSeenArabic = false;
  let hasShownTranslationBadge = false;

  return units.map((unit, idx) => {
    const hasArabicLetters = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(unit);
    const hasLatinLetters = /[a-zA-Z]/.test(unit);

    // CRITICAL: A block is ONLY pure Arabic (RTL) if it has NO Latin letters.
    // If it contains Indonesian or Latin words, its framing direction MUST be LTR.
    const isArabic = hasArabicLetters && !hasLatinLetters;
    const script: ScriptType = isArabic ? 'arabic' : 'latin';

    let isTranslationTransition = false;

    if (isArabic) {
      hasSeenArabic = true;
    } else if (!isGeneral && hasSeenArabic && !hasShownTranslationBadge) {
      // First Latin block after an Arabic block gets marked as transition
      isTranslationTransition = true;
      hasShownTranslationBadge = true;
    }

    return {
      id: `block-${idx}`,
      text: unit,
      script,
      isArabic,
      isTranslationTransition
    };
  });
}

export const BilingualCardText: React.FC<BilingualCardTextProps> = ({
  text,
  type = 'general',
  variant = 'card-list',
  className = '',
  emptyFallback
}) => {
  const isGeneral = type === 'general';
  const blocks = useMemo(() => parseTextBlocks(text, isGeneral), [text, isGeneral]);

  if (!text || blocks.length === 0) {
    if (emptyFallback) {
      return (
        <span className={`text-slate-400 dark:text-slate-500 italic text-xs ${className}`}>
          {emptyFallback}
        </span>
      );
    }
    return null;
  }

  // 1. GENERAL TYPE (Used for Explanations, Articles, Long Syarah, Notes)
  // Pure, clean, editorial typography with NO badges or repetitive labels!
  if (isGeneral) {
    return (
      <div className={`w-full space-y-3.5 select-text ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className="text-right font-arabic leading-loose tracking-wide text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 bg-amber-50/60 dark:bg-amber-950/20 border-r-4 border-amber-500/80 dark:border-amber-500/60 px-4 py-3 rounded-xl my-2 shadow-2xs"
              >
                {block.text}
              </div>
            );
          }

          // Latin paragraph / commentary
          return (
            <div
              key={block.id}
              dir="ltr"
              className="text-left text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-normal whitespace-pre-line"
            >
              {renderBilingualInline(block.text)}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. DETAIL MODAL VARIANT (Card Preview Modal)
  if (variant === 'detail-modal') {
    const isAnswer = type === 'answer';

    return (
      <div className={`w-full space-y-3 select-text ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className={`text-right font-arabic leading-loose tracking-wide ${
                  isAnswer
                    ? 'text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'
                    : 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white'
                }`}
              >
                {block.text}
              </div>
            );
          }

          // Latin section
          return (
            <div key={block.id} className="space-y-1.5">
              {block.isTranslationTransition && (
                <div className="pt-2 pb-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isAnswer
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isAnswer ? 'Terjemahan / Penjelasan' : 'Terjemahan'}
                  </span>
                </div>
              )}
              <div
                dir="ltr"
                className={`text-left leading-relaxed whitespace-pre-line ${
                  isAnswer
                    ? 'text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200'
                    : 'text-sm sm:text-base font-normal text-slate-700 dark:text-slate-300'
                }`}
              >
                {renderBilingualInline(block.text)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. REVIEW VARIANT (Active Flashcard Study & Flipping)
  if (variant === 'review') {
    const isAnswer = type === 'answer';

    return (
      <div className={`w-full space-y-3.5 select-text ${className}`}>
        {blocks.map((block) => {
          if (block.isArabic) {
            return (
              <div
                key={block.id}
                dir="rtl"
                className={`text-right font-arabic leading-loose tracking-wide ${
                  isAnswer
                    ? 'text-lg sm:text-2xl font-bold text-slate-900 dark:text-white'
                    : 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white'
                }`}
              >
                {block.text}
              </div>
            );
          }

          return (
            <div key={block.id} className="space-y-1.5">
              {block.isTranslationTransition && (
                <div className="pt-2 pb-1 border-t border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAnswer ? 'Terjemahan / Arti' : 'Terjemahan'}
                  </span>
                </div>
              )}
              <div
                dir="ltr"
                className="text-left text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line"
              >
                {renderBilingualInline(block.text)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. COMPACT VARIANT (Tables, mini rows)
  if (variant === 'compact') {
    return (
      <div className={`space-y-1 w-full text-xs ${className}`}>
        {blocks.map((block) => (
          <div
            key={block.id}
            dir={block.isArabic ? 'rtl' : 'ltr'}
            className={`${
              block.isArabic
                ? 'text-right font-arabic font-semibold text-slate-900 dark:text-white text-[13px] leading-relaxed'
                : 'text-left font-normal text-slate-600 dark:text-slate-300 text-xs leading-normal whitespace-pre-line'
            }`}
          >
            {block.isArabic ? block.text : renderBilingualInline(block.text)}
          </div>
        ))}
      </div>
    );
  }

  // 5. DEFAULT / CARD-LIST VARIANT (Book Space Row Items - Max 3 lines limit)
  return (
    <div className={`w-full select-text line-clamp-3 overflow-hidden text-ellipsis leading-snug sm:leading-relaxed ${className}`}>
      {blocks.map((block) => {
        if (block.isArabic) {
          return (
            <div
              key={block.id}
              dir="rtl"
              className="text-right font-arabic text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white inline-block w-full mb-0.5"
            >
              {block.text}
            </div>
          );
        }

        return (
          <div
            key={block.id}
            dir="ltr"
            className="text-left text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 inline-block w-full"
          >
            {renderBilingualInline(block.text)}
          </div>
        );
      })}
    </div>
  );
};
