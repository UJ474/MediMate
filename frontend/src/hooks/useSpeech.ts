import { useCallback, useEffect, useRef, useState } from 'react';

// ---- Voice selection ----
// Browsers ship a different set of voices per OS. Setting only `utterance.lang`
// is not enough: when no voice matches, the engine silently falls back to the
// default (usually English) voice, which mangles Tamil/Telugu/Bengali/etc. text.
// So we explicitly pick a voice for the language, and when the device has none
// we stream native-language audio from a cloud TTS endpoint instead.

const PREFERRED_VOICE_HINTS = /google|natural|neural|premium|enhanced|online/i;

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace('_', '-');
}

function pickVoice(voices: SpeechSynthesisVoice[], speechLang: string): SpeechSynthesisVoice | null {
  const tag = normalizeTag(speechLang);
  const base = tag.split('-')[0];
  const exact = voices.filter((v) => normalizeTag(v.lang) === tag);
  const sameLanguage = voices.filter((v) => normalizeTag(v.lang).split('-')[0] === base);
  const pool = exact.length ? exact : sameLanguage;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => Number(PREFERRED_VOICE_HINTS.test(b.name)) - Number(PREFERRED_VOICE_HINTS.test(a.name)))[0];
}

function useAvailableVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  return voices;
}

// Cloud TTS accepts ~200 characters per request, so long prompts are split at
// sentence/clause boundaries (including the Devanagari danda).
function chunkText(text: string, maxLen = 180): string[] {
  const pieces = text.match(/[^.!?।۔؟,،]+[.!?।۔؟,،]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const raw of pieces) {
    const piece = raw.trim();
    if (!piece) continue;
    if ((current + ' ' + piece).trim().length <= maxLen) {
      current = (current + ' ' + piece).trim();
      continue;
    }
    if (current) chunks.push(current);
    if (piece.length <= maxLen) {
      current = piece;
    } else {
      // A single clause longer than the limit — split on word boundaries.
      current = '';
      for (const word of piece.split(/\s+/)) {
        if ((current + ' ' + word).trim().length > maxLen && current) {
          chunks.push(current);
          current = word;
        } else {
          current = (current + ' ' + word).trim();
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function cloudTtsUrl(chunk: string, speechLang: string, idx: number, total: number): string {
  const tl = speechLang.split('-')[0];
  const params = new URLSearchParams({
    ie: 'UTF-8',
    client: 'tw-ob',
    tl,
    q: chunk,
    idx: String(idx),
    total: String(total),
    textlen: String(chunk.length),
  });
  return `https://translate.google.com/translate_tts?${params.toString()}`;
}

// ---- Sarvam AI (Bulbul v3) ----
// Natural, human-sounding Indic voices. Requests go through the /api/tts proxy
// (see vite.config.ts) so the API key never reaches the browser. Languages
// Bulbul v3 doesn't cover use the browser/cloud path below.
const SARVAM_LANGUAGES = new Set(['bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN']);
const SARVAM_MAX_CHARS = 2000;

// Audio is cached per language+text as a promise, so a clip that is already being
// fetched (e.g. preloaded in the background) is shared rather than requested twice,
// and replaying never re-bills the API.
const sarvamAudioCache = new Map<string, Promise<string[]>>();

async function requestSarvamAudio(text: string, speechLang: string): Promise<string[]> {
  const chunks = text.length > SARVAM_MAX_CHARS ? chunkText(text, SARVAM_MAX_CHARS) : [text];
  const urls = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, languageCode: speechLang }),
      });
      if (!res.ok) throw new Error(`Sarvam TTS failed: ${res.status}`);
      const { audios, mime } = (await res.json()) as { audios: string[]; mime: string };
      if (!audios?.length) throw new Error('Sarvam TTS returned no audio');
      return audios.map((b64) => `data:${mime};base64,${b64}`);
    })
  );
  return urls.flat();
}

function loadSarvamAudio(text: string, speechLang: string): Promise<string[]> {
  const key = `${speechLang}|${text}`;
  let pending = sarvamAudioCache.get(key);
  if (!pending) {
    pending = requestSarvamAudio(text, speechLang);
    // Don't cache failures — a later attempt should be able to retry.
    pending.catch(() => sarvamAudioCache.delete(key));
    sarvamAudioCache.set(key, pending);
  }
  return pending;
}

// Warms the audio cache so prompts play the moment they appear instead of
// waiting on a network round trip. Runs a few requests at a time, in order,
// so the texts the patient will hear first are ready first.
export function preloadSpeech(texts: string[], speechLang: string, concurrency = 3): void {
  if (!SARVAM_LANGUAGES.has(speechLang)) return;
  const queue = [...new Set(texts.filter(Boolean))];
  const worker = async () => {
    for (let text = queue.shift(); text !== undefined; text = queue.shift()) {
      await loadSarvamAudio(text, speechLang).catch(() => undefined);
    }
  };
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) void worker();
}

// Text-to-speech: reads a string aloud in the given BCP-47 language using a
// voice native to that language, with a "read again" affordance via replay().
export function useSpeakText(speechLang: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastTextRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Incremented on every speak/stop so a stale playback sequence stops itself.
  const runIdRef = useRef(0);
  // Set when the proxy is unreachable/unconfigured so we stop retrying it every question.
  const sarvamDisabledRef = useRef(false);
  const voices = useAvailableVoices();

  const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const supported = typeof window !== 'undefined' && (synthSupported || typeof Audio !== 'undefined');

  const haltPlayback = useCallback(() => {
    runIdRef.current += 1;
    if (synthSupported) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, [synthSupported]);

  // Plays a list of audio URLs back to back; stops early if a newer speak/stop happened.
  const playSequence = useCallback((srcs: string[], runId: number, onFail?: () => void) => {
    const fail = () => {
      if (runId !== runIdRef.current) return;
      if (onFail) onFail();
      else setIsSpeaking(false);
    };
    const playChunk = (i: number) => {
      if (runId !== runIdRef.current) return;
      if (i >= srcs.length) {
        setIsSpeaking(false);
        return;
      }
      const audio = new Audio(srcs[i]);
      audioRef.current = audio;
      audio.onended = () => playChunk(i + 1);
      audio.onerror = fail;
      audio.play().catch(fail);
    };
    setIsSpeaking(true);
    playChunk(0);
  }, []);

  const speakWithCloud = useCallback(
    (text: string, runId: number) => {
      const chunks = chunkText(text);
      playSequence(
        chunks.map((chunk, i) => cloudTtsUrl(chunk, speechLang, i, chunks.length)),
        runId
      );
    },
    [speechLang, playSequence]
  );

  const speakWithDevice = useCallback(
    (text: string, runId: number) => {
      const voice = synthSupported ? pickVoice(voices, speechLang) : null;
      if (!voice) {
        speakWithCloud(text, runId);
        return;
      }

      // Chrome cuts off long utterances after ~15s, so queue one utterance per chunk.
      const chunks = chunkText(text, 220);
      chunks.forEach((chunk, i) => {
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.voice = voice;
        utter.lang = voice.lang;
        utter.rate = 0.9;
        if (i === 0) utter.onstart = () => setIsSpeaking(true);
        if (i === chunks.length - 1) utter.onend = () => setIsSpeaking(false);
        utter.onerror = (e) => {
          if (runId !== runIdRef.current || e.error === 'interrupted' || e.error === 'canceled') return;
          // The local voice failed (e.g. an online voice with no network) — retry via cloud audio.
          haltPlayback();
          speakWithCloud(text, runIdRef.current);
        };
        window.speechSynthesis.speak(utter);
      });
    },
    [synthSupported, voices, speechLang, haltPlayback, speakWithCloud]
  );

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      lastTextRef.current = text;
      haltPlayback();
      const runId = runIdRef.current;

      if (sarvamDisabledRef.current || !SARVAM_LANGUAGES.has(speechLang)) {
        speakWithDevice(text, runId);
        return;
      }

      setIsSpeaking(true);
      loadSarvamAudio(text, speechLang)
        .then((srcs) => playSequence(srcs, runId, () => speakWithDevice(text, runIdRef.current)))
        .catch((e) => {
          if (runId !== runIdRef.current) return; // superseded by a newer speak/stop
          console.warn('[MediMate TTS] Sarvam unavailable, using fallback voice.', e);
          sarvamDisabledRef.current = true;
          speakWithDevice(text, runId);
        });
    },
    [supported, speechLang, haltPlayback, playSequence, speakWithDevice]
  );

  const replay = useCallback(() => {
    if (lastTextRef.current) speak(lastTextRef.current);
  }, [speak]);

  const stop = useCallback(() => {
    haltPlayback();
    setIsSpeaking(false);
  }, [haltPlayback]);

  // Stop any playback when the component unmounts or the language changes.
  useEffect(() => stop, [stop]);

  return { speak, replay, stop, isSpeaking, supported };
}

// Speech-to-text: records the patient's spoken answer and returns transcribed
// text via onResult. Uses the browser's SpeechRecognition where available;
// otherwise simulates a short recording so the kiosk flow remains demoable.
export function useVoiceRecorder(speechLang: string, onResult: (text: string) => void, simulatedAnswer: string) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Simulated fallback for browsers/kiosks without SpeechRecognition support.
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        onResult(simulatedAnswer);
      }, 2000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechLang, onResult, simulatedAnswer]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsRecording(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  return { isRecording, start, stop, toggle };
}
