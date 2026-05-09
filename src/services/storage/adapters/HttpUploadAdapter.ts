import type {
  StorageAdapter,
  UploadPackageInput,
  UploadPackageResult,
} from '../storageAdapter';
import type { StorageAdapterSettings } from '../settings/storageAdapterSettings';

function getUploadUrl(settings: StorageAdapterSettings): string {
  const url = settings.httpUploadUrl.trim();

  if (!url) {
    throw new Error('HTTP upload URL is not configured.');
  }

  try {
    return new URL(url).toString();
  } catch {
    throw new Error('HTTP upload URL is invalid.');
  }
}

async function readResponseText(response: Response): Promise<string> {
  const text = await response.text();

  return text.slice(0, 4000);
}

async function testEndpoint(url: string): Promise<UploadPackageResult> {
  const response = await fetch(url, {
    method: 'HEAD',
  });

  return {
    ok: true,
    status: response.status,
    responseText: `Endpoint is reachable. HEAD responded with status ${response.status}.`,
    url,
  };
}

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

  const responseText = await readResponseText(response);

  if (!response.ok) {
    throw new Error(`HTTP upload failed with status ${response.status}: ${responseText}`);
  }

  return {
    ok: true,
    status: response.status,
    responseText: responseText || 'Upload completed.',
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

  async testConnection(settings): Promise<UploadPackageResult> {
    const url = getUploadUrl(settings);

    return testEndpoint(url);
  },

  async uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult> {
    const url = getUploadUrl(input.settings);

    return postFormData(input, url);
  },
};
