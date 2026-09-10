"use client";

import React from "react";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
} from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  url = "",
  title = "Document Preview",
}: DocumentPreviewModalProps) {
  if (!isOpen || !url) return null;

  const isImage =
    url.startsWith("data:image") ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(url);

  const isPdf =
    url.startsWith("data:application/pdf") ||
    /\.pdf$/i.test(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-950 border border-sky-600/80 flex items-center justify-center text-sky-400 shrink-0 shadow-md">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">{title}</h3>
              <p className="text-[11px] text-slate-400">Attached Report / Proof Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              download={title.replace(/[^a-zA-Z0-9_-]/g, "_") || "attachment"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-950/80 flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="max-h-[70vh] flex items-center justify-center">
              <img
                src={url}
                alt={title}
                className="max-h-[68vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-2xl border border-slate-800 shadow-2xl bg-white"
              title={title}
            />
          ) : (
            <div className="py-12 px-6 text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto shadow-xl">
                <FileText className="w-8 h-8 text-sky-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{title}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  This document format is best viewed when downloaded or opened externally.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <a
                  href={url}
                  download={title.replace(/[^a-zA-Z0-9_-]/g, "_") || "attachment"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black transition shadow-xl"
                >
                  <Download className="w-4 h-4" /> Download / Open Document
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[11px]">Jaitra Document Viewer</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition text-xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
