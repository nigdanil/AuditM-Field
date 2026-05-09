import type {
  StorageAdapter,
  UploadPackageInput,
  UploadPackageResult,
} from '../storageAdapter';

export const WebhookAdapter: StorageAdapter = {
  id: 'webhook',
  name: 'Webhook',
  description: 'Send the ZIP package to a webhook URL using multipart/form-data.',

  isConfigured(settings) {
    return Boolean(settings.webhookUrl.trim());
  },

  async uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult> {
    const url = input.settings.webhookUrl.trim();

    if (!url) {
      throw new Error('Webhook URL is not configured.');
    }

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
      throw new Error(`Webhook upload failed with status ${response.status}: ${responseText}`);
    }

    return {
      ok: true,
      status: response.status,
      responseText,
      url,
    };
  },
};
