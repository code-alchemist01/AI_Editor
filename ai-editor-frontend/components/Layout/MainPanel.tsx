'use client';

import ChatTab from '@/components/Features/ChatTab';
import FileAnalysisTab from '@/components/Features/FileAnalysisTab';
import CodeToolsTab from '@/components/Features/CodeToolsTab';
import ErrorAnalysisTab from '@/components/Features/ErrorAnalysisTab';
import SoftwareTestTab from '@/components/Features/SoftwareTestTab';
import CodeReviewTab from '@/components/Features/CodeReviewTab';
import PerformanceAnalysisTab from '@/components/Features/PerformanceAnalysisTab';
import SecurityScanTab from '@/components/Features/SecurityScanTab';
import TestGenerationTab from '@/components/Features/TestGenerationTab';
import DocumentationTab from '@/components/Features/DocumentationTab';
import ProjectGenerationTab from '@/components/Features/ProjectGenerationTab';

interface MainPanelProps {
  currentTab: 'chat' | 'files' | 'code-tools' | 'error-analysis' | 'software-test' | 'code-review' | 'performance' | 'security' | 'test-generation' | 'documentation' | 'project-generation';
}

export default function MainPanel({ currentTab }: MainPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {currentTab === 'chat' && <ChatTab />}
      {currentTab === 'files' && <FileAnalysisTab />}
      {currentTab === 'code-tools' && <CodeToolsTab />}
      {currentTab === 'error-analysis' && <ErrorAnalysisTab />}
      {currentTab === 'software-test' && <SoftwareTestTab />}
      {currentTab === 'code-review' && <CodeReviewTab />}
      {currentTab === 'performance' && <PerformanceAnalysisTab />}
      {currentTab === 'security' && <SecurityScanTab />}
      {currentTab === 'test-generation' && <TestGenerationTab />}
      {currentTab === 'documentation' && <DocumentationTab />}
      {currentTab === 'project-generation' && <ProjectGenerationTab />}
    </div>
  );
}
