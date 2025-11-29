import { FileRecord } from '@/types';

/**
 * Gets all files for dropdown display, including files inside folders
 * Returns array of files with folder prefix in name for folder files
 */
export function getAllFilesForDropdown(files: FileRecord[]): FileRecord[] {
  const result: FileRecord[] = [];

  for (const file of files) {
    if (file.isFolder && file.folderFiles && file.folderFiles.length > 0) {
      // Add folder files with folder prefix
      for (const folderFile of file.folderFiles) {
        // Only include files with valid IDs (not folder IDs)
        if (folderFile.id && !folderFile.id.startsWith('folder-')) {
          result.push({
            ...folderFile,
            name: `📁 ${file.folderName || 'Klasör'} > ${folderFile.name}`,
            // Keep original name in a separate property for display
          });
        }
      }
    } else if (!file.isFolder && file.id && !file.id.startsWith('folder-')) {
      // Individual file
      result.push(file);
    }
  }

  return result;
}

