'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { filesApi } from '@/lib/api/files';
import { getAllFilesForDropdown } from '@/lib/utils/getAllFilesForDropdown';
import { apiTestApi, ApiTestResult, ImprovementLoopState } from '@/lib/api/apiTest';
import TestExecutionPanel from '@/components/ui/TestExecutionPanel';

export default function DocumentationTab() {
  const { files, updateFile } = useFileStore();
  const [testMode, setTestMode] = useState<'manual' | 'auto'>('manual');
  const [testFramework, setTestFramework] = useState<'jest' | 'swagger'>('jest');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [swaggerSpec, setSwaggerSpec] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [improvedCode, setImprovedCode] = useState<string>('');
  const [improvementExplanation, setImprovementExplanation] = useState<string>('');
  const [loopState, setLoopState] = useState<ImprovementLoopState | null>(null);
  const [loopId, setLoopId] = useState<string | null>(null);
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'swagger' | 'tests' | 'run' | 'improve' | 'apply'>('idle');

  const allFilesForDropdown = useMemo(() => getAllFilesForDropdown(files), [files]);

  // Polling for loop status (auto mode)
  useEffect(() => {
    if (!isLoopRunning || !loopId || testMode !== 'auto') return;

    const interval = setInterval(async () => {
      try {
        const status = await apiTestApi.getApiLoopStatus(loopId);
        setLoopState(status);

        if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
          setIsLoopRunning(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling loop status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoopRunning, loopId, testMode]);

  // Manual Mode: Generate Swagger
  const handleGenerateSwagger = async () => {
    if (!selectedFileId) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setCurrentStep('swagger');
    try {
      const result = await apiTestApi.generateSwagger(selectedFileId);
      if (result.success) {
        setSwaggerSpec(result.swaggerSpec);
        setCurrentStep('tests');
      } else {
        alert('Swagger spec oluşturma başarısız');
        setCurrentStep('idle');
      }
    } catch (error: any) {
      console.error('Generate swagger error:', error);
      alert(error.response?.data?.error || 'Swagger spec oluşturma hatası');
      setCurrentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // Manual Mode: Generate Tests
  const handleGenerateTests = async () => {
    if (!selectedFileId) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setCurrentStep('tests');
    try {
      const result = await apiTestApi.generateApiTests(
        selectedFileId,
        undefined,
        undefined,
        swaggerSpec || undefined,
        testFramework
      );
      if (result.success) {
        setTestCode(result.testCode);
        if (result.swaggerSpec && !swaggerSpec) {
          setSwaggerSpec(result.swaggerSpec);
        }
        setCurrentStep('run');
      } else {
        alert('Test oluşturma başarısız');
        setCurrentStep('tests');
      }
    } catch (error: any) {
      console.error('Generate tests error:', error);
      alert(error.response?.data?.error || 'Test oluşturma hatası');
      setCurrentStep('tests');
    } finally {
      setLoading(false);
    }
  };

  // Manual Mode: Run Tests
  const handleRunTests = async () => {
    if (!selectedFileId || !testCode) {
      alert('Önce test kodunu oluşturun');
      return;
    }

    setLoading(true);
    setCurrentStep('run');
    try {
      const file = files.find((f) => f.id === selectedFileId) ||
                   allFilesForDropdown.find((f) => f.id === selectedFileId);
      
      const result = await apiTestApi.runApiTests(
        selectedFileId,
        testCode,
        file?.language,
        file?.content,
        testFramework
      );
      
      setTestResult(result);
      setCurrentStep(result.success ? 'idle' : 'improve');

      // Create loop state for manual mode if needed
      if (!result.success && !loopId) {
        try {
          const loopResult = await apiTestApi.startApiImprovementLoop(selectedFileId, 'manual', 10, testFramework);
          setLoopId(loopResult.loopId);
        } catch (loopError) {
          console.error('Loop creation error:', loopError);
        }
      }
    } catch (error: any) {
      console.error('Run tests error:', error);
      alert(error.response?.data?.error || 'Test çalıştırma hatası');
      setCurrentStep('run');
    } finally {
      setLoading(false);
    }
  };

  // Manual Mode: Improve Code
  const handleImproveCode = async () => {
    if (!selectedFileId || !testResult?.error) {
      alert('Önce testleri çalıştırın ve bir hata olsun');
      return;
    }

    setLoading(true);
    setCurrentStep('improve');
    try {
      const stepResult = await apiTestApi.executeApiStep(
        selectedFileId,
        'improve',
        loopId || undefined,
        testFramework,
        undefined,
        undefined,
        undefined,
        testResult.error
      );

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
      setTestResult(null);
      setSwaggerSpec('');
      setTestCode('');
      setCurrentStep('swagger');
      
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
      const result = await apiTestApi.startApiImprovementLoop(selectedFileId, 'auto', 10, testFramework);
      setLoopId(result.loopId);
      
      const status = await apiTestApi.getApiLoopStatus(result.loopId);
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
      await apiTestApi.stopApiLoop(loopId);
      setIsLoopRunning(false);
      
      const status = await apiTestApi.getApiLoopStatus(loopId);
      setLoopState(status);
    } catch (error: any) {
      console.error('Stop loop error:', error);
      alert(error.response?.data?.error || 'Döngü durdurma hatası');
    }
  };

  // Download code
  const handleDownloadCode = () => {
    let codeToDownload = '';
    let fileName = 'improved_api.js';

    if (testMode === 'manual' && improvedCode) {
      codeToDownload = improvedCode;
      const selectedFile = files.find((f) => f.id === selectedFileId) ||
                          allFilesForDropdown.find((f) => f.id === selectedFileId);
      if (selectedFile) {
        fileName = `improved_${selectedFile.name}`;
      }
    } else if (testMode === 'auto' && loopState?.currentCode) {
      codeToDownload = loopState.currentCode;
      const selectedFile = files.find((f) => f.id === selectedFileId) ||
                          allFilesForDropdown.find((f) => f.id === selectedFileId);
      if (selectedFile) {
        fileName = `improved_${selectedFile.name}`;
      }
    } else {
      const selectedFile = files.find((f) => f.id === selectedFileId) ||
                          allFilesForDropdown.find((f) => f.id === selectedFileId);
      if (selectedFile?.content) {
        codeToDownload = selectedFile.content;
        fileName = selectedFile.name;
      }
    }

    if (!codeToDownload) {
      alert('İndirilecek kod bulunamadı');
      return;
    }

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
    setSwaggerSpec('');
    setTestCode('');
    setTestResult(null);
    setImprovedCode('');
    setImprovementExplanation('');
    setLoopState(null);
    setLoopId(null);
    setIsLoopRunning(false);
    setCurrentStep('idle');
  }, [testMode]);

  const selectedFile = files.find((f) => f.id === selectedFileId) ||
                      allFilesForDropdown.find((f) => f.id === selectedFileId);
  
  const hasCodeToDownload = 
    (testMode === 'manual' && improvedCode) || 
    (testMode === 'auto' && loopState?.currentCode) ||
    selectedFile?.content;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🔌 API Test ve Dokümantasyon</h2>

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

      {/* Test Framework Selection */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Test Framework</label>
        <div className="flex gap-4">
          <button
            onClick={() => setTestFramework('jest')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              testFramework === 'jest'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🟢 Jest + Supertest
          </button>
          <button
            onClick={() => setTestFramework('swagger')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              testFramework === 'swagger'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Swagger Validator
          </button>
        </div>
      </div>

      {/* File Selection */}
      {allFilesForDropdown.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">API Dosyası Seç</label>
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
              onClick={handleGenerateSwagger}
              disabled={loading || !selectedFileId || currentStep === 'tests' || currentStep === 'run' || currentStep === 'improve' || currentStep === 'apply'}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && currentStep === 'swagger' ? '⏳ Oluşturuluyor...' : '📋 Swagger Spec Oluştur'}
            </button>

            {swaggerSpec && (
              <button
                onClick={handleGenerateTests}
                disabled={loading || currentStep === 'swagger' || currentStep === 'run' || currentStep === 'improve' || currentStep === 'apply'}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && currentStep === 'tests' ? '⏳ Oluşturuluyor...' : '🧪 Test Oluştur'}
              </button>
            )}

            {testCode && (
              <button
                onClick={handleRunTests}
                disabled={loading || currentStep === 'swagger' || currentStep === 'tests' || currentStep === 'improve' || currentStep === 'apply'}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && currentStep === 'run' ? '⏳ Çalıştırılıyor...' : '▶️ Testleri Çalıştır'}
              </button>
            )}

            {testResult && !testResult.success && (
              <button
                onClick={handleImproveCode}
                disabled={loading || currentStep === 'swagger' || currentStep === 'tests' || currentStep === 'run' || currentStep === 'apply'}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && currentStep === 'improve' ? '⏳ İyileştiriliyor...' : '🔧 İyileştir'}
              </button>
            )}

            {improvedCode && (
              <>
                <button
                  onClick={handleApplyCode}
                  disabled={loading || currentStep === 'swagger' || currentStep === 'tests' || currentStep === 'run' || currentStep === 'improve'}
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

            {testResult && testResult.success && (
              <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium flex items-center gap-2">
                ✅ Tüm testler başarılı!
              </div>
            )}
          </div>

          {/* Swagger Spec Preview */}
          {swaggerSpec && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-800 mb-2">Swagger/OpenAPI Spec:</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs max-h-64 overflow-y-auto">
                {swaggerSpec}
              </pre>
            </div>
          )}

          {/* Test Code Preview */}
          {testCode && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-2">Test Kodu:</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs max-h-64 overflow-y-auto">
                {testCode.substring(0, 2000)}
                {testCode.length > 2000 && '...'}
              </pre>
            </div>
          )}

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
        output={testResult?.output || loopState?.history[loopState.history.length - 1]?.output}
        error={testResult?.error || loopState?.lastError || loopState?.history[loopState.history.length - 1]?.error}
        isRunning={isLoopRunning}
        onStop={handleStopLoop}
      />

      {/* No Files Warning */}
      {allFilesForDropdown.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Test edilecek API dosyası bulunamadı! Lütfen önce dosya yönetimi bölümünden dosya yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
