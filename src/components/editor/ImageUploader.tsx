"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;
  onUploaded: (url: string) => void;
  // Rendu compact (pour l'image de couverture par ex.)
  compact?: boolean;
}

export function ImageUploader({ value, onUploaded, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setStatus("uploading");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi");
      onUploaded(data.url);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition ${
          compact ? "p-4" : "p-6"
        } ${
          dragOver
            ? "border-brand bg-indigo-50"
            : "border-gray-200 bg-gray-50 hover:border-brand"
        }`}
      >
        {status === "uploading" ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
            Envoi en cours…
          </div>
        ) : (
          <>
            <span className="text-2xl">🖼️</span>
            <span className="mt-1 text-sm font-medium text-gray-700">
              Glissez une image ici ou cliquez
            </span>
            <span className="text-xs text-gray-400">
              JPEG, PNG, WebP, GIF, AVIF, SVG — max 8 Mo
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {status === "error" && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {value && status !== "uploading" && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className={`rounded-lg object-cover ${compact ? "max-h-28" : "max-h-48"}`}
          />
        </div>
      )}
    </div>
  );
}
