'use client';

import { useState, useRef } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { FileRecord } from '@/types';

export default function FileAnalysisTab() {
  const { files, addFile, removeFile, setFiles } = useFileStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadingFolder, setUploadingFolder] = useState(false);
  const [folderUploadProgress, setFolderUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    // Single file upload
    if (uploadedFiles.length === 1) {
      const file = uploadedFiles[0];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        alert('Dosya okuma hatası. Lütfen tekrar deneyin.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const fileRecord = await filesApi.upload({
            name: file.name,
            content,
          });
          addFile(fileRecord);
          alert(`✅ ${file.name} başarıyla yüklendi!`);
        } catch (error: any) {
          console.error('File upload error:', error);
          alert(error.response?.data?.error || 'Dosya yükleme hatası. Lütfen tekrar deneyin.');
        }
      };
      reader.readAsText(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const folderName = uploadedFiles[0].webkitRelativePath.split('/')[0] || 'Klasör';
    
    // Filter only text-based files (code files, etc.)
    const textFiles = Array.from(uploadedFiles).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'txt', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext || '');
    });

    if (textFiles.length === 0) {
      alert('Klasörde yüklenebilir dosya bulunamadı.');
      return;
    }

    setUploadingFolder(true);
    setFolderUploadProgress({ current: 0, total: textFiles.length });
    const fileRecords: FileRecord[] = [];

    try {
      // Load all files sequentially to show progress
      for (let i = 0; i < textFiles.length; i++) {
        const file = textFiles[i];
        const fileRecord = await new Promise<FileRecord | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
              // Add folder metadata to file
              const uploadedFile = await filesApi.upload({
                name: file.name,
                content,
                metadata: {
                  folderName: folderName,
                  isFolderFile: true,
                }
              });
              resolve(uploadedFile);
            } catch (error) {
              console.error('File upload error:', error);
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsText(file);
        });
        
        if (fileRecord) {
          fileRecords.push(fileRecord);
        }
        setFolderUploadProgress({ current: i + 1, total: textFiles.length });
      }
      
      const successfulUploads = fileRecords;
      
      if (successfulUploads.length > 0) {
        // Create folder record
        const folderRecord: FileRecord = {
          id: `folder-${Date.now()}`,
          name: `${folderName} (${successfulUploads.length} dosya)`,
          isFolder: true,
          folderName: folderName,
          fileCount: successfulUploads.length,
          folderFiles: successfulUploads,
          createdAt: new Date(),
        };
        addFile(folderRecord);
      }
    } catch (error) {
      console.error('Folder upload error:', error);
      alert('Klasör yüklenirken bir hata oluştu.');
    } finally {
      setUploadingFolder(false);
      setFolderUploadProgress({ current: 0, total: 0 });
    }

    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

    try {
      const file = files.find((f) => f.id === fileId);
      
      if (file?.isFolder && file.folderName) {
        // Delete all files in folder - find files by metadata
        const allFiles = await filesApi.getAll();
        const folderFiles = allFiles.filter((f: any) => {
          const metadata = f.metadata || {};
          return metadata.folderName === file.folderName && metadata.isFolderFile;
        });
        
        for (const folderFile of folderFiles) {
          if (folderFile.id) {
            try {
              await filesApi.delete(folderFile.id);
            } catch (error) {
              console.error(`Error deleting folder file ${folderFile.id}:`, error);
            }
          }
        }
        
        // Also delete folderFiles from memory if they exist
        if (file.folderFiles) {
          for (const folderFile of file.folderFiles) {
            if (folderFile.id) {
              try {
                await filesApi.delete(folderFile.id);
              } catch (error) {
                // Ignore errors - file might already be deleted
              }
            }
          }
        }
      } else if (fileId) {
        await filesApi.delete(fileId);
      }
      removeFile(fileId);
      
      // Clear selection if deleted file was selected
      if (selectedFile === fileId) {
        setSelectedFile(null);
        setAnalysisResult('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Dosya silinirken bir hata oluştu.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const file = files.find((f) => f.id === selectedFile);
    if (!file) return;

    // If folder selected, analyze all files in folder
    if (file.isFolder && file.folderFiles) {
      setLoading(true);
      try {
        // Fetch content for all files in folder from backend
        const filesData = await Promise.all(
          file.folderFiles.map(async (f) => {
            // Skip folder IDs - only process actual file IDs
            if (f.id && !f.id.startsWith('folder-')) {
              try {
                const fullFile = await filesApi.getById(f.id);
                const content = fullFile.content || '';
                if (content.trim().length === 0) {
                  console.warn(`File ${f.name} has no content`);
                  return null;
                }
                return {
                  name: fullFile.name,
                  content: content,
                };
              } catch (error) {
                console.error(`Error fetching file ${f.id}:`, error);
                if (f.content && f.content.trim().length > 0) {
                  return {
                    name: f.name,
                    content: f.content,
                  };
                }
                return null;
              }
            } else if (f.content && f.content.trim().length > 0) {
              // If no ID but has content, use it directly
              return {
                name: f.name,
                content: f.content,
              };
            }
            return null;
          })
        );
        
        // Filter out null values (files without content)
        const validFilesData = filesData.filter((f): f is { name: string; content: string } => f !== null);
        
        if (validFilesData.length === 0) {
          alert('Klasörde analiz edilebilir içeriği olan dosya bulunamadı.');
          return;
        }
        
        const result = await filesApi.analyzeMultiple(
          validFilesData,
          'Orta (Detaylı Analiz)',
          'Tüm Hata Türleri'
        );
        setAnalysisResult(result.analysis);
      } catch (error) {
        console.error('Analysis error:', error);
        alert('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single file analysis
    if (!file.content) return;

    setLoading(true);
    try {
      const result = await filesApi.analyzeSingle(file.content, file.name);
      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate folders and individual files
  const folders = files.filter((f) => f.isFolder);
  const individualFiles = files.filter((f) => !f.isFolder);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">📁 Dosya Analizi</h2>

      {/* Upload Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Single File Upload */}
        <div className="input-group">
          <label className="block text-sm font-medium mb-2">📄 Tek Dosya Yükle</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.js,.ts,.tsx,.jsx,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.sql,.json,.yaml,.yml,.md,.txt,.vue"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Folder Upload */}
        <div className="input-group">
          <label className="block text-sm font-medium mb-2">📁 Klasör Yükle</label>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderUpload}
            disabled={uploadingFolder}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploadingFolder && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Yükleniyor...</span>
                <span>{folderUploadProgress.current} / {folderUploadProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(folderUploadProgress.current / folderUploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Files List */}
      {(files.length > 0) && (
        <div className="input-group mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Yüklenen Dosyalar ve Klasörler</label>
            {files.length > 0 && (
              <button
                onClick={async () => {
                  if (confirm('Tüm dosya ve klasörleri silmek istediğinize emin misiniz?')) {
                    setLoading(true);
                    try {
                      // Delete all files first
                      for (const file of files) {
                        if (file.id) {
                          try {
                            const fileToDelete = files.find((f) => f.id === file.id);
                            if (fileToDelete?.isFolder && fileToDelete.folderFiles) {
                              // Delete all files in folder
                              for (const folderFile of fileToDelete.folderFiles) {
                                if (folderFile.id) {
                                  await filesApi.delete(folderFile.id);
                                }
                              }
                            } else if (file.id) {
                              await filesApi.delete(file.id);
                            }
                            removeFile(file.id);
                          } catch (error) {
                            console.error(`Error deleting file ${file.id}:`, error);
                          }
                        }
                      }
                      setSelectedFile(null);
                      setAnalysisResult('');
                      setFiles([]);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                🗑️ Tümünü Temizle
              </button>
            )}
          </div>
          
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Klasörler</h4>
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedFile === folder.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">📁</span>
                      <span className="font-medium text-gray-800">{folder.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(folder.id || null)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Seç
                    </button>
                    <button
                      onClick={() => folder.id && handleDeleteFile(folder.id)}
                      className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Files */}
          {individualFiles.length > 0 && (
            <div>
              {folders.length > 0 && (
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Dosyalar</h4>
              )}
              <div className="space-y-2">
                {individualFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedFile === file.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl">📄</span>
                      <span className="font-medium text-gray-800 truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(file.id || null)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Seç
                    </button>
                    <button
                      onClick={() => file.id && handleDeleteFile(file.id)}
                      className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyze Button */}
      {selectedFile && (
        <div className="mb-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="action-button disabled:opacity-50"
          >
            {loading ? 'Analiz ediliyor...' : (() => {
              const file = files.find((f) => f.id === selectedFile);
              return file?.isFolder ? '🔍 Klasörü Analiz Et' : '🔍 Dosyayı Analiz Et';
            })()}
          </button>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div className="mt-6 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📊</span>
              Analiz Sonucu
            </h3>
          </div>
          <div className="p-6 custom-scrollbar max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={analysisResult} />
          </div>
        </div>
      )}
    </div>
  );
}
