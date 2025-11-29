'use client';

import { useState, useRef, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function ProjectGenerationTab() {
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('web');
  const [techStack, setTechStack] = useState('');
  const [projectScale, setProjectScale] = useState('medium');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const resultEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll when result changes
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

  const handleGenerate = async () => {
    if (!projectDescription.trim()) return;

      setLoading(true);
      setResult('');
      try {
        const response = await apiClient.post('/projects/generate-structure', {
          projectDescription,
          projectType,
          techStack: techStack || undefined,
          projectScale,
        });
        
        // Clean up the result - extract only the tree structure
        let cleanResult = response.data.structure || '';
        
        // Remove any text before code block
        const codeBlockMatch = cleanResult.match(/```[\s\S]*?```/);
        if (codeBlockMatch) {
          cleanResult = codeBlockMatch[0].replace(/```/g, '').trim();
        } else {
          // Extract lines that look like tree structure
          const lines = cleanResult.split('\n');
          const treeLines: string[] = [];
          for (const line of lines) {
            // Keep lines with tree characters or simple file/folder paths
            if (line.match(/[├└│]/) || line.trim().match(/^[\w\-\.\/]+\/?$/)) {
              treeLines.push(line);
            }
          }
          if (treeLines.length > 0) {
            cleanResult = treeLines.join('\n');
          }
        }
        
        // Wrap in code block for proper display
        if (cleanResult && !cleanResult.startsWith('```')) {
          cleanResult = '```\n' + cleanResult + '\n```';
        }
        
        setResult(cleanResult);
    } catch (error: any) {
      console.error('Project generation error:', error);
      alert(error.response?.data?.error || 'Proje üretimi hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          🚀 Proje Üretimi
        </h2>
        <p className="text-gray-600 mt-1">Yeni projeniz için otomatik klasör yapısı oluşturun</p>
      </div>

      {/* Project Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Proje Tipi</label>
        <select
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="web">Web Uygulaması</option>
          <option value="mobile">Mobil Uygulama</option>
          <option value="api">API Servisi</option>
          <option value="desktop">Masaüstü Uygulaması</option>
          <option value="library">Kütüphane</option>
          <option value="cli">CLI Tool</option>
        </select>
      </div>

      {/* Tech Stack */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Teknoloji Stack (Opsiyonel)</label>
        <input
          type="text"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="örnek: React, Node.js, PostgreSQL"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Project Scale */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Proje Ölçeği</label>
        <select
          value={projectScale}
          onChange={(e) => setProjectScale(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Küçük</option>
          <option value="medium">Orta</option>
          <option value="large">Büyük</option>
        </select>
      </div>

      {/* Project Description */}
      <div className="flex-1 flex flex-col mb-4">
        <label className="block text-sm font-medium mb-2">Proje Açıklaması</label>
        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Projenizin ne yaptığını, ana özelliklerini ve gereksinimlerini açıklayın..."
          className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={8}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !projectDescription.trim()}
        className="action-button disabled:opacity-50 disabled:cursor-not-allowed mb-4 bg-orange-600 hover:bg-orange-700"
      >
        {loading ? '⏳ Proje yapısı oluşturuluyor...' : '🚀 Proje Yapısı Oluştur'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="bg-gradient-to-r from-orange-600 to-pink-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🚀</span>
              Proje Yapısı
            </h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto font-mono text-sm">
              <pre className="whitespace-pre-wrap m-0">{result.replace(/```/g, '').trim()}</pre>
            </div>
            <div ref={resultEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

