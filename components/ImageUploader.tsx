import React, { useRef } from 'react';

interface Props {
  onImageSelected: (base64: string) => void;
  label: string;
  subLabel?: string;
  compact?: boolean;
}

const ImageUploader: React.FC<Props> = ({ onImageSelected, label, subLabel, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group ${compact ? 'h-40' : 'h-64'}`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <div className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-full mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600 dark:text-purple-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-400">{label}</h3>
      {subLabel && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subLabel}</p>}
    </div>
  );
};

export default ImageUploader;