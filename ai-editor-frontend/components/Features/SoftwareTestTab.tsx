'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import { testApi, ImprovementLoopState, ExecutionResult } from '@/lib/api/test';
import TestExecutionPanel from '@/components/ui/TestExecutionPanel';

export default function SoftwareTestTab() {
  const { files, updateFile } = useFileStore();
  const [testMode, setTestMode] = useState<'manual' | 'auto'>('manual');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [improvedCode, setImprovedCode] = useState<string>('');
  const [improvementExplanation, setImprovementExplanation] = useState<string>('');
  const [loopState, setLoopState] = useState<ImprovementLoopState | null>(null);
  const [loopId, setLoopId] = useState<string | null>(null);
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'run' | 'improve' | 'apply'>('idle');

  // Get all files including folder files for display
  const allFilesForDropdown = useMemo(() => getAllFilesForDropdown(files), [files]);

  // Polling for loop status (auto mode)
  useEffect(() => {
    if (!isLoopRunning || !loopId || testMode !== 'auto') return;

    const interval = setInterval(async () => {
      try {
        const status = await testApi.getLoopStatus(loopId);
        setLoopState(status);

        if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
          setIsLoopRunning(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling loop status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [isLoopRunning, loopId, testMode]);

  // Manual Mode: Run Code
  const handleRunCode = async () => {
    if (!selectedFileId) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setCurrentStep('run');
    try {
      const result = await testApi.runCode(selectedFileId);
      setExecutionResult(result);
      
      // Create loop state for manual mode if it doesn't exist (needed for improve step)
      if (!loopId && !result.success) {
        try {
          const loopResult = await testApi.startImprovementLoop(selectedFileId, 'manual', 10);
          setLoopId(loopResult.loopId);
          // Run code step to populate loop state with error
          await testApi.executeStep(selectedFileId, 'run', loopResult.loopId);
        } catch (loopError) {
          console.error('Loop creation error:', loopError);
          // Continue anyway, we can still improve without loop state
        }
      }
      
      setCurrentStep(result.success ? 'idle' : 'improve');
    } catch (error: any) {
      console.error('Run code error:', error);
      alert(error.response?.data?.error || 'Kod çalıştırma hatası');
      setCurrentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // Manual Mode: Improve Code
  const handleImproveCode = async () => {
    if (!selectedFileId) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    // Check if we have an error from last execution
    if (!executionResult || executionResult.success || !executionResult.error) {
      alert('Önce kodu çalıştırın ve bir hata olsun');
      return;
    }

    setLoading(true);
    setCurrentStep('improve');
    try {
      // Pass error directly in request body for manual mode
      const stepResult = await testApi.executeStep(selectedFileId, 'improve', loopId || undefined, executionResult.error);
      
      if (stepResult.result.improvedCode) {
        setImprovedCode(stepResult.result.improvedCode);
        setImprovementExplanation(stepResult.result.explanation || '');
        setCurrentStep('apply');
      } else {
        alert('Kod iyileştirme başarısız');
        setCurrentStep('improve');
      }
    } catch (error: any) {
      console.error('Improve code error:', error);
      alert(error.response?.data?.error || 'Kod iyileştirme hatası');
      setCurrentStep('improve');
    } finally {
      setLoading(false);
    }
  };

  // Manual Mode: Apply Improved Code
  const handleApplyCode = async () => {
    if (!selectedFileId || !improvedCode) {
      alert('İyileştirilmiş kod bulunamadı');
      return;
    }

    setLoading(true);
    try {
      await filesApi.update(selectedFileId, { content: improvedCode });
      updateFile(selectedFileId, { content: improvedCode });
      
      setImprovedCode('');
      setImprovementExplanation('');
      setExecutionResult(null);
      setCurrentStep('run');
      
      alert('Kod güncellendi. Tekrar test edebilirsiniz.');
    } catch (error: any) {
      console.error('Apply code error:', error);
      alert(error.response?.data?.error || 'Kod güncelleme hatası');
    } finally {
      setLoading(false);
    }
  };

  // Auto Mode: Start Improvement Loop
  const handleStartAutoLoop = async () => {
    if (!selectedFileId) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setIsLoopRunning(true);
    try {
      const result = await testApi.startImprovementLoop(selectedFileId, 'auto', 10);
      setLoopId(result.loopId);
      
      // Initial status fetch
      const status = await testApi.getLoopStatus(result.loopId);
      setLoopState(status);
    } catch (error: any) {
      console.error('Start loop error:', error);
      alert(error.response?.data?.error || 'Döngü başlatma hatası');
      setIsLoopRunning(false);
    } finally {
      setLoading(false);
    }
  };

  // Auto Mode: Stop Loop
  const handleStopLoop = async () => {
    if (!loopId) return;

    try {
      await testApi.stopLoop(loopId);
      setIsLoopRunning(false);
      
      // Refresh status
      const status = await testApi.getLoopStatus(loopId);
      setLoopState(status);
    } catch (error: any) {
      console.error('Stop loop error:', error);
      alert(error.response?.data?.error || 'Döngü durdurma hatası');
    }
  };

  // Download improved code
  const handleDownloadCode = () => {
    let codeToDownload = '';
    let fileName = 'improved_code.py';

    if (testMode === 'manual' && improvedCode) {
      codeToDownload = improvedCode;
      if (selectedFile) {
        fileName = `improved_${selectedFile.name}`;
      }
    } else if (testMode === 'auto' && loopState?.currentCode) {
      codeToDownload = loopState.currentCode;
      if (selectedFile) {
        fileName = `improved_${selectedFile.name}`;
      }
    } else if (selectedFile?.content) {
      codeToDownload = selectedFile.content;
      fileName = selectedFile.name;
    }

    if (!codeToDownload) {
      alert('İndirilecek kod bulunamadı');
      return;
    }

    // Create blob and download
    const blob = new Blob([codeToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset state when mode changes
  useEffect(() => {
    setExecutionResult(null);
    setImprovedCode('');
    setImprovementExplanation('');
    setLoopState(null);
    setLoopId(null);
    setIsLoopRunning(false);
    setCurrentStep('idle');
  }, [testMode]);

  const selectedFile = files.find((f) => f.id === selectedFileId) ||
                      allFilesForDropdown.find((f) => f.id === selectedFileId);
  
  // Check if there's code to download
  const hasCodeToDownload = 
    (testMode === 'manual' && improvedCode) || 
    (testMode === 'auto' && loopState?.currentCode) ||
    selectedFile?.content;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🧪 Yazılım Testi</h2>

      {/* Test Mode Selection */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Test Modu</label>
        <div className="flex gap-4">
          <button
            onClick={() => setTestMode('manual')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              testMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔵 Manuel Test
          </button>
          <button
            onClick={() => setTestMode('auto')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              testMode === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🟢 Otomatik Test
          </button>
        </div>
      </div>

      {/* File Selection */}
      {allFilesForDropdown.length > 0 && (
        <div className="mb-4">
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

      {/* Manual Mode Controls */}
      {testMode === 'manual' && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunCode}
              disabled={loading || !selectedFileId || currentStep === 'improve' || currentStep === 'apply'}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && currentStep === 'run' ? '⏳ Çalıştırılıyor...' : '▶️ Kodu Çalıştır'}
            </button>

            {executionResult && !executionResult.success && (
              <button
                onClick={handleImproveCode}
                disabled={loading || currentStep === 'run' || currentStep === 'apply'}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && currentStep === 'improve' ? '⏳ İyileştiriliyor...' : '🔧 İyileştir'}
              </button>
            )}

            {improvedCode && (
              <>
                <button
                  onClick={handleApplyCode}
                  disabled={loading || currentStep === 'run' || currentStep === 'improve'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Uygulanıyor...' : '✅ Düzeltmeyi Uygula'}
                </button>
                <button
                  onClick={handleDownloadCode}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  💾 İndir
                </button>
              </>
            )}

            {executionResult && executionResult.success && (
              <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium flex items-center gap-2">
                ✅ Kod başarıyla çalıştı!
              </div>
            )}
          </div>

          {/* Improved Code Preview */}
          {improvedCode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">İyileştirilmiş Kod:</h4>
              {improvementExplanation && (
                <div className="mb-3 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                  {improvementExplanation}
                </div>
              )}
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm max-h-64 overflow-y-auto">
                {improvedCode}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Auto Mode Controls */}
      {testMode === 'auto' && (
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap">
            {!isLoopRunning ? (
              <button
                onClick={handleStartAutoLoop}
                disabled={loading || !selectedFileId}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '⏳ Başlatılıyor...' : '🚀 Başlat'}
              </button>
            ) : (
              <button
                onClick={handleStopLoop}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⏹️ Durdur
              </button>
            )}
            {hasCodeToDownload && (
              <button
                onClick={handleDownloadCode}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                💾 İyileştirilmiş Kodu İndir
              </button>
            )}
          </div>
        </div>
      )}

      {/* Test Execution Panel */}
      <TestExecutionPanel
        loopState={loopState}
        output={executionResult?.output || loopState?.history[loopState.history.length - 1]?.output}
        error={executionResult?.error || loopState?.lastError || loopState?.history[loopState.history.length - 1]?.error}
        isRunning={isLoopRunning}
        onStop={handleStopLoop}
      />

      {/* No Files Warning */}
      {allFilesForDropdown.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Test edilecek dosya bulunamadı! Lütfen önce dosya yönetimi bölümünden dosya yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
