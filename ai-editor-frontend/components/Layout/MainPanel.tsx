'use client';

import ChatTab from '@/components/Features/ChatTab';
import FileAnalysisTab from '@/components/Features/FileAnalysisTab';
import CodeToolsTab from '@/components/Features/CodeToolsTab';
import ErrorAnalysisTab from '@/components/Features/ErrorAnalysisTab';
import SoftwareTestTab from '@/components/Features/SoftwareTestTab';

interface MainPanelProps {
  currentTab: 'chat' | 'files' | 'code-tools' | 'error-analysis' | 'software-test';
}

export default function MainPanel({ currentTab }: MainPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {currentTab === 'chat' && <ChatTab />}
      {currentTab === 'files' && <FileAnalysisTab />}
      {currentTab === 'code-tools' && <CodeToolsTab />}
      {currentTab === 'error-analysis' && <ErrorAnalysisTab />}
      {currentTab === 'software-test' && <SoftwareTestTab />}
    </div>
  );
}
