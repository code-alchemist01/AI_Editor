'use client';

import { useState } from 'react';
import apiClient from '@/lib/api/client';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function CodeToolsTab() {
  const [codeContent, setCodeContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolType, setToolType] = useState<'refactor' | 'architecture'>('refactor');

  const handleRefactor = async () => {
    if (!codeContent.trim()) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/code-tools/refactor', {
        codeContent,
        refactoringType: 'auto',
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Refactor error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchitectureAnalysis = async () => {
    if (!codeContent.trim()) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/code-tools/analyze-architecture', {
        codeContent,
        analysisType: 'full',
        analysisDepth: 'medium',
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Architecture analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🔧 Kod Araçları</h2>

      {/* Tool Selection */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">Araç Seç</label>
        <div className="flex gap-4">
          <button
            onClick={() => setToolType('refactor')}
            className={`px-4 py-2 rounded-lg ${
              toolType === 'refactor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🏗️ Modüler Refactoring
          </button>
          <button
            onClick={() => setToolType('architecture')}
            className={`px-4 py-2 rounded-lg ${
              toolType === 'architecture'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🏛️ Mimari Analiz
          </button>
        </div>
      </div>

      {/* Code Input */}
      <div className="input-group mb-4">
        <label className="block text-sm font-medium mb-2">
          {toolType === 'refactor' ? 'Refactor Edilecek Kod' : 'Analiz Edilecek Kod'}
        </label>
        <textarea
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          placeholder="Kodunuzu buraya yapıştırın..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={15}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={toolType === 'refactor' ? handleRefactor : handleArchitectureAnalysis}
        disabled={loading || !codeContent.trim()}
        className="action-button disabled:opacity-50 mb-4"
      >
        {loading
          ? 'İşleniyor...'
          : toolType === 'refactor'
          ? '🏗️ Modüler Yapıya Dönüştür'
          : '🔍 Mimari Analiz Başlat'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>{toolType === 'refactor' ? '🏗️' : '🏛️'}</span>
              {toolType === 'refactor' ? 'Refactoring Sonucu' : 'Mimari Analiz Sonucu'}
            </h3>
          </div>
          <div className="p-6 custom-scrollbar max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}
    </div>
  );
}
