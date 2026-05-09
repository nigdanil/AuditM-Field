import type {
  StorageAdapter,
  UploadPackageInput,
  UploadPackageResult,
} from '../storageAdapter';

async function postFormData(input: UploadPackageInput, url: string): Promise<UploadPackageResult> {
  const formData = new FormData();

  formData.append('file', input.file, input.fileName);
  formData.append(
    'metadata',
    new Blob([JSON.stringify(input.metadata, null, 2)], {
      type: 'application/json',
    }),
    'metadata.json',
  );

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP upload failed with status ${response.status}: ${responseText}`);
  }

  return {
    ok: true,
    status: response.status,
    responseText,
    url,
  };
}

export const HttpUploadAdapter: StorageAdapter = {
  id: 'http-upload',
  name: 'HTTP upload',
  description: 'Upload the ZIP package to a backend endpoint using multipart/form-data.',

  isConfigured(settings) {
    return Boolean(settings.httpUploadUrl.trim());
  },

  async uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult> {
    const url = input.settings.httpUploadUrl.trim();

    if (!url) {
      throw new Error('HTTP upload URL is not configured.');
    }

    return postFormData(input, url);
  },
};
