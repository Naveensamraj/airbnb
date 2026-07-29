import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface IdProofUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  existingUrl?: string;
  existingFileName?: string;
  existingMimeType?: string;
  onRemoveExisting?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function IdProofUpload({
  selectedFile,
  onFileSelect,
  existingUrl,
  existingFileName,
  existingMimeType,
  onRemoveExisting,
}: IdProofUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview for selected new file
  useEffect(() => {
    if (!selectedFile) {
      setImagePreview(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [selectedFile]);

  // Simulate progress when a file is selected
  const processFile = (file: File) => {
    setError(null);

    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

    if (!isValidType) {
      setError('Invalid file format. Only PDF, JPG, JPEG, and PNG files are accepted.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      return;
    }

    // Simulate progress bar
    setUploadProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      if (current >= 100) {
        setUploadProgress(100);
        clearInterval(interval);
        setTimeout(() => setUploadProgress(null), 400);
        onFileSelect(file);
      } else {
        setUploadProgress(current);
      }
    }, 60);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setError(null);
    setUploadProgress(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (selectedFile) {
      onFileSelect(null);
    } else if (onRemoveExisting) {
      onRemoveExisting();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = (mime?: string, filename?: string) => {
    if (mime === 'application/pdf') return true;
    if (filename && filename.toLowerCase().endsWith('.pdf')) return true;
    return false;
  };

  const isExistingPdf = isPdf(existingMimeType, existingFileName);
  const isSelectedPdf = selectedFile ? isPdf(selectedFile.type, selectedFile.name) : false;

  const hasFile = !!selectedFile || !!existingUrl;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        ID Proof Upload <span className="text-slate-400 font-normal">(PDF, JPG, PNG · Max 5MB)</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploading progress overlay */}
      {uploadProgress !== null && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-medium text-blue-700">
            <span>Validating & Loading file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Preview Card if file selected or existing */}
      {hasFile && uploadProgress === null && (
        <div className="relative p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Image Preview Thumbnail */}
            {(imagePreview || (existingUrl && !isExistingPdf)) && (
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                <img
                  src={imagePreview || (existingUrl?.startsWith('http') ? existingUrl : `http://localhost:5000${existingUrl}`)}
                  alt="ID Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* PDF Preview Icon */}
            {(isSelectedPdf || isExistingPdf) && (
              <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-200">
                <FileText size={24} />
              </div>
            )}

            {/* File details */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {selectedFile ? selectedFile.name : existingFileName || 'Uploaded ID Document'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>{selectedFile ? formatFileSize(selectedFile.size) : 'Attached Document'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 size={12} /> Ready
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs flex items-center gap-1 font-medium"
              title="Replace file"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Replace</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Drag and drop dropzone when no file selected */}
      {!hasFile && uploadProgress === null && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                <span className="text-blue-600 underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, JPG, JPEG, PNG up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
