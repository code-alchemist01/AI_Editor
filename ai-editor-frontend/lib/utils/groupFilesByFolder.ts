import { FileRecord } from '@/types';

/**
 * Groups files by folder based on metadata
 * Returns an array with folder records and individual files
 */
export function groupFilesByFolder(files: FileRecord[]): FileRecord[] {
  // Separate files with folder metadata and individual files
  const folderFilesMap = new Map<string, FileRecord[]>();
  const individualFiles: FileRecord[] = [];

  files.forEach((file) => {
    const metadata = (file as any).metadata || {};
    
    // Check if file has folder metadata
    if (metadata.folderName && metadata.isFolderFile) {
      const folderName = metadata.folderName as string;
      
      if (!folderFilesMap.has(folderName)) {
        folderFilesMap.set(folderName, []);
      }
      
      folderFilesMap.get(folderName)!.push(file);
    } else if (!file.isFolder) {
      // Individual file (not part of a folder and not a folder record)
      individualFiles.push(file);
    }
  });

  // Create folder records
  const folders: FileRecord[] = [];
  folderFilesMap.forEach((folderFiles, folderName) => {
    // Check if folder record already exists
    const existingFolder = files.find(
      (f) => f.isFolder && f.folderName === folderName
    );

    if (!existingFolder && folderFiles.length > 0) {
      // Sort folder files by creation date
      const sortedFiles = [...folderFiles].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
      
      folders.push({
        id: `folder-${folderName}`,
        name: `${folderName} (${folderFiles.length} dosya)`,
        isFolder: true,
        folderName: folderName,
        fileCount: folderFiles.length,
        folderFiles: sortedFiles,
        createdAt: sortedFiles[0]?.createdAt || new Date(),
      });
    } else if (existingFolder) {
      // Update existing folder with current files
      existingFolder.folderFiles = folderFiles;
      existingFolder.fileCount = folderFiles.length;
    }
  });

  // Return folders first, then individual files
  // Also keep existing folder records
  const existingFolders = files.filter((f) => f.isFolder);
  
  return [...existingFolders, ...folders, ...individualFiles];
}

