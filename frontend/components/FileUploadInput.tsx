"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface FileUploadInputProps {
  label?: string;
  value?: string; // base64 string or file URL
  onChange: (fileDataUrl: string, fileName: string) => void;
  required?: boolean;
  helpText?: string;
}

// Client-side image compression and conversion (converts iPhone HEIC/PNG/JPG to optimized web JPEG)
function compressImageToJpeg(file: File, maxDim = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const jpegData = canvas.toDataURL("image/jpeg", quality);
      resolve(jpegData);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export default function FileUploadInput({
  label = "Upload Bill / Invoice / Document",
  value = "",
  onChange,
  required = false,
  helpText = "iPhone Photos (HEIC, JPG, JPEG, PNG) or PDF / Office files (Max 25MB)",
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setFileName("");
      setFileSize("");
      setUploadStatus("idle");
      setStatusMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 25MB upper limit for raw camera captures
    if (file.size > 25 * 1024 * 1024) {
      setUploadStatus("error");
      setStatusMessage("File exceeds 25MB limit. Please choose a smaller photo or document.");
      return;
    }

    setUploadStatus("processing");
    setStatusMessage(`Optimizing "${file.name}"...`);

    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(file.name);

    try {
      let finalDataUrl = "";
      let finalSizeStr = "";
      let outName = file.name;

      if (isImage) {
        try {
          finalDataUrl = await compressImageToJpeg(file, 1920, 0.85);
          const approxBytes = (finalDataUrl.length * 3) / 4;
          finalSizeStr =
            approxBytes > 1024 * 1024
              ? (approxBytes / (1024 * 1024)).toFixed(1) + " MB"
              : (approxBytes / 1024).toFixed(1) + " KB";

          if (/\.(heic|heif)$/i.test(outName)) {
            outName = outName.replace(/\.(heic|heif)$/i, ".jpg");
          }
        } catch {
          // Direct base64 fallback for un-decodable raw images
          finalDataUrl = await readFileAsDataUrl(file);
          finalSizeStr = (file.size / 1024).toFixed(1) + " KB";
        }
      } else {
        finalDataUrl = await readFileAsDataUrl(file);
        finalSizeStr = (file.size / 1024).toFixed(1) + " KB";
      }

      setFileName(outName);
      setFileSize(finalSizeStr);
      onChange(finalDataUrl, outName);
      setUploadStatus("success");
      setStatusMessage(`"${outName}" attached successfully (${finalSizeStr})`);
    } catch (err) {
      console.error("File reading error:", err);
      setUploadStatus("error");
      setStatusMessage("Failed to process file. Please try another photo or format.");
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setFileName("");
    setFileSize("");
    setUploadStatus("idle");
    setStatusMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImageAttachment =
    value?.startsWith("data:image") ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(fileName || value || "");

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* File Drop / Trigger Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
          value || uploadStatus === "success"
            ? "border-emerald-600/70 bg-emerald-950/20 hover:bg-emerald-950/30"
            : uploadStatus === "error"
            ? "border-red-600/70 bg-red-950/20"
            : uploadStatus === "processing"
            ? "border-sky-500/70 bg-sky-950/20"
            : "border-slate-700 hover:border-sky-500 bg-slate-800/60 hover:bg-slate-800"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.heic,.heif,.HEIC,.HEIF,.jpg,.jpeg,.png,.webp,.bmp,.gif,.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        {uploadStatus === "processing" ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin mb-1" />
            <p className="text-xs font-bold text-sky-200">Processing &amp; Optimizing Photo...</p>
            <p className="text-[11px] text-slate-400">Converting for instant cloud sync</p>
          </div>
        ) : value || fileName ? (
          <div className="w-full flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                {isImageAttachment ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {fileName || (value.startsWith("data:") ? "Attached Document" : value)}
                </p>
                {fileSize && <p className="text-[11px] text-emerald-400 font-mono">{fileSize}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPreviewOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs flex items-center gap-1 font-semibold"
                  title="Preview / Download"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 border border-slate-700"
                title="Remove attachment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <UploadCloud className="w-7 h-7 text-sky-400 mb-1.5 animate-bounce" />
            <p className="text-xs font-semibold text-slate-200">
              Click to browse or take/upload photo (iPhone HEIC &amp; JPG supported)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{helpText}</p>
          </div>
        )}
      </div>

      {/* Success / Error / Processing Message Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium animate-fadeIn ${
            uploadStatus === "success"
              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
              : uploadStatus === "processing"
              ? "bg-sky-950/60 text-sky-300 border border-sky-800/60"
              : "bg-red-950/60 text-red-300 border border-red-800/60"
          }`}
        >
          {uploadStatus === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : uploadStatus === "processing" ? (
            <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* Document Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {isImageAttachment ? (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileText className="w-4 h-4 text-sky-400" />
                )}
                <span>Attached Document / Receipt Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800">
              {isImageAttachment ? (
                <img
                  src={value}
                  alt="Bill / Receipt Preview"
                  className="max-h-[50vh] max-w-full rounded-lg object-contain"
                />
              ) : value && value.startsWith("data:application/pdf") ? (
                <iframe src={value} className="w-full h-[50vh] rounded-lg" title="PDF Preview" />
              ) : (
                <div className="py-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">{fileName || value}</p>
                  <a
                    href={value}
                    download={fileName || "attachment"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" /> Download / Open File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
