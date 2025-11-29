'use client';

import { useState, useMemo } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import { flattenFiles } from '@/lib/utils/flattenFiles';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function SoftwareTestTab() {
  const { files } = useFileStore();
  const [testMode, setTestMode] = useState<'manual' | 'auto'>('manual');
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [analyzeAll, setAnalyzeAll] = useState<boolean>(true);
  
  // Get all files including folder files for display
  const allFilesForDropdown = useMemo(() => getAllFilesForDropdown(files), [files]);

  const handleErrorPreview = async () => {
    if (files.length === 0) return;

    setLoading(true);
    try {
      // Determine which files to analyze
      let filesToAnalyze = files;
      
      if (!analyzeAll && selectedFileIds.length > 0) {
        // Analyze only selected files - find files by ID (including folder files)
        const selectedFiles: any[] = [];
        for (const file of files) {
          if (file.isFolder && file.folderFiles) {
            // Check if folder is selected or any of its files are selected
            const folderSelected = selectedFileIds.includes(file.id || '');
            if (folderSelected) {
              selectedFiles.push(file); // Add entire folder
            } else {
              // Check individual folder files
              const selectedFolderFiles = file.folderFiles.filter((f) => 
                f.id && selectedFileIds.includes(f.id)
              );
              if (selectedFolderFiles.length > 0) {
                // Create a virtual folder with only selected files
                selectedFiles.push({
                  ...file,
                  folderFiles: selectedFolderFiles,
                });
              }
            }
          } else if (selectedFileIds.includes(file.id || '')) {
            selectedFiles.push(file);
          }
        }
        filesToAnalyze = selectedFiles;
      }

      // Flatten selected files (including folder contents) and fetch their contents
      const filesData = await flattenFiles(filesToAnalyze);

      if (filesData.length === 0) {
        alert('Analiz edilecek içeriği olan dosya bulunamadı. Lütfen dosyaların içeriğinin yüklü ve boş olmadığından emin olun.');
        setLoading(false);
        return;
      }

      // Filter out empty files just to be safe
      const validFilesData = filesData.filter(f => f.content && f.content.trim().length > 0);
      
      if (validFilesData.length === 0) {
        alert('Analiz edilecek içeriği olan dosya bulunamadı.');
        setLoading(false);
        return;
      }

      const result = await filesApi.analyzeMultiple(
        validFilesData,
        'Orta (Detaylı Analiz)',
        'Tüm Hata Türleri'
      );
      setTestResult(result.analysis);
    } catch (error) {
      console.error('Test error:', error);
      alert('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🧪 Yazılım Testi</h2>

      {/* Test Mode Selection */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Test Modu</label>
        <div className="flex gap-4">
          <button
            onClick={() => setTestMode('manual')}
            className={`px-6 py-3 rounded-lg font-medium ${
              testMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🔵 Manuel Test
          </button>
          <button
            onClick={() => setTestMode('auto')}
            className={`px-6 py-3 rounded-lg font-medium ${
              testMode === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🟢 Otomatik Test
          </button>
        </div>
      </div>

      {/* File Selection */}
      {files.length > 0 && (
        <div className="input-group mb-4">
          <div className="flex items-center gap-4 mb-2">
            <label className="block text-sm font-medium">Dosya/Klasör Seçimi</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analyzeAll}
                onChange={(e) => {
                  setAnalyzeAll(e.target.checked);
                  if (e.target.checked) {
                    setSelectedFileIds([]);
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Tüm dosyaları analiz et</span>
            </label>
          </div>
          
          {!analyzeAll && (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar border border-gray-300 rounded-lg p-3">
              {/* All Files (including folder files) */}
              {allFilesForDropdown.length > 0 ? (
                <div>
                  {allFilesForDropdown.map((file) => (
                    <label key={file.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(file.id || '')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFileIds([...selectedFileIds, file.id || '']);
                          } else {
                            setSelectedFileIds(selectedFileIds.filter((id) => id !== file.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{file.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Henüz dosya yok</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Preview Button */}
      <div className="mb-4">
        <button
          onClick={handleErrorPreview}
          disabled={loading || files.length === 0 || (!analyzeAll && selectedFileIds.length === 0)}
          className="action-button disabled:opacity-50"
        >
          {loading ? 'Test ediliyor...' : analyzeAll ? '🔍 Tüm Dosyaları Analiz Et ve Hata Önizlemesi Oluştur' : `🔍 Seçili Dosyaları Analiz Et (${selectedFileIds.length})`}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="mt-6 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📊</span>
              Kapsamlı Hata Önizleme Raporu
            </h3>
          </div>
          <div className="p-6 custom-scrollbar max-h-[700px] overflow-y-auto">
            <MarkdownRenderer content={testResult} />
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Test edilecek dosya bulunamadı! Lütfen önce dosya yönetimi bölümünden dosya yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
