'use client';

import { useState, useEffect, useRef } from 'react';
import { ImprovementLoopState } from '@/lib/api/test';

interface TestExecutionPanelProps {
  loopState?: ImprovementLoopState | null;
  output?: string;
  error?: string;
  isRunning?: boolean;
  onStop?: () => void;
}

export default function TestExecutionPanel({
  loopState,
  output = '',
  error = '',
  isRunning = false,
  onStop,
}: TestExecutionPanelProps) {
  const outputEndRef = useRef<HTMLDivElement>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set());
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousHistoryLength = useRef(0);

  // Check if user is at bottom of container
  const isAtBottom = (container: HTMLElement | null): boolean => {
    if (!container) return true;
    const threshold = 100; // 100px threshold
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Handle scroll events - if user scrolls up, disable auto-scroll
  useEffect(() => {
    const outputContainer = outputContainerRef.current;
    const historyContainer = historyContainerRef.current;

    const handleOutputScroll = () => {
      if (outputContainer && !isAtBottom(outputContainer)) {
        setShouldAutoScroll(false);
      }
    };

    const handleHistoryScroll = () => {
      if (historyContainer && !isAtBottom(historyContainer)) {
        setShouldAutoScroll(false);
      }
    };

    if (outputContainer) {
      outputContainer.addEventListener('scroll', handleOutputScroll);
    }
    if (historyContainer) {
      historyContainer.addEventListener('scroll', handleHistoryScroll);
    }

    return () => {
      if (outputContainer) {
        outputContainer.removeEventListener('scroll', handleOutputScroll);
      }
      if (historyContainer) {
        historyContainer.removeEventListener('scroll', handleHistoryScroll);
      }
    };
  }, []);

  // Auto-scroll only if user is at bottom and new content is added
  useEffect(() => {
    const historyLength = loopState?.history.length || 0;
    const isNewIteration = historyLength > previousHistoryLength.current;
    
    if (isNewIteration) {
      previousHistoryLength.current = historyLength;
      // Re-enable auto-scroll if new iteration added
      setShouldAutoScroll(true);
    }

    // Only auto-scroll if user is at bottom or new iteration was added
    if (shouldAutoScroll && (isNewIteration || isAtBottom(outputContainerRef.current) || isAtBottom(historyContainerRef.current))) {
      setTimeout(() => {
        if (outputEndRef.current) {
          outputEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        // Also scroll history container if it exists
        if (historyContainerRef.current && isNewIteration) {
          historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [output, error, loopState?.history, shouldAutoScroll]);

  const toggleHistoryItem = (iteration: number) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(iteration)) {
      newExpanded.delete(iteration);
    } else {
      newExpanded.add(iteration);
    }
    setExpandedHistory(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'stopped':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'running':
        return 'Çalışıyor';
      case 'stopped':
        return 'Durduruldu';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bilinmiyor';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>⚙️</span>
              Test Çalıştırma Paneli
            </h3>
            {loopState && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(loopState.status)}`}>
                  {getStatusText(loopState.status)}
                </span>
                <span className="text-blue-100">
                  İterasyon: {loopState.iteration} / {loopState.maxIterations}
                </span>
                {loopState.mode === 'auto' && (
                  <span className="text-blue-100">Mod: Otomatik</span>
                )}
                {loopState.mode === 'manual' && (
                  <span className="text-blue-100">Mod: Manuel</span>
                )}
              </div>
            )}
          </div>
          {isRunning && onStop && (
            <button
              onClick={onStop}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
            >
              Durdur
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {loopState && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">İlerleme</span>
            <span className="text-sm text-gray-600">
              {Math.min(Math.round((loopState.iteration / loopState.maxIterations) * 100), 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                loopState.status === 'completed'
                  ? 'bg-green-500'
                  : loopState.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{
                width: `${Math.min((loopState.iteration / loopState.maxIterations) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Output Section */}
      <div className="p-6">
        {/* Current Output */}
        {(output || error) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Terminal Çıktısı</h4>
            <div 
              ref={outputContainerRef}
              className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar"
            >
              {output && (
                <div className="whitespace-pre-wrap break-words">{output}</div>
              )}
              {error && (
                <div className="text-red-400 whitespace-pre-wrap break-words mt-2">
                  {error}
                </div>
              )}
              <div ref={outputEndRef} />
            </div>
          </div>
        )}

        {/* History */}
        {loopState && loopState.history.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">İterasyon Geçmişi</h4>
            <div 
              ref={historyContainerRef}
              className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2"
            >
              {loopState.history.map((item, index) => {
                const isExpanded = expandedHistory.has(item.iteration);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleHistoryItem(item.iteration)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            item.success
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.iteration}
                        </span>
                        <div className="text-left">
                          <div className="font-medium text-gray-800">
                            İterasyon {item.iteration}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.success ? '✅ Başarılı' : '❌ Hata'}
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        {item.error && (
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-red-700 mb-1">Hata:</div>
                            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800 font-mono whitespace-pre-wrap break-words">
                              {item.error}
                            </div>
                          </div>
                        )}
                        {item.output && (
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Çıktı:</div>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                              {item.output}
                            </div>
                          </div>
                        )}
                        {item.code && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Kod:</div>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-800 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                              {item.code.substring(0, 500)}
                              {item.code.length > 500 && '...'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!output && !error && (!loopState || loopState.history.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⚙️</div>
            <p>Henüz çalıştırma yapılmadı</p>
            <p className="text-sm mt-1">Test başlatıldığında sonuçlar burada görünecek</p>
          </div>
        )}
      </div>
    </div>
  );
}

