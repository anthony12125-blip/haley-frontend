'use client';

import { Plus } from 'lucide-react';
import { useRef } from 'react';

interface PlusUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
}

export default function PlusUploadButton({ onFilesSelected }: PlusUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="p-3 rounded-full bg-haley-primary hover:bg-haley-secondary transition-colors"
        title="Upload file"
      >
        <Plus className="w-5 h-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.zip"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
