"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const url = await adminApi.uploadImage(dataUrl, file.name);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const pickFile = () => inputRef.current?.click();

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={pickFile}
          disabled={uploading}
          className="rounded-full"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          Upload image
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUseCustom((v) => !v)}
          className="rounded-full"
        >
          {useCustom ? "Use URL instead" : "Enter URL manually"}
        </Button>
      </div>

      {useCustom && (
        <Input
          placeholder="/wheat.jpg or https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {value ? (
        <div className="relative inline-flex overflow-hidden rounded-xl border border-border/60 bg-muted">
          <img
            src={value}
            alt="Preview"
            className="size-24 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow hover:bg-background"
            aria-label="Remove image"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div className="flex size-24 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 text-xs text-muted-foreground">
          No image
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
