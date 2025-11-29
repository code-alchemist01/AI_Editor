'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { useEffect } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  useEffect(() => {
    // Load highlight.js CSS dynamically
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900 border-b-2 border-blue-500 pb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-5 mb-3 text-gray-900 border-b border-gray-300 pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-800" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-3 text-gray-700 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-4 text-gray-700" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2 rounded-r" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            
            return !inline && match ? (
              <div className="relative my-4 rounded-lg overflow-hidden code-block-wrapper">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                  <span className="text-xs text-gray-300 font-mono">{match[1]}</span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        // Find the code element in the DOM
                        const wrapper = e.currentTarget.closest('.code-block-wrapper');
                        const codeElement = wrapper?.querySelector('code') as HTMLElement;
                        
                        if (codeElement) {
                          const textToCopy = codeElement.textContent || '';
                          await navigator.clipboard.writeText(textToCopy);
                          
                          // Visual feedback
                          const button = e.currentTarget as HTMLButtonElement;
                          if (button) {
                            const originalText = button.textContent || '📋 Kopyala';
                            button.textContent = '✓ Kopyalandı!';
                            button.classList.add('text-green-400');
                            button.classList.remove('text-gray-300');
                            setTimeout(() => {
                              if (button) {
                                button.textContent = originalText;
                                button.classList.remove('text-green-400');
                                button.classList.add('text-gray-300');
                              }
                            }, 2000);
                          }
                        }
                      } catch (err) {
                        console.error('Kopyalama hatası:', err);
                      }
                    }}
                    className="text-xs text-gray-300 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-700"
                  >
                    📋 Kopyala
                  </button>
                </div>
                <pre className="bg-gray-900 p-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <div className="my-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 rounded-lg" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-300" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
