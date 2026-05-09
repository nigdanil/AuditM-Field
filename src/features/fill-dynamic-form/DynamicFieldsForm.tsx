import { useEffect, useMemo } from 'react';
import {
  useForm,
  type FieldErrors,
  type RegisterOptions,
  type UseFormRegister,
} from 'react-hook-form';

import type { DynamicFieldConfig } from '../../core/config/types';

export type DynamicFormValues = Record<string, unknown>;

type DynamicFieldValue = string | number | boolean | string[] | null;

type DynamicFieldsFormProps = {
  fields: DynamicFieldConfig[];
  dictionaries: Record<string, string[]>;
  values: DynamicFormValues;
  onSubmit: (values: DynamicFormValues) => Promise<void> | void;
  submitLabel?: string;
  emptyMessage?: string;
};

type FieldOption = {
  value: string;
  label: string;
};

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value);
  }

  return false;
}

function getFieldOptions(
  field: DynamicFieldConfig,
  dictionaries: Record<string, string[]>,
): FieldOption[] {
  if (field.options && field.options.length > 0) {
    return field.options;
  }

  if (field.dictionary) {
    return (dictionaries[field.dictionary] ?? []).map((value) => ({
      value,
      label: value,
    }));
  }

  return [];
}

function coerceDefaultFieldValue(
  field: DynamicFieldConfig,
  value: unknown,
): DynamicFieldValue {
  if (value === undefined || value === null) {
    if (field.type === 'boolean') {
      return false;
    }

    if (field.type === 'multiselect') {
      return [];
    }

    return '';
  }

  if (field.type === 'number') {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return null;
    }

    const numericValue = Number(value);

    return Number.isNaN(numericValue) ? null : numericValue;
  }

  if (field.type === 'boolean') {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return Boolean(value);
  }

  if (field.type === 'multiselect') {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value === 'string' && value.trim()) {
      return [value];
    }

    return [];
  }

  return typeof value === 'string' ? value : String(value);
}

function buildDefaultValues(
  fields: DynamicFieldConfig[],
  values: DynamicFormValues,
): Record<string, DynamicFieldValue> {
  return fields.reduce<Record<string, DynamicFieldValue>>((acc, field) => {
    acc[field.id] = coerceDefaultFieldValue(field, values[field.id]);

    return acc;
  }, {});
}

function normalizeSubmittedValue(
  field: DynamicFieldConfig,
  value: unknown,
): unknown {
  if (field.type === 'number') {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const numericValue = typeof value === 'number' ? value : Number(value);

    return Number.isNaN(numericValue) ? null : numericValue;
  }

  if (field.type === 'boolean') {
    return Boolean(value);
  }

  if (field.type === 'multiselect') {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value === 'string' && value.trim()) {
      return [value];
    }

    return [];
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

function normalizeSubmittedValues(
  fields: DynamicFieldConfig[],
  values: DynamicFormValues,
): DynamicFormValues {
  return fields.reduce<DynamicFormValues>((acc, field) => {
    acc[field.id] = normalizeSubmittedValue(field, values[field.id]);

    return acc;
  }, {});
}

function getRegisterOptions(
  field: DynamicFieldConfig,
): RegisterOptions<DynamicFormValues, string> {
  const options: RegisterOptions<DynamicFormValues, string> = {
    validate: (value: unknown) => {
      if (!field.required) {
        return true;
      }

      return !isEmptyValue(value) || `${field.label} is required`;
    },
  };

  if (field.type === 'number') {
    options.setValueAs = (value: unknown) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }

      const numericValue = Number(value);

      return Number.isNaN(numericValue) ? null : numericValue;
    };
  }

  return options;
}

function getFieldErrorMessage(
  errors: FieldErrors<DynamicFormValues>,
  fieldId: string,
): string | null {
  const fieldError = errors[fieldId];

  if (fieldError && 'message' in fieldError && typeof fieldError.message === 'string') {
    return fieldError.message;
  }

  return null;
}

function DynamicFieldInput({
  field,
  dictionaries,
  register,
  errors,
}: {
  field: DynamicFieldConfig;
  dictionaries: Record<string, string[]>;
  register: UseFormRegister<DynamicFormValues>;
  errors: FieldErrors<DynamicFormValues>;
}) {
  const options = getFieldOptions(field, dictionaries);
  const registerOptions = getRegisterOptions(field);
  const errorMessage = getFieldErrorMessage(errors, field.id);
  const commonInputClass =
    'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400';

  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-300">
        <span>{field.label}</span>
        {field.required ? (
          <span className="rounded-full bg-red-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-100">
            Required
          </span>
        ) : null}
      </span>

      {field.type === 'text' ? (
        <input
          type="text"
          placeholder={field.placeholder}
          className={commonInputClass}
          {...register(field.id, registerOptions)}
        />
      ) : null}

      {field.type === 'textarea' ? (
        <textarea
          rows={4}
          placeholder={field.placeholder}
          className={commonInputClass}
          {...register(field.id, registerOptions)}
        />
      ) : null}

      {field.type === 'number' ? (
        <input
          type="number"
          placeholder={field.placeholder}
          className={commonInputClass}
          {...register(field.id, registerOptions)}
        />
      ) : null}

      {field.type === 'date' ? (
        <input
          type="date"
          className={commonInputClass}
          {...register(field.id, registerOptions)}
        />
      ) : null}

      {field.type === 'select' ? (
        <select className={commonInputClass} {...register(field.id, registerOptions)}>
          <option value="">{field.placeholder ?? 'Select value'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {field.type === 'multiselect' ? (
        <select
          multiple
          className={`${commonInputClass} min-h-32`}
          {...register(field.id, registerOptions)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {field.type === 'boolean' ? (
        <span className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            {...register(field.id, registerOptions)}
          />
          <span>{field.placeholder ?? 'Yes / true'}</span>
        </span>
      ) : null}

      {field.type === 'radio' ? (
        <span className="block space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-3">
          {options.length > 0 ? (
            options.map((option) => (
              <span key={option.value} className="flex items-center gap-3 text-slate-100">
                <input
                  type="radio"
                  value={option.value}
                  className="h-4 w-4 border-slate-700 bg-slate-950"
                  {...register(field.id, registerOptions)}
                />
                <span>{option.label}</span>
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No options configured.</span>
          )}
        </span>
      ) : null}

      {field.helpText ? <span className="block text-xs text-slate-500">{field.helpText}</span> : null}

      {errorMessage ? (
        <span className="block rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-100">
          {errorMessage}
        </span>
      ) : null}
    </label>
  );
}

export function DynamicFieldsForm({
  fields,
  dictionaries,
  values,
  onSubmit,
  submitLabel = 'Save form',
  emptyMessage = 'No dynamic form configured for the active config.',
}: DynamicFieldsFormProps) {
  const defaultValues = useMemo(() => buildDefaultValues(fields, values), [fields, values]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DynamicFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleFormSubmit = async (submittedValues: DynamicFormValues) => {
    await onSubmit(normalizeSubmittedValues(fields, submittedValues));
  };

  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {fields.map((field) => (
        <DynamicFieldInput
          key={field.id}
          field={field}
          dictionaries={dictionaries}
          register={register}
          errors={errors}
        />
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
