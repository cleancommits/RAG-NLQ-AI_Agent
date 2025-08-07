import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function FileUpload({ onClose }) {
  const [status, setStatus] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'] },
    onDrop: async (acceptedFiles) => {
      setStatus('Uploading...');
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData);
          setStatus(`Uploaded: ${response.data.filename}`);
        } catch (error) {
          setStatus(`Error: ${error.response?.data?.detail || error.message}`);
        }
      }
    },
  });

  return (
    <div className="relative p-6">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Upload Files</h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 rounded-lg text-center transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {isDragActive ? 'Drop files here...' : 'Drag and drop PDFs or CSVs, or click to select'}
        </p>
      </div>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{status}</p>
    </div>
  );
}