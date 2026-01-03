'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon, File, Table, Archive, Video, Music, Code, Database, Sparkles, Copy, Check } from 'lucide-react';
import { Artifact } from '@/types';

interface UploadPreviewZoneProps {
  files: File[];
  artifacts?: Artifact[];
  onRemoveFile: (index: number) => void;
  onRemoveArtifact?: (id: string) => void;
  sidebarOpen?: boolean;
}

type PreviewItem =
  | { type: 'file'; data: File; index: number }
  | { type: 'artifact'; data: Artifact };

export default function UploadPreviewZone({
  files,
  artifacts = [],
  onRemoveFile,
  onRemoveArtifact,
  sidebarOpen = false,
}: UploadPreviewZoneProps) {
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());
  const [expandedArtifact, setExpandedArtifact] = useState<Artifact | null>(null);
  const [copied, setCopied] = useState(false);

  // ESC key handler to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedArtifact) {
        setExpandedArtifact(null);
      }
    };

    if (expandedArtifact) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [expandedArtifact]);

  // Create object URLs for image files
  useEffect(() => {
    const newPreviewUrls = new Map<number, string>();

    files.forEach((file, index) => {
      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.set(index, url);
      }
    });

    setPreviewUrls(newPreviewUrls);

    // Cleanup function to revoke all URLs
    return () => {
      newPreviewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  // Combine files and artifacts into unified preview items
  const previewItems: PreviewItem[] = [
    ...files.map((file, index) => ({ type: 'file' as const, data: file, index })),
    ...artifacts.map((artifact) => ({ type: 'artifact' as const, data: artifact })),
  ];

  if (previewItems.length === 0) return null;

  const isImageFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
  };

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

  const getArtifactIcon = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'code':
        return Code;
      case 'data':
      case 'table':
        return Database;
      case 'llm-response':
        return Sparkles;
      default:
        return FileText;
    }
  };

  const getModelLabel = (modelId?: string): string => {
    if (!modelId) return 'Unknown';

    // Map model IDs to display names
    const modelMap: Record<string, string> = {
      'gemini': 'Gemini',
      'gpt': 'GPT',
      'claude': 'Claude',
      'grok': 'Grok',
      'perplexity': 'Perplexity',
      'meta': 'Meta',
      'mistral': 'Mistral',
      'haley': 'Haley',
    };

    return modelMap[modelId] || modelId.charAt(0).toUpperCase() + modelId.slice(1);
  };

  const getArtifactTitle = (artifact: Artifact): string => {
    if (artifact.title) return artifact.title;
    if (artifact.type === 'llm-response') return 'LLM Response';
    if (artifact.type === 'code') return `Code (${artifact.language || 'text'})`;
    if (artifact.type === 'table') return 'Data Table';
    return 'Artifact';
  };

  const getArtifactSize = (artifact: Artifact): string => {
    const size = artifact.content?.length || 0;
    if (size < 1024) return `${size} chars`;
    return `${(size / 1024).toFixed(1)} KB`;
  };

  const handleCopyArtifact = async (artifact: Artifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy artifact content:', err);
    }
  };

  return (
    <>
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
            overflow: hidden;
          }

          .file-card:hover {
            border-color: var(--primary);
          }

          .image-thumbnail {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
            opacity: 1;
          }

          .image-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.6);
            padding: 6px 8px;
            z-index: 1;
            backdrop-filter: blur(4px);
          }

          .image-overlay .file-name {
            font-size: 11px;
            font-weight: 500;
            color: white;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
            margin-bottom: 2px;
          }

          .image-overlay .file-size {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.8);
          }

          .model-badge {
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(75, 108, 255, 0.9);
            color: white;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            z-index: 2;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .artifact-card {
            background: linear-gradient(135deg, rgba(75, 108, 255, 0.1) 0%, rgba(75, 108, 255, 0.05) 100%);
            border-color: rgba(75, 108, 255, 0.3);
          }

          .artifact-card:hover {
            border-color: rgba(75, 108, 255, 0.6);
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
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
            z-index: 2;
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

          .artifact-card {
            cursor: pointer;
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
            {previewItems.map((item, itemIndex) => {
              if (item.type === 'file') {
                const file = item.data;
                const fileIndex = item.index;
                const Icon = getFileIcon(file);
                const isImage = isImageFile(file);
                const previewUrl = previewUrls.get(fileIndex);

                return (
                  <div
                    key={`file-${file.name}-${fileIndex}`}
                    className={`file-card ${isImage ? 'has-image' : ''}`}
                  >
                    {isImage && previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="image-thumbnail"
                        />
                        <div className="image-overlay">
                          <div className="file-name" title={file.name}>
                            {file.name}
                          </div>
                          <div className="file-size">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="file-header">
                          <Icon size={18} className="file-icon" />
                          <div className="file-name" title={file.name}>
                            {file.name}
                          </div>
                        </div>
                        <div className="file-size">
                          {formatFileSize(file.size)}
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => onRemoveFile(fileIndex)}
                      className="remove-btn"
                      aria-label="Remove file"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              } else {
                // Artifact rendering
                const artifact = item.data;
                const Icon = getArtifactIcon(artifact);
                const title = getArtifactTitle(artifact);
                const size = getArtifactSize(artifact);
                const modelLabel = getModelLabel(artifact.modelId);

                return (
                  <div
                    key={`artifact-${artifact.id}`}
                    className="file-card artifact-card"
                    onClick={() => setExpandedArtifact(artifact)}
                  >
                    {artifact.modelId && (
                      <div className="model-badge">{modelLabel}</div>
                    )}

                    <div className="file-header">
                      <Icon size={18} className="file-icon" />
                      {/* Hide title for llm-response artifacts with modelId since badge already shows model name */}
                      {!(artifact.type === 'llm-response' && artifact.modelId) && (
                        <div className="file-name" title={title}>
                          {title}
                        </div>
                      )}
                    </div>
                    <div className="file-size">
                      {size}
                    </div>

                    {onRemoveArtifact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveArtifact(artifact.id);
                        }}
                        className="remove-btn"
                        aria-label="Remove artifact"
                        title="Remove artifact"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Expanded Artifact Modal - Rendered outside parent to properly overlay sidebar */}
      {expandedArtifact && (
        <div
          className="modal-overlay"
          onClick={() => setExpandedArtifact(null)}
        >
          <style jsx>{`
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.92);
              z-index: 99999;
              display: flex;
              align-items: center;
              justify-content: center;
              backdrop-filter: blur(8px);
              animation: fadeIn 0.2s ease-out;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .modal-content {
              background: var(--panel-dark);
              border: 1px solid var(--border);
              border-radius: 16px;
              width: 90vw;
              height: 90vh;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              animation: slideUp 0.3s ease-out;
            }

            .modal-header {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 24px 32px;
              border-bottom: 1px solid var(--border);
              background: var(--panel);
            }

            .modal-title {
              display: flex;
              align-items: center;
              gap: 16px;
              font-size: 20px;
              font-weight: 600;
              color: var(--text-primary);
            }

            .modal-actions {
              display: flex;
              gap: 8px;
            }

            .modal-btn {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 16px;
              background: var(--primary);
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            }

            .modal-btn:hover {
              background: var(--primary-hover);
            }

            .modal-btn.copied {
              background: var(--success);
            }

            .modal-close {
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid var(--border);
              border-radius: 8px;
              color: var(--text-primary);
              cursor: pointer;
              transition: all 0.2s;
            }

            .modal-close:hover {
              background: rgba(255, 255, 255, 0.1);
              border-color: var(--primary);
              color: var(--primary);
              transform: scale(1.05);
            }

            .modal-close:active {
              transform: scale(0.95);
            }

            .modal-body {
              flex: 1;
              overflow-y: auto;
              overflow-x: hidden;
              padding: 32px;
              background: var(--panel-dark);
            }

            .modal-body::-webkit-scrollbar {
              width: 12px;
            }

            .modal-body::-webkit-scrollbar-track {
              background: transparent;
            }

            .modal-body::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              border: 3px solid transparent;
              background-clip: padding-box;
            }

            .modal-body::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
              background-clip: padding-box;
            }

            .artifact-content {
              background: var(--panel);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 24px;
              font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.7;
              color: var(--text-primary);
              white-space: pre-wrap;
              word-break: break-word;
              min-height: 100%;
            }

            @media (max-width: 768px) {
              .modal-content {
                width: 95vw;
                height: 95vh;
                border-radius: 12px;
              }

              .modal-header {
                padding: 16px 20px;
              }

              .modal-title {
                font-size: 18px;
                gap: 12px;
              }

              .modal-body {
                padding: 20px;
              }

              .artifact-content {
                padding: 16px;
                font-size: 13px;
              }

              .modal-close {
                width: 36px;
                height: 36px;
              }
            }
          `}</style>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                {(() => {
                  const Icon = getArtifactIcon(expandedArtifact);
                  return <Icon size={24} />;
                })()}
                <span>{getArtifactTitle(expandedArtifact)}</span>
                {expandedArtifact.modelId && (
                  <span className="model-badge">
                    {getModelLabel(expandedArtifact.modelId)}
                  </span>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className={`modal-btn ${copied ? 'copied' : ''}`}
                  onClick={() => handleCopyArtifact(expandedArtifact)}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </button>
                <button
                  className="modal-close"
                  onClick={() => setExpandedArtifact(null)}
                  aria-label="Close modal"
                  title="Close (ESC)"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="artifact-content">
                {expandedArtifact.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
