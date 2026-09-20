import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { QQBotAPI } from '../lib/sdk/api.js';
import { chunkedUpload } from '../lib/upload.js';

const original = Buffer.from('abcdefgh');
const digest = value => createHash('md5').update(value).digest('hex');
const received = new Map();
let failOnce = false;
let puts = 0;
const server = createServer(async (req, res) => {
  res.setHeader('Connection', 'close');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  puts++;
  if (failOnce) {
    failOnce = false;
    res.writeHead(500).end();
    return;
  }
  assert.equal(req.method, 'PUT');
  received.set(Number(req.url.slice(1)), Buffer.concat(chunks));
  res.writeHead(200).end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const folder = await mkdtemp(join(tmpdir(), 'qq-upload-'));
const file = join(folder, 'source.bin');
await writeFile(file, original);
try {
  for (const scope of ['group', 'user'])
    for (const input of [original, file]) {
      const client = new QQBotAPI({ app_id: 'test' });
      received.clear();
      const finished = [];
      let merged = false;
      failOnce = true; // Real PUT retries must replay the same bytes, including file streams.
      client.groupService = async request => {
        const prefix = `/v2/${scope === 'group' ? 'groups' : 'users'}/target`;
        assert.equal(request.method, 'post');
        if (request.url === `${prefix}/upload_prepare`) {
          assert.equal(request.data.file_size, '8');
          assert.equal(request.data.md5, digest(original));
          return {
            upload_id: 'upload',
            block_size: '3',
            parts: [1, 0, 2].map(index => ({ index, presigned_url: `${base}/${index}`, block_size: index === 2 ? '2' : '3' }))
          };
        }
        if (request.url === `${prefix}/upload_part_finish`) {
          const { part_index, block_size, md5 } = request.data;
          const bytes = received.get(part_index);
          assert(bytes, 'finish must follow a successful byte upload');
          assert.equal(block_size, String(bytes.length));
          assert.equal(md5, digest(bytes));
          finished.push(part_index);
          return {};
        }
        assert.equal(request.url, `${prefix}/files`, 'Merge uses the official files endpoint');
        assert.deepEqual([...finished].sort(), [0, 1, 2]);
        assert.deepEqual(request.data, { upload_id: 'upload', file_type: 4, file_name: 'sample.bin', srv_send_msg: true });
        assert.deepEqual(Buffer.concat([0, 1, 2].map(i => received.get(i))), original);
        merged = true;
        return { file_info: 'file', file_uuid: 'uuid', ttl: 60, id: 'sent' };
      };
      const receipt = await chunkedUpload(client, scope, 'target', input, { file_type: 4, file_name: 'sample.bin', srv_send_msg: true });
      assert.equal(receipt.id, 'sent');
      assert(merged);
    }
  for (const parts of [[], [0, 0, 2], [0, 1, 3]]) {
    const client = new QQBotAPI({ app_id: 'test' });
    let calls = 0;
    client.groupService = async () => {
      calls++;
      return {
        upload_id: 'bad',
        block_size: '3',
        parts: parts.map(index => ({ index, block_size: index === 2 ? '2' : '3', presigned_url: `${base}/${index}` }))
      };
    };
    const before = puts;
    await assert.rejects(() => client.postChunkedRichMedia({ scope: 'group', targetId: 'target', data: original, fileType: 4 }), /invalid upload/);
    assert.equal(calls, 1, 'Malformed partitions cannot reach merge');
    assert.equal(puts, before, 'Malformed partitions cannot upload bytes');
  }
  console.log('Verified actual multipart bytes, zero-based indexes, string sizes, retries, file/buffer inputs, group/c2c merge and malformed partitions.');
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(folder, { recursive: true, force: true });
}
process.exit(0);
