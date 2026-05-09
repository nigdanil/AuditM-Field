import type {
  StorageAdapter,
  UploadPackageInput,
  UploadPackageResult,
} from '../storageAdapter';
import type { StorageAdapterSettings } from '../settings/storageAdapterSettings';
import {
  getTransportFormFields,
  parseTransportResult,
} from '../transport/transportContract';

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

  const responseText = `Endpoint is reachable. HEAD responded with status ${response.status}.`;

  return {
    ok: true,
    status: response.status,
    responseText,
    url,
    transportResult: {
      accepted: true,
      message: responseText,
      status: 'READY',
    },
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
  formData.append(
    'manifest',
    new Blob([JSON.stringify(input.metadata.manifest, null, 2)], {
      type: 'application/json',
    }),
    'manifest.json',
  );

  Object.entries(getTransportFormFields(input.metadata)).forEach(([key, value]) => {
    formData.append(key, value);
  });

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
    transportResult: parseTransportResult({
      responseText,
      fallbackMessage: 'Upload completed.',
    }),
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
