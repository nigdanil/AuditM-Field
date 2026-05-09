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

function getWebhookUrl(settings: StorageAdapterSettings): string {
  const url = settings.webhookUrl.trim();

  if (!url) {
    throw new Error('Webhook URL is not configured.');
  }

  try {
    return new URL(url).toString();
  } catch {
    throw new Error('Webhook URL is invalid.');
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

  const responseText = `Webhook is reachable. HEAD responded with status ${response.status}.`;

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

export const WebhookAdapter: StorageAdapter = {
  id: 'webhook',
  name: 'Webhook',
  description: 'Send the ZIP package to a webhook URL using multipart/form-data.',

  isConfigured(settings) {
    return Boolean(settings.webhookUrl.trim());
  },

  async testConnection(settings): Promise<UploadPackageResult> {
    const url = getWebhookUrl(settings);

    return testEndpoint(url);
  },

  async uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult> {
    const url = getWebhookUrl(input.settings);
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
      throw new Error(`Webhook upload failed with status ${response.status}: ${responseText}`);
    }

    return {
      ok: true,
      status: response.status,
      responseText: responseText || 'Webhook upload completed.',
      url,
      transportResult: parseTransportResult({
        responseText,
        fallbackMessage: 'Webhook upload completed.',
      }),
    };
  },
};
