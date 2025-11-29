'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function TestGenerationTab() {
  const { files } = useFileStore();
  const [codeContent, setCodeContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [testType, setTestType] = useState<'unit' | 'integration'>('unit');
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
      const response = await apiClient.post('/code-tools/generate-tests', {
        codeContent,
        fileName: fileName || undefined,
        testType,
      });
      setResult(response.data.result);
    } catch (error: any) {
      console.error('Test generation error:', error);
      alert(error.response?.data?.error || 'Test üretimi hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          🧪 Test Üretimi
        </h2>
        <p className="text-gray-600 mt-1">Kodunuz için otomatik test case'leri oluşturun</p>
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
            placeholder="örnek: calculator.js"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
      )}

      {/* Test Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Tipi</label>
        <div className="flex gap-4">
          <button
            onClick={() => setTestType('unit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              testType === 'unit'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unit Test
          </button>
          <button
            onClick={() => setTestType('integration')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              testType === 'integration'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Integration Test
          </button>
        </div>
      </div>

      {/* Code Input */}
      <div className="flex-1 flex flex-col mb-4">
        <label className="block text-sm font-medium mb-2">Test Edilecek Kod</label>
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
        className="action-button disabled:opacity-50 disabled:cursor-not-allowed mb-4 bg-green-600 hover:bg-green-700"
      >
        {loading ? '⏳ Test üretiliyor...' : '🧪 Test Case Oluştur'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🧪</span>
              Test Planı
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
