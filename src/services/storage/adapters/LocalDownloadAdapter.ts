import { downloadBlob } from '../../export/exportPackage';
import type {
  StorageAdapter,
  UploadPackageInput,
  UploadPackageResult,
} from '../storageAdapter';

export const LocalDownloadAdapter: StorageAdapter = {
  id: 'local-download',
  name: 'Local download',
  description: 'Download the ZIP package directly in the browser.',

  isConfigured() {
    return true;
  },

  async testConnection(): Promise<UploadPackageResult> {
    return {
      ok: true,
      status: 200,
      responseText: 'Local download adapter is ready.',
    };
  },

  async uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult> {
    downloadBlob({
      blob: input.file,
      fileName: input.fileName,
    });

    return {
      ok: true,
      status: 200,
      responseText: 'Local download started.',
    };
  },
};
