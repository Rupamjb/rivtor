import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Mic, Paperclip, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ContentFormat } from "@/lib/content-agent";
import type { AgentMode, UploadedFileItem, VoiceComposerStatus } from "@/types/founderos-dashboard";


export function ChatInputBar({
  value,
  onValue,
  sending,
  selectedAgent,
  onSelectAgent,
  contentFormat,
  onContentFormat,
  contentImageEnabled,
  onContentImageEnabled,
  contentTone,
  onContentTone,
  contentLength,
  onContentLength,
  queuedFiles,
  onUploadFiles,
  onSubmit,
  voiceStatus,
  voicePreview,
  voiceError,
  onVoiceStatus,
  onVoiceError,
  onDiscardVoice,
  onTranscribeAudio,
  onVoiceTranscript,
}: {
  value: string;
  onValue: (value: string) => void;
  sending: boolean;
  selectedAgent: AgentMode;
  onSelectAgent: (value: AgentMode) => void;
  contentFormat: ContentFormat;
  onContentFormat: (value: ContentFormat) => void;
  contentImageEnabled: boolean;
  onContentImageEnabled: (value: boolean) => void;
  contentTone: "professional" | "bold" | "insightful" | "casual";
  onContentTone: (value: "professional" | "bold" | "insightful" | "casual") => void;
  contentLength: "short" | "medium" | "long";
  onContentLength: (value: "short" | "medium" | "long") => void;
  queuedFiles: UploadedFileItem[];
  onUploadFiles: (files: FileList | null) => void;
  onSubmit: () => void;
  voiceStatus: VoiceComposerStatus;
  voicePreview: string;
  voiceError: string;
  onVoiceStatus: (value: VoiceComposerStatus) => void;
  onVoiceError: (value: string) => void;
  onDiscardVoice: () => void;
  onTranscribeAudio: (file: File) => Promise<void>;
  onVoiceTranscript: (transcript: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordStartedAtRef = useRef<number>(0);
  const shouldTranscribeRef = useRef<boolean>(true);
  const recognitionResolvedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      const recognition = speechRecognitionRef.current;
      if (recognition && typeof recognition.abort === "function") {
        recognition.abort();
      }
    };
  }, []);

  async function startVoiceRecording(event: ReactPointerEvent<HTMLButtonElement>) {
    if (sending || voiceStatus === "transcribing") {
      return;
    }
    try {
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      onVoiceError("");
      onDiscardVoice();
      chunksRef.current = [];
      shouldTranscribeRef.current = true;

      const recognitionConstructor =
        typeof window !== "undefined"
          ? (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
            || (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition
          : undefined;

      if (recognitionConstructor) {
        const recognition = new recognitionConstructor();
        speechRecognitionRef.current = recognition;
        recognitionResolvedRef.current = false;
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (speechEvent: any) => {
          const transcript = String(speechEvent?.results?.[0]?.[0]?.transcript || "").trim();
          recognitionResolvedRef.current = true;
          if (!transcript) {
            onVoiceError("No speech detected. Hold the mic and try again.");
            return;
          }
          onVoiceTranscript(transcript);
        };

        recognition.onerror = () => {
          recognitionResolvedRef.current = true;
          onVoiceError("Speech recognition failed. Try again.");
          onVoiceStatus("idle");
        };

        recognition.onend = () => {
          speechRecognitionRef.current = null;
          if (!recognitionResolvedRef.current) {
            onVoiceError("No speech detected. Hold the mic and try again.");
          }
          onVoiceStatus("idle");
        };

        recognition.start();
        recordStartedAtRef.current = Date.now();
        onVoiceStatus("recording");
        return;
      }

      if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
        onVoiceError("Voice recording is not supported in this browser.");
        onVoiceStatus("idle");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const shouldTranscribe = shouldTranscribeRef.current;
        shouldTranscribeRef.current = true;

        const mimeType = recorder.mimeType || "audio/webm";
        const extension = mimeType.includes("wav") ? "wav" : mimeType.includes("mpeg") ? "mp3" : mimeType.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const stopStream = streamRef.current;
        if (stopStream) {
          for (const track of stopStream.getTracks()) {
            track.stop();
          }
        }
        streamRef.current = null;
        if (!shouldTranscribe || blob.size === 0) {
          onVoiceStatus("idle");
          onVoiceError("Recording too short. Hold the mic button and speak, then release.");
          return;
        }
        const file = new File([blob], `voice-note.${extension}`, { type: mimeType });
        await onTranscribeAudio(file);
      };

      recorder.start();
      recordStartedAtRef.current = Date.now();
      onVoiceStatus("recording");
    } catch {
      onVoiceError("Unable to access microphone.");
      onVoiceStatus("idle");
    }
  }

  function stopVoiceRecording(event: ReactPointerEvent<HTMLButtonElement>) {
    if (typeof event.currentTarget.hasPointerCapture === "function" && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const recorder = mediaRecorderRef.current;
    const recognition = speechRecognitionRef.current;
    const durationMs = Date.now() - (recordStartedAtRef.current || Date.now());

    if (recognition) {
      if (durationMs < 300) {
        recognitionResolvedRef.current = true;
        if (typeof recognition.abort === "function") {
          recognition.abort();
        }
        speechRecognitionRef.current = null;
        onVoiceStatus("idle");
        onVoiceError("Recording too short. Hold the mic button and speak, then release.");
        return;
      }
      onVoiceStatus("transcribing");
      if (typeof recognition.stop === "function") {
        recognition.stop();
      }
      return;
    }

    if (!recorder || recorder.state !== "recording") {
      return;
    }

    if (durationMs < 300) {
      shouldTranscribeRef.current = false;
    }
    onVoiceStatus("transcribing");
    recorder.stop();
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,11,16,0.2),rgba(10,11,16,0.96)_26%,rgba(10,11,16,1)_48%)] px-3 pb-4 pt-3 sm:px-5">
      <div className="rounded-2xl border border-white/10 bg-[#0f1219]/95 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
          <Select value={selectedAgent} onValueChange={(value) => onSelectAgent(value as AgentMode)}>
            <SelectTrigger aria-label="Agent mode" className="h-8 w-[148px] border-white/10 bg-white/[0.02] text-xs">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orchestrator">Auto Route</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>

          {selectedAgent === "content" ? (
            <>
              <Select value={contentFormat} onValueChange={(value) => onContentFormat(value as ContentFormat)}>
                <SelectTrigger aria-label="Content format" className="h-8 w-[156px] border-white/10 bg-white/[0.02] text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="x_post">X Post</SelectItem>
                  <SelectItem value="blog_outline">Blog Outline</SelectItem>
                  <SelectItem value="founder_update">Founder Update</SelectItem>
                  <SelectItem value="launch_post">Launch Post</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentTone} onValueChange={(value) => onContentTone(value as "professional" | "bold" | "insightful" | "casual")}>
                <SelectTrigger aria-label="Content tone" className="h-8 w-[122px] border-white/10 bg-white/[0.02] text-xs">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="insightful">Insightful</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentLength} onValueChange={(value) => onContentLength(value as "short" | "medium" | "long")}>
                <SelectTrigger aria-label="Content length" className="h-8 w-[112px] border-white/10 bg-white/[0.02] text-xs">
                  <SelectValue placeholder="Length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>

              {contentFormat === "linkedin" ? (
                <label className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2 text-xs text-zinc-300">
                  <Switch
                    checked={contentImageEnabled}
                    onCheckedChange={onContentImageEnabled}
                    aria-label="Generate image"
                    className="h-5 w-9 data-[state=checked]:bg-emerald-500"
                  />
                  Generate image
                </label>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="mt-2 flex gap-2">
          <Textarea
            value={value}
            onChange={(event) => onValue(event.target.value)}
            placeholder="Ask FounderOS to research, generate, summarize, or execute..."
            className="max-h-[220px] min-h-[56px] resize-none border-white/10 bg-white/[0.02] text-sm"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />

          <div className="flex shrink-0 flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => onUploadFiles(event.target.files)}
            />
            <Button type="button" size="icon" variant="outline" className="border-white/10 bg-white/[0.02]" onClick={() => inputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              aria-label="Record voice"
              variant="outline"
              className="border-white/10 bg-white/[0.02]"
              onPointerDown={startVoiceRecording}
              onPointerUp={stopVoiceRecording}
              onPointerCancel={stopVoiceRecording}
              disabled={sending || voiceStatus === "transcribing"}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" aria-label="Send" disabled={sending} onClick={onSubmit}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {queuedFiles.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {queuedFiles.map((file) => (
              <span key={file.id} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-300">
                {file.name}
              </span>
            ))}
          </div>
        ) : null}

        {voiceStatus === "recording" ? <p className="mt-2 text-xs text-amber-300">Recording... release to transcribe.</p> : null}
        {voiceStatus === "transcribing" ? <p className="mt-2 text-xs text-zinc-300">Transcribing audio...</p> : null}
        {voiceError ? <p className="mt-2 text-xs text-rose-300">{voiceError}</p> : null}

        {voicePreview ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Voice Transcript</p>
              <Button type="button" size="sm" variant="outline" className="h-7 border-white/10 bg-white/[0.02] px-2 text-xs" onClick={onDiscardVoice}>
                Discard
              </Button>
            </div>
            <p className="mt-1 text-xs text-zinc-300">{voicePreview}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
