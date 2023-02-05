import { describe, expect, it } from 'vitest';

import { createMarkownIt } from '../src/render';
import { resolveDataSource } from '../src/loader';

describe('Loader', () => {
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
});

describe('Markdown Render', () => {
  it('should parse md', () => {
    const md = createMarkownIt({ name: 'world', id: '123' });
    expect(md.render('# Hello {{ id }} - {{ name }}\n\nMy id is {{ id }}')).toMatchInlineSnapshot(`
      "<h1>Hello 123 - world</h1>
      <p>My id is 123</p>
      "
    `);
  });

  it('should render zh key', () => {
    const md = createMarkownIt({ 姓名: 'world', 编号1: '123' });
    expect(md.render('# Hello {{ 编号1 }} - {{ 姓名 }}\n\nMy id is {{ 编号1 }}'))
      .toMatchInlineSnapshot(`
      "<h1>Hello 123 - world</h1>
      <p>My id is 123</p>
      "
    `);
  });
});
