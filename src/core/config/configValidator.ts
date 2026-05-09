import { ZodError } from 'zod';

import { auditConfigSchema } from './config.schema';
import type { AuditConfig } from './types';

export type ConfigValidationResult =
  | {
      ok: true;
      config: AuditConfig;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
    };

export function validateAuditConfig(input: unknown): ConfigValidationResult {
  try {
    const config = auditConfigSchema.parse(input);

    return {
      ok: true,
      config,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: 'Config validation failed',
        issues: error.issues.map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';

          return `${path}: ${issue.message}`;
        }),
      };
    }

    return {
      ok: false,
      message: 'Unknown config validation error',
      issues: ['Unknown error'],
    };
  }
}
