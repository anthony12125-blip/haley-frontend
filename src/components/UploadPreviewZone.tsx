'use client';

import { X, FileText, Image as ImageIcon, File, Table, Archive, Video, Music } from 'lucide-react';

interface UploadPreviewZoneProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  sidebarOpen?: boolean;
}

export default function UploadPreviewZone({
  files,
  onRemoveFile,
  sidebarOpen = false,
}: UploadPreviewZoneProps) {
  if (files.length === 0) return null;

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return ImageIcon;
    }
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return FileText;
    }
    // Spreadsheets
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return Table;
    }
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return Archive;
    }
    // Video
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
      return Video;
    }
    // Audio
    if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(extension)) {
      return Music;
    }
    // Default
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`upload-preview-zone glass-strong border-t border-border safe-bottom transition-all duration-300 ${
        sidebarOpen ? 'md:left-80' : 'md:left-[60px]'
      }`}
    >
      <style jsx>{`
        .upload-preview-zone {
          position: fixed;
          bottom: 70px;
          left: 0;
          right: 0;
          z-index: 30;
        }

        .preview-container {
          max-width: 48rem;
          margin: 0 auto;
          padding: 12px 16px;
          overflow-x: auto;
          overflow-y: hidden;
          max-height: 120px;
        }

        .preview-scroll {
          display: flex;
          gap: 12px;
          min-width: min-content;
        }

        .file-card {
          display: flex;
          flex-direction: column;
          min-width: 180px;
          max-width: 180px;
          height: 80px;
          background: var(--panel-dark);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          position: relative;
          transition: all 0.2s;
        }

        .file-card:hover {
          border-color: var(--primary);
        }

        .file-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }

        .file-icon {
          flex-shrink: 0;
          color: var(--accent);
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }

        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .remove-btn:hover {
          background: var(--error);
          color: white;
        }

        .file-size {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: auto;
        }

        @media (max-width: 768px) {
          .upload-preview-zone {
            bottom: 90px;
            left: 0 !important;
          }
        }
      `}</style>

      <div className="preview-container">
        <div className="preview-scroll">
          {files.map((file, index) => {
            const Icon = getFileIcon(file);

            return (
              <div key={`${file.name}-${index}`} className="file-card">
                <button
                  onClick={() => onRemoveFile(index)}
                  className="remove-btn"
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <X size={14} />
                </button>

                <div className="file-header">
                  <Icon size={18} className="file-icon" />
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                </div>

                <div className="file-size">
                  {formatFileSize(file.size)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
