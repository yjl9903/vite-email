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

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it('success parse csv with custom field', () => {
    expect(resolveDataSource([{ name: '123' }], { receiver: 'name' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "name": "123",
          },
          "receiver": "name",
          "subject": undefined,
        },
      ]
    `);

    expect(resolveDataSource([{ receiver: '123' }], { name: 'abc' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "name": "abc",
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(resolveDataSource([{ 姓名: '456' }], { receiver: (r) => r['姓名'] }))
      .toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "姓名": "456",
          },
          "receiver": "456",
          "subject": undefined,
        },
      ]
    `);
  });

  it('must have valid receiver', () => {
    // @ts-ignore
    expect(() => parseCSV([{ name: '123' }])).toThrowErrorMatchingInlineSnapshot(
      '"Get receiver fail in \\"{\\"name\\":\\"123\\"}\\""'
    );
    // @ts-ignore
    expect(() => parseCSV([{ receiver: '' }])).toThrowErrorMatchingInlineSnapshot(
      '"Get receiver fail in \\"{\\"receiver\\":\\"\\"}\\""'
    );
    expect(() =>
      // @ts-ignore
      parseCSV([{ receiver: '1' }, { receiver: '1' }])
    ).toThrowErrorMatchingInlineSnapshot('"Duplicate receivers"');
  });

  it('parse attachment', () => {
    expect(resolveDataSource([{ receiver: '123', attachment: '123', attachments: '456:789' }]))
      .toMatchInlineSnapshot(`
      [
        {
          "attachments": [
            "123",
            "456",
            "789",
          ],
          "frontmatter": {
            "attachment": "123",
            "attachments": "456:789",
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(resolveDataSource([{ receiver: '123' }], { attachment: 'pdf' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [
            "pdf",
          ],
          "frontmatter": {
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(resolveDataSource([{ receiver: '123' }], { attachment: (r) => r['receiver'] + '.pdf' }))
      .toMatchInlineSnapshot(`
        [
          {
            "attachments": [
              "123.pdf",
            ],
            "frontmatter": {
              "receiver": "123",
            },
            "receiver": "123",
            "subject": undefined,
          },
        ]
      `);
  });
}
