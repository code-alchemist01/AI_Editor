'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function DocumentationTab() {
  const { files } = useFileStore();
  const [codeContent, setCodeContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [docType, setDocType] = useState<'api' | 'function' | 'class'>('api');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const resultEndRef = useRef<HTMLDivElement>(null);

  const allFilesForDropdown = useMemo(() => getAllFilesForDropdown(files), [files]);

  // Auto scroll when result changes - scroll the entire page
  useEffect(() => {
    if (result) {
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [result]);

  // Load file content when selected
  useEffect(() => {
    const loadFileContent = async () => {
      if (!selectedFileId) return;

      const selectedFile = allFilesForDropdown.find((f) => f.id === selectedFileId) ||
                          files.find((f) => f.id === selectedFileId);

      if (!selectedFile || selectedFile.isFolder || !selectedFile.id || selectedFile.id.startsWith('folder-')) {
        return;
      }

      try {
        let fileContent = selectedFile.content;
        if (!fileContent && selectedFile.id) {
          const fullFile = await filesApi.getById(selectedFile.id);
          fileContent = fullFile.content || '';
        }
        setCodeContent(fileContent || '');
        setFileName(selectedFile.name || '');
      } catch (error) {
        console.error('Error loading file:', error);
        alert('Dosya yüklenirken hata oluştu');
      }
    };

    loadFileContent();
  }, [selectedFileId, allFilesForDropdown, files]);

  const handleGenerate = async () => {
    if (!codeContent.trim()) return;

    setLoading(true);
    setResult('');
    try {
      const response = await apiClient.post('/code-tools/generate-documentation', {
        codeContent,
        fileName: fileName || undefined,
        docType,
      });
      setResult(response.data.result);
    } catch (error: any) {
      console.error('Documentation generation error:', error);
      alert(error.response?.data?.error || 'Dokümantasyon üretimi hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📚 Dokümantasyon Üretimi
        </h2>
        <p className="text-gray-600 mt-1">Kodunuz için otomatik dokümantasyon oluşturun</p>
      </div>

      {/* File Selection */}
      {allFilesForDropdown.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Dosya Seç (Opsiyonel)</label>
          <select
            value={selectedFileId}
            onChange={(e) => {
              setSelectedFileId(e.target.value);
              if (!e.target.value) {
                setCodeContent('');
                setFileName('');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Manuel kod girişi yap...</option>
            {allFilesForDropdown.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* File Name Display */}
      {fileName && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Dosya Adı</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="örnek: apiService.js"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
      )}

      {/* Doc Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Dokümantasyon Tipi</label>
        <div className="flex gap-4">
          <button
            onClick={() => setDocType('api')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              docType === 'api'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            API Dokümantasyonu
          </button>
          <button
            onClick={() => setDocType('function')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              docType === 'function'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Fonksiyon Dokümantasyonu
          </button>
          <button
            onClick={() => setDocType('class')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              docType === 'class'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sınıf Dokümantasyonu
          </button>
        </div>
      </div>

      {/* Code Input */}
      <div className="flex-1 flex flex-col mb-4">
        <label className="block text-sm font-medium mb-2">Dokümante Edilecek Kod</label>
        <textarea
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          placeholder="Kodunuzu buraya yapıştırın..."
          className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !codeContent.trim()}
        className="action-button disabled:opacity-50 disabled:cursor-not-allowed mb-4 bg-indigo-600 hover:bg-indigo-700"
      >
        {loading ? '⏳ Dokümantasyon üretiliyor...' : '📚 Dokümantasyon Oluştur'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📚</span>
              Dokümantasyon
            </h3>
          </div>
          <div className="p-6">
            <MarkdownRenderer content={result} />
            <div ref={resultEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
