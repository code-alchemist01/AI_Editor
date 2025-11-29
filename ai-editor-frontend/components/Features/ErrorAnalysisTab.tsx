'use client';

import { useState, useMemo } from 'react';
import apiClient from '@/lib/api/client';
import { useFileStore } from '@/stores/fileStore';
import { flattenFiles } from '@/lib/utils/flattenFiles';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function ErrorAnalysisTab() {
  const { files } = useFileStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'single' | 'multiple'>('single');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  
  // Get all files including folder files for dropdown
  const allFilesForDropdown = useMemo(() => getAllFilesForDropdown(files), [files]);

  const handleAnalyze = async () => {
    if (!errorMessage.trim()) return;

    setLoading(true);
    try {
      if (analysisType === 'single') {
        // Single file analysis - use selected file
        if (!selectedFileId) {
          alert('Lütfen analiz edilecek bir dosya seçin.');
          setLoading(false);
          return;
        }

        // Find file in all files (including folder files)
        const selectedFile = allFilesForDropdown.find((f) => f.id === selectedFileId) || 
                           files.find((f) => f.id === selectedFileId);
        
        // Skip if selected file is a folder or has invalid ID
        if (!selectedFile || selectedFile.isFolder || !selectedFile.id || selectedFile.id.startsWith('folder-')) {
          alert('Lütfen tek dosya analizi için bir dosya seçin (klasör değil).');
          setLoading(false);
          return;
        }
        
        // Fetch content if needed
        let fileContent = selectedFile.content;
        if (!fileContent && selectedFile.id) {
          // Check if it's a folder ID before making request
          if (selectedFile.id.startsWith('folder-')) {
            alert('Klasör seçilemez. Lütfen tek dosya analizi için bir dosya seçin.');
            setLoading(false);
            return;
          }
          
          try {
            const fullFile = await apiClient.get(`/files/${selectedFile.id}`);
            fileContent = fullFile.data.content || '';
          } catch (error) {
            console.error('Error fetching file content:', error);
            alert('Dosya içeriği alınamadı. Lütfen tekrar deneyin.');
            setLoading(false);
            return;
          }
        }

        const response = await apiClient.post('/error-analysis/analyze', {
          codeContent: fileContent,
          errorMessage,
          programmingLanguage: 'auto',
        });
        setAnalysisResult(response.data.analysis);
      } else if (analysisType === 'multiple' && files.length > 0) {
        // Multiple files analysis - flatten folders and fetch all contents
        const filesData = await flattenFiles(files);
        
        // Filter out empty files
        const validFilesData = filesData.filter(f => f.content && f.content.trim().length > 0);
        
        if (validFilesData.length === 0) {
          alert('Analiz edilecek içeriği olan dosya bulunamadı.');
          setLoading(false);
          return;
        }

        const response = await apiClient.post('/error-analysis/analyze-from-files', {
          errorMessage,
          files: validFilesData,
          language: 'auto',
        });
        setAnalysisResult(response.data.analysis);
      }
    } catch (error) {
      console.error('Error analysis failed:', error);
      alert('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🐛 Hata & Kod Analizi</h2>

      {/* Analysis Type */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Analiz Türü</label>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setAnalysisType('single');
              setSelectedFileId(''); // Reset selection when switching to single
            }}
            className={`px-4 py-2 rounded-lg ${
              analysisType === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Hata Mesajından Analiz
          </button>
          <button
            onClick={() => {
              setAnalysisType('multiple');
              setSelectedFileId(''); // Reset selection when switching to multiple
            }}
            className={`px-4 py-2 rounded-lg ${
              analysisType === 'multiple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Çoklu Dosya Analizi
          </button>
        </div>
      </div>

      {/* File Selection - Show only for single file analysis */}
      {analysisType === 'single' && allFilesForDropdown.length > 0 && (
        <div className="input-group mb-4">
          <label className="block text-sm font-medium mb-2">Dosya Seç</label>
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Dosya seçin...</option>
            {allFilesForDropdown.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {analysisType === 'single' && allFilesForDropdown.length === 0 && files.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Analiz edilecek dosya bulunamadı. Lütfen klasör veya dosya yükleyin.
          </p>
        </div>
      )}

      {/* Multiple Files Info */}
      {analysisType === 'multiple' && files.length > 0 && (
        <div className="input-group mb-4">
          <label className="block text-sm font-medium mb-2">Analiz Edilecek Dosyalar</label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📁 Tüm yüklenen dosyalar ve klasörler analiz edilecek. ({files.filter((f) => !f.isFolder).length} dosya, {files.filter((f) => f.isFolder).length} klasör)
            </p>
          </div>
        </div>
      )}

      {/* Error Message Input */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Hata Mesajı</label>
        <textarea
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          placeholder="Hata mesajınızı buraya yapıştırın (traceback dahil)..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={8}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !errorMessage.trim() || (analysisType === 'single' && (!selectedFileId || allFilesForDropdown.length === 0)) || (analysisType === 'multiple' && files.length === 0)}
        className="action-button disabled:opacity-50 mb-4"
      >
        {loading ? 'Analiz ediliyor...' : '🎯 Hatayı Bul ve Çöz'}
      </button>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="mt-6 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🐛</span>
              Hata Analizi ve Çözüm Raporu
            </h3>
          </div>
          <div className="p-6 custom-scrollbar max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={analysisResult} />
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Bu özelliği kullanmak için lütfen önce dosya yönetimi bölümünden dosya yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
