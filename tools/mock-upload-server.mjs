import http from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? 'localhost';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'HEAD') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url !== '/upload') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        accepted: false,
        message: 'Not found. Use POST /upload.',
      }),
    );
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        accepted: false,
        message: 'Method not allowed. Use POST /upload.',
      }),
    );
    return;
  }

  let size = 0;

  req.on('data', (chunk) => {
    size += chunk.length;
  });

  req.on('end', () => {
    const jobId = `mock-job-${Date.now()}`;

    console.log(`[mock-upload] accepted ${size} bytes, jobId=${jobId}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        accepted: true,
        jobId,
        message: `Mock server accepted package, received ${size} bytes`,
        externalUrl: `http://${HOST}:${PORT}/jobs/${jobId}`,
        status: 'PROCESSING',
      }),
    );
  });

  req.on('error', (error) => {
    console.error('[mock-upload] request error:', error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        accepted: false,
        message: 'Request stream failed',
        status: 'FAILED',
      }),
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock upload server listening on http://${HOST}:${PORT}/upload`);
  console.log('Use this URL in AuditM-Field Export Center -> HTTP upload URL.');
});
