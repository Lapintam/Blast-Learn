"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FolderTree } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".md", ".markdown"];

type UploadedHierarchy = {
  files: File[];
  previewCount: number;
};

export function HierarchyUploader() {
  const [selected, setSelected] = useState<UploadedHierarchy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute("webkitdirectory", "true");
      inputRef.current.setAttribute("directory", "true");
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const files = Array.from(fileList).filter((file) => ACCEPTED_EXTENSIONS.some((ext) => file.name.endsWith(ext)));
    setSelected({ files, previewCount: files.length });
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected?.files.length) {
      setError("Select at least one Markdown file or folder");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const formData = new FormData();
      selected.files.forEach((file) => {
        formData.append("files", file, (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name);
      });
      const response = await fetch("/api/ingest/hierarchy", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const body = await response.json();
      router.refresh();
      setSelected(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to start ingestion job");
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, onUploaded]);

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-blue-100 p-3 text-blue-600">
          <FolderTree className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Upload a policy hierarchy</div>
          <div className="text-xs text-slate-500">
            Drop a folder of Markdown policies (system + site-specific). Filenames become nodes in the tree.
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 hover:border-blue-400 sm:w-2/3">
          <UploadCloud className="mb-2 h-6 w-6 text-blue-500" />
          <span className="font-medium text-slate-900">Select folder of Markdown files</span>
          <span className="text-xs">Supports nested folders • .md files</span>
          <input
            ref={inputRef}
            type="file"
            name="hierarchy"
            multiple
            className="hidden"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileChange}
          />
        </label>
        <div className="flex flex-1 flex-col items-start gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Start Ingestion"}
          </Button>
          {selected ? (
            <span className="text-xs text-slate-500">{selected.previewCount} Markdown files ready</span>
          ) : (
            <span className="text-xs text-slate-400">No files selected</span>
          )}
          {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}
