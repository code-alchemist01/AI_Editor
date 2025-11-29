'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useFileStore } from '@/stores/fileStore';
import { conversationsApi } from '@/lib/api/conversations';
import { filesApi } from '@/lib/api/files';
import { groupFilesByFolder } from '@/lib/utils/groupFilesByFolder';
import Sidebar from '@/components/Layout/Sidebar';
import MainPanel from '@/components/Layout/MainPanel';

export default function Home() {
  const { conversations, setConversations } = useChatStore();
  const { files, setFiles } = useFileStore();
  const [currentTab, setCurrentTab] = useState<'chat' | 'files' | 'code-tools' | 'error-analysis' | 'software-test'>('chat');

  useEffect(() => {
    // Load conversations and files on mount
    const loadData = async () => {
      try {
        const convs = await conversationsApi.getAll();
        setConversations(convs);
        const fileList = await filesApi.getAll();
        // Group files by folder
        const groupedFiles = groupFilesByFolder(fileList);
        setFiles(groupedFiles);
      } catch (error) {
        console.error('Error loading data:', error);
        // Silently fail - API might not be available yet
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        conversations={conversations}
        files={files}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />
      <MainPanel 
        currentTab={currentTab}
      />
    </div>
  );
}
