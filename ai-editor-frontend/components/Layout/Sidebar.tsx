'use client';

import { useState } from 'react';
import { Conversation, FileRecord } from '@/types';

interface SidebarProps {
  conversations: Conversation[];
  files: FileRecord[];
  currentTab: string;
  onTabChange: (tab: 'chat' | 'files' | 'code-tools' | 'error-analysis' | 'software-test') => void;
}

export default function Sidebar({ conversations, files, currentTab, onTabChange }: SidebarProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const tabs = [
    { id: 'chat', label: '💬 Chat', icon: '💬' },
    { id: 'files', label: '📁 Dosya Analizi', icon: '📁' },
    { id: 'code-tools', label: '🔧 Kod Araçları', icon: '🔧' },
    { id: 'error-analysis', label: '🐛 Hata Analizi', icon: '🐛' },
    { id: 'software-test', label: '🧪 Yazılım Testi', icon: '🧪' },
  ];

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">🤖 AI Kod Editörü</h1>
        <p className="text-sm text-gray-400 mt-1">Uzman seviyesinde kod asistanınız</p>
      </div>

      {/* API Key Section */}
      <div className="p-4 border-b border-gray-700">
        <label className="block text-sm font-medium mb-2">Gemini API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API anahtarınızı girin..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setIsConnected(true)}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          🔗 Bağlantıyı Test Et
        </button>
        <div className={`mt-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? '🟢 Bağlı' : '🔴 Bağlı değil'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversations */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Konuşmalar</h3>
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz konuşma yok</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 cursor-pointer"
                >
                  {conv.title}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Files */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Dosyalar</h3>
            {files.length > 0 && (
              <span className="text-xs text-gray-500">
                {files.filter((f) => !f.isFolder).length} dosya
                {files.filter((f) => f.isFolder).length > 0 && `, ${files.filter((f) => f.isFolder).length} klasör`}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz dosya yok</p>
            ) : (
              <>
                {/* Folders */}
                {files.filter((f) => f.isFolder).map((folder) => (
                  <div
                    key={folder.id}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                    title={`${folder.folderName || 'Klasör'} - ${folder.fileCount || 0} dosya`}
                  >
                    <span>📁</span>
                    <span className="truncate flex-1">{folder.name}</span>
                  </div>
                ))}
                {/* Individual Files */}
                {files.filter((f) => !f.isFolder).slice(0, 10).map((file) => (
                  <div
                    key={file.id}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span className="truncate flex-1">{file.name}</span>
                  </div>
                ))}
                {files.filter((f) => !f.isFolder).length > 10 && (
                  <p className="text-xs text-gray-500 px-4 py-2 text-center">
                    +{files.filter((f) => !f.isFolder).length - 10} dosya daha...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
