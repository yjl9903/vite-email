import type { Receiver, FrontmatterFn } from '../types';

export function resolveDataSource(
  rawData: Array<Record<string, string>>,
  frontmatter: Record<string, string | FrontmatterFn> = {}
): Receiver[] {
  const names: string[] = [];
  const receivers: Receiver[] = [];

  const getField = (record: Record<string, string>, field: string) => {
    if (field in record) {
      return record[field];
    } else if (field in frontmatter) {
      const defaultValue = frontmatter[field];
      if (typeof defaultValue === 'string') {
        return defaultValue;
      } else if (typeof defaultValue === 'function') {
        return defaultValue(record);
      } else {
        return undefined;
      }
    }
  };

  const getReceiver = (record: Record<string, string>): string | undefined =>
    getField(record, 'receiver');

  const getAttachment = (record: Record<string, string>): string[] => {
    const rawAttachment =
      (getField(record, 'attachment') ?? '') + ':' + (getField(record, 'attachments') ?? '');

    return rawAttachment
      .split(':')
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const getExtraField = (record: Record<string, string>): Record<string, string> => {
    const extra: Record<string, string> = {};
    for (const key in frontmatter) {
      if (
        key === 'receiver' ||
        key === 'subject' ||
        key === 'attachment' ||
        key === 'attachments'
      ) {
        continue;
      }
      const value = getField(record, key);
      if (value) {
        extra[key] = value;
      }
    }
    return extra;
  };

  for (const receiver of rawData) {
    const name = getReceiver(receiver);
    if (!name || name.length === 0) {
      throw new Error(`Get receiver fail in "${JSON.stringify(receiver)}"`);
    } else {
      names.push(name);
    }

    const attachments: string[] = getAttachment(receiver);

    receivers.push({
      receiver: name,
      subject: getField(receiver, 'subject'),
      attachments,
      frontmatter: {
        ...getExtraField(receiver),
        ...receiver
      }
    });
  }

  if (new Set(names).size !== names.length) {
    throw new Error('Duplicate receivers');
  }

  return receivers;
}
