"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, RotateCcw, X, ZoomIn } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { Notice, Panel, useAction } from "./parts";
import { useApi } from "@/lib/workspace";

const OUT = 256; // output + preview size in px

/**
 * A round profile photo with zoom + drag-to-position before saving. The image
 * is cropped and downscaled to a small square in the browser and stored as a
 * compressed data URL — so it works the same in the real app (Postgres) and the
 * in-browser demo, with no file server.
 */
function Cropper({ file, onDone, onCancel }: { file: File; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, OUT, OUT);
    const base = Math.max(OUT / img.width, OUT / img.height);
    const w = img.width * base * scale;
    const h = img.height * base * scale;
    const dx = (OUT - w) / 2 + off.x;
    const dy = (OUT - h) / 2 + off.y;
    ctx.drawImage(img, dx, dy, w, h);
  }, [scale, off]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX - off.x, y: e.clientY - off.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative overflow-hidden rounded-full ring-4 ring-brand-100"
          style={{ width: OUT, height: OUT, touchAction: "none", cursor: drag.current ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <canvas ref={canvasRef} width={OUT} height={OUT} className="block" />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
        </div>
        <label className="flex w-full max-w-[280px] items-center gap-2 text-[12px] text-ink-4">
          <ZoomIn className="size-3.5 shrink-0" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            aria-label="Zoom"
            className="w-full accent-brand-600"
          />
        </label>
        <p className="text-[11.5px] text-ink-4">Drag to reposition · slide to zoom</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={save} icon={<Check className="size-4" />}>Save photo</Button>
        <Button size="sm" variant="secondary" onClick={() => { setScale(1); setOff({ x: 0, y: 0 }); }} icon={<RotateCcw className="size-4" />}>Reset</Button>
        <Button size="sm" variant="ghost" onClick={onCancel} icon={<X className="size-4" />}>Cancel</Button>
      </div>
    </div>
  );
}

/** A card that shows the current photo and lets any user set a new one. */
export default function ProfilePhotoCard({
  name,
  currentUrl,
  onSaved,
}: {
  name: string;
  currentUrl?: string | null;
  onSaved?: (url: string) => void;
}) {
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const { busy, err, run, setErr } = useAction();

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  const pick = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    setFile(f);
  };

  const onDone = async (dataUrl: string) => {
    const ok = await run(() => api.setAvatar(dataUrl));
    if (ok) {
      setPreview(dataUrl);
      setFile(null);
      onSaved?.(dataUrl);
    }
  };

  return (
    <Panel title={{ en: "Profile photo", bn: "প্রোফাইল ছবি" }} desc={{ en: "Shown next to your name across WorkBridge", bn: "ওয়ার্কব্রিজ জুড়ে আপনার নামের পাশে দেখানো হয়" }}>
      <div className="p-5">
        {file ? (
          <Cropper file={file} onDone={onDone} onCancel={() => setFile(null)} />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={name} src={preview} size={72} />
            <div className="min-w-0">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} icon={<Camera className="size-4" />}>
                {preview ? "Change photo" : "Add a photo"}
              </Button>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">JPG or PNG. You can zoom and reposition before saving.</p>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = ""; }} />
        {busy && <p className="mt-3 text-[12px] text-ink-4">Saving…</p>}
        {err && <Notice tone="error" className="mt-3">{err}</Notice>}
      </div>
    </Panel>
  );
}
