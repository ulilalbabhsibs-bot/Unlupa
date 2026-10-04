/**
 * Quick Card Parser & External AI Prompt Generator
 * 
 * Memungkinkan pemrosesan flashcard instan 100% di sisi klien (tanpa biaya API, tanpa kuota, tanpa latensi),
 * serta menyediakan template prompt siap pakai untuk dieksekusi di ChatGPT / Claude / Gemini / DeepSeek eksternal.
 */

export interface ParsedCard {
  question: string;
  answer: string;
}

export interface ParsedChapter {
  title: string;
  description?: string;
  cards: ParsedCard[];
}

export interface ParsedBook {
  title: string;
  description: string;
  chapters: ParsedChapter[];
}

/**
 * Membersihkan spasi berlebih pada awal/akhir baris namun mempertahankan enter dwibahasa
 */
function cleanText(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter((line, i, arr) => {
      // Hapus baris kosong di paling awal atau paling akhir
      if (line === '' && (i === 0 || i === arr.length - 1)) return false;
      return true;
    })
    .join('\n')
    .trim();
}

/**
 * Mem-parsing string Q&A menjadi array kartu { question, answer }
 * Mendukung berbagai format populer:
 * 1. Tag T: / J: (Tanya / Jawab, Q: / A:, P: / J:, Soal: / Jawab:)
 * 2. Delimiter baris tunggal (pipa |, tab \t, ::, ///, strip ganda --)
 * 3. JSON Array format [{question, answer}]
 */
export function parseCardsFromText(rawText: string): ParsedCard[] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();

  // 1. Coba JSON parser jika formatnya berupa JSON array
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.items || []);
      if (Array.isArray(list) && list.length > 0) {
        const validCards = list.map((item: any) => {
          const q = item.question || item.q || item.tanya || item.t || item.front || item.soal || '';
          const a = item.answer || item.a || item.jawab || item.j || item.back || item.jawaban || '';
          if (q.trim() && a.trim()) {
            return { question: cleanText(q), answer: cleanText(a) };
          }
          return null;
        }).filter(Boolean) as ParsedCard[];

        if (validCards.length > 0) return validCards;
      }
    } catch {
      // bukan JSON murni, lanjut ke text parsing
    }
  }

  // Regex pola penanda Pertanyaan
  // Mendukung: T:, Q:, P:, Tanya:, Pertanyaan:, Soal:, 1. T:, 1) Q:, dsb.
  const questionPattern = /^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:[TtQqPp]|Tanya|Pertanyaan|Question|Soal)\s*[:：]\s*(.*)$/i;
  // Regex pola penanda Jawaban
  // Mendukung: J:, A:, Ans:, Jawab:, Jawaban:, Answer:, 1. J:, 1) A:, dsb.
  const answerPattern = /^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:[JjAa]|Ans|Jawab|Jawaban|Answer)\s*[:：]\s*(.*)$/i;

  const lines = text.split('\n');
  const cards: ParsedCard[] = [];

  let currentQuestionLines: string[] = [];
  let currentAnswerLines: string[] = [];
  let state: 'idle' | 'in_question' | 'in_answer' = 'idle';

  const flushCard = () => {
    const q = cleanText(currentQuestionLines.join('\n'));
    const a = cleanText(currentAnswerLines.join('\n'));
    if (q && a) {
      cards.push({ question: q, answer: a });
    }
    currentQuestionLines = [];
    currentAnswerLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Lewati baris divider markdown atau header bab
    if (trimmedLine.startsWith('---') || trimmedLine.startsWith('===') || trimmedLine.startsWith('#')) {
      if (state === 'in_answer') {
        flushCard();
        state = 'idle';
      }
      continue;
    }

    const qMatch = trimmedLine.match(questionPattern);
    const aMatch = trimmedLine.match(answerPattern);

    if (qMatch) {
      // Jika sebelumnya sudah ada tanya dan jawab, simpan kartu lama
      if (state === 'in_answer' || state === 'in_question') {
        flushCard();
      }
      state = 'in_question';
      currentQuestionLines = [qMatch[1]];
    } else if (aMatch && state === 'in_question') {
      state = 'in_answer';
      currentAnswerLines = [aMatch[1]];
    } else if (state === 'in_question') {
      // Baris lanjutan dari pertanyaan (misal teks Arab atau baris kedua)
      currentQuestionLines.push(line);
    } else if (state === 'in_answer') {
      // Baris lanjutan dari jawaban
      currentAnswerLines.push(line);
    }
  }

  // Flush kartu terakhir jika ada
  flushCard();

  if (cards.length > 0) {
    return cards;
  }

  // 2. Fallback: Cek Delimiter berbasis baris (Tab, Pipe |, ::, ///)
  for (const line of lines) {
    const tr = line.trim();
    if (!tr || tr.startsWith('#') || tr.startsWith('---')) continue;

    // Cek tab (TSV export dari Spreadsheet / Anki)
    if (tr.includes('\t')) {
      const parts = tr.split('\t');
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({ question: cleanText(parts[0]), answer: cleanText(parts.slice(1).join(' ')) });
        continue;
      }
    }

    // Cek Pipe delimiter (|) misal tabel markdown atau flashcard sederhana
    if (tr.includes('|')) {
      // Abaikan baris format header tabel seperti |---|---|
      if (/^\|?[\s\-:]+\|[\s\-:]+\|?$/.test(tr)) continue;
      const parts = tr.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        cards.push({ question: cleanText(parts[0]), answer: cleanText(parts.slice(1).join(' | ')) });
        continue;
      }
    }

    // Cek delimiter :: atau ///
    if (tr.includes('::')) {
      const parts = tr.split('::');
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({ question: cleanText(parts[0]), answer: cleanText(parts.slice(1).join('::')) });
        continue;
      }
    }

    if (tr.includes('///')) {
      const parts = tr.split('///');
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({ question: cleanText(parts[0]), answer: cleanText(parts.slice(1).join('///')) });
        continue;
      }
    }
  }

  return cards;
}

/**
 * Mem-parsing teks struktur buku yang berisi beberapa Bab dan Q&A di bawah tiap bab
 */
export function parseBookFromText(rawText: string, fallbackTitle = 'Buku Baru'): ParsedBook {
  if (!rawText || !rawText.trim()) {
    return {
      title: fallbackTitle,
      description: '',
      chapters: [{ title: 'Bab 1: Materi Utama', cards: [] }]
    };
  }

  const lines = rawText.split('\n');
  let title = '';
  let description = '';

  const chapterBlocks: { title: string; lines: string[] }[] = [];
  let currentChapterTitle = '';
  let currentChapterLines: string[] = [];

  // Regex mendeteksi header bab
  const chapterHeaderRegex = /^(?:#{1,3}\s*|Bab\s+\d+\s*[:：\-]|BAB\s+[IVXLCDM]+\s*[:：\-]|Chapter\s+\d+\s*[:：\-]|Bagian\s+\d+\s*[:：\-])\s*(.*)$/i;
  const titleRegex = /^(?:Judul|Title|Nama Buku)\s*[:：]\s*(.*)$/i;
  const descRegex = /^(?:Deskripsi|Description|Keterangan)\s*[:：]\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Deteksi judul buku di awal dokumen
    if (!title && trimmed) {
      const tMatch = trimmed.match(titleRegex);
      if (tMatch && tMatch[1].trim()) {
        title = tMatch[1].trim();
        continue;
      }
      if (trimmed.startsWith('# ') && !trimmed.toLowerCase().includes('bab')) {
        title = trimmed.replace(/^#\s+/, '').trim();
        continue;
      }
    }

    // Deteksi deskripsi
    if (!description && trimmed) {
      const dMatch = trimmed.match(descRegex);
      if (dMatch && dMatch[1].trim()) {
        description = dMatch[1].trim();
        continue;
      }
    }

    // Deteksi Bab
    const isChapHeader = chapterHeaderRegex.test(trimmed) && !trimmed.toLowerCase().startsWith('t:') && !trimmed.toLowerCase().startsWith('j:');
    if (isChapHeader) {
      // Simpan bab sebelumnya jika ada
      if (currentChapterLines.length > 0 || currentChapterTitle) {
        chapterBlocks.push({
          title: currentChapterTitle || 'Bab 1: Materi Utama',
          lines: currentChapterLines
        });
      }
      // Mulai bab baru
      const rawTitle = trimmed.replace(/^#{1,3}\s*/, '').trim();
      currentChapterTitle = rawTitle || `Bab ${chapterBlocks.length + 1}`;
      currentChapterLines = [];
      continue;
    }

    currentChapterLines.push(line);
  }

  // Simpan bab terakhir
  if (currentChapterLines.length > 0 || currentChapterTitle) {
    chapterBlocks.push({
      title: currentChapterTitle || (chapterBlocks.length === 0 ? 'Bab 1: Materi Utama' : `Bab ${chapterBlocks.length + 1}`),
      lines: currentChapterLines
    });
  }

  // Jika tidak ada bab yang terdeteksi, jadikan seluruh teks sebagai Bab 1
  if (chapterBlocks.length === 0) {
    chapterBlocks.push({
      title: 'Bab 1: Materi Utama',
      lines: lines
    });
  }

  // Parse kartu pada tiap bab
  const chapters: ParsedChapter[] = chapterBlocks.map((block, idx) => {
    const blockText = block.lines.join('\n');
    const cards = parseCardsFromText(blockText);
    return {
      title: block.title || `Bab ${idx + 1}`,
      cards
    };
  }).filter(ch => ch.cards.length > 0 || chapterBlocks.length === 1);

  // Jika semua bab kosong tapi ada teks global
  if (chapters.length === 0 || chapters.every(c => c.cards.length === 0)) {
    const allCards = parseCardsFromText(rawText);
    return {
      title: title || fallbackTitle,
      description: description || '',
      chapters: [
        {
          title: 'Bab 1: Materi Utama',
          cards: allCards
        }
      ]
    };
  }

  return {
    title: title || fallbackTitle,
    description: description || '',
    chapters
  };
}

/**
 * Template Prompt Siap Pakai untuk AI Eksternal (ChatGPT, Claude, Gemini, DeepSeek)
 */
export const EXTERNAL_AI_CARD_PROMPT_TEMPLATE = (topic?: string, material?: string): string => {
  const subject = topic ? `tentang "${topic}"` : material ? `dari materi terlampir` : `dari materi berikut`;
  return `Buatkan daftar flashcard tanya-jawab ${subject} dengan format persis:

T: [Pertanyaan]
J: [Jawaban]

Aturan:
1. Awali dengan "T:" dan "J:".
2. Teks Arab dan terjemahan WAJIB dipisah baris baru (enter), contoh:
T: سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟
Surah An-Naba' termasuk surah apa?
J: مَكِّيَّةٌ
Surah An-Naba' termasuk surah Makkiyah.
3. Langsung keluarkan format T: dan J: tanpa kata pengantar atau penutup.${material ? `\n\nMATERI:\n${material}` : ''}`;
};

export const EXTERNAL_AI_BOOK_PROMPT_TEMPLATE = (topic?: string, material?: string): string => {
  const subject = topic ? `tentang "${topic}"` : material ? `dari materi terlampir` : `dari materi berikut`;
  return `Buatkan materi hafalan berbab ${subject} dengan format persis:

Judul: [Judul Kitab]

# Bab 1: [Nama Bab]
T: [Pertanyaan 1]
J: [Jawaban 1]

# Bab 2: [Nama Bab]
T: [Pertanyaan 2]
J: [Jawaban 2]

Aturan:
1. Awali pertanyaan dengan "T:" dan jawaban dengan "J:".
2. Pisahkan bab dengan "# Bab [Nama Bab]".
3. Teks Arab dan terjemahan WAJIB dipisah baris baru (enter).
4. Langsung format di atas tanpa kata pengantar atau penutup.${material ? `\n\nMATERI:\n${material}` : ''}`;
};

/**
 * Prompt untuk Mengubah Tanya-Jawab yang Sudah Ada di AI Eksternal ke Format Baku Unlupa
 */
export const EXTERNAL_AI_CARD_REFORMAT_PROMPT = (): string => {
  return `Ubah daftar tanya-jawab di atas ke format baku flashcard berikut:

T: [Pertanyaan]
J: [Jawaban]

Aturan:
1. Pertahankan isi dan redaksi asli secara akurat.
2. Awali dengan "T:" dan "J:".
3. Teks Arab dan terjemahan WAJIB dipisah baris baru (enter).
4. Langsung keluarkan daftar T: dan J: tanpa kata pengantar atau penutup.`;
};

/**
 * Prompt untuk Mengubah Materi / Percakapan Tanya-Jawab Menjadi Struktur Buku Berbab di Unlupa
 */
export const EXTERNAL_AI_BOOK_REFORMAT_PROMPT = (): string => {
  return `Kelompokkan dan ubah materi di atas menjadi buku berbab dengan format:

Judul: [Judul Kitab]

# Bab 1: [Nama Bab 1]
T: [Pertanyaan]
J: [Jawaban]

# Bab 2: [Nama Bab 2]
T: [Pertanyaan]
J: [Jawaban]

Aturan:
1. Pisahkan bab dengan "# Bab [Nama Bab]".
2. Awali pertanyaan dengan "T:" dan jawaban dengan "J:".
3. Teks Arab dan terjemahan WAJIB dipisah baris baru (enter).
4. Langsung keluarkan format di atas tanpa kalimat pembuka atau penutup.`;
};
