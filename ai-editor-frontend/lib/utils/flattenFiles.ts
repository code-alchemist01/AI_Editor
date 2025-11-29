import { FileRecord } from '@/types';
import { filesApi } from '@/lib/api/files';

/**
 * Flattens folder structure to get all individual files with content
 * Fetches file contents from backend if needed
 */
export async function flattenFiles(files: FileRecord[]): Promise<Array<{ name: string; content: string }>> {
  const result: Array<{ name: string; content: string }> = [];

  for (const file of files) {
    if (file.isFolder && file.folderFiles) {
      // Folder: fetch all files with content
      for (const folderFile of file.folderFiles) {
        if (folderFile.id && !folderFile.id.startsWith('folder-')) {
          try {
            const fullFile = await filesApi.getById(folderFile.id);
            const content = fullFile.content || '';
            // Only add files with non-empty content
            if (content.trim().length > 0) {
              result.push({
                name: fullFile.name,
                content: content,
              });
            }
          } catch (error) {
            console.error(`Error fetching folder file ${folderFile.id}:`, error);
            // Fallback to existing content if fetch fails
            if (folderFile.content && folderFile.content.trim().length > 0) {
              result.push({
                name: folderFile.name,
                content: folderFile.content,
              });
            }
          }
        } else if (folderFile.content && folderFile.content.trim().length > 0) {
          result.push({
            name: folderFile.name,
            content: folderFile.content,
          });
        }
      }
    } else if (!file.isFolder && file.id && !file.id.startsWith('folder-')) {
      // Individual file: fetch content if needed (skip folder IDs)
      if (!file.content && file.id) {
        try {
          const fullFile = await filesApi.getById(file.id);
          const content = fullFile.content || '';
          if (content.trim().length > 0) {
            result.push({
              name: fullFile.name,
              content: content,
            });
          }
        } catch (error) {
          console.error(`Error fetching file ${file.id}:`, error);
        }
      } else if (file.content && file.content.trim().length > 0) {
        result.push({
          name: file.name,
          content: file.content,
        });
      }
    }
  }

  return result;
}

