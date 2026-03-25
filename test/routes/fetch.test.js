'use strict';

describe('POST /fetch — PDF parsing', () => {
  let axios, pdfParse;

  function fakeRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.mock('axios');
    jest.mock('pdf-parse');
    axios    = require('axios');
    pdfParse = require('pdf-parse');
  });

  it('parses PDF when content-type is application/pdf', async () => {
    axios.request.mockResolvedValue({
      status:  200,
      headers: { 'content-type': 'application/pdf' },
      data:    Buffer.from('%PDF-fake'),
    });
    pdfParse.mockResolvedValue({ text: 'Extracted PDF text', numpages: 5 });

    const router  = require('../../routes/fetch');
    const handler = router.stack[0].route.stack[0].handle;
    const req = { body: { url: 'https://arxiv.org/pdf/2301.00001.pdf' } };
    const res = fakeRes();
    await handler(req, res, () => {});

    expect(pdfParse).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0]).toMatchObject({
      type:  'pdf',
      text:  'Extracted PDF text',
      pages: 5,
    });
  });

  it('returns raw body for non-PDF content', async () => {
    axios.request.mockResolvedValue({
      status:  200,
      headers: { 'content-type': 'text/html' },
      data:    '<html>Hello</html>',
    });

    const router  = require('../../routes/fetch');
    const handler = router.stack[0].route.stack[0].handle;
    const req = { body: { url: 'https://example.com' } };
    const res = fakeRes();
    await handler(req, res, () => {});

    expect(res.json.mock.calls[0][0]).toMatchObject({
      type: 'html',
      body: '<html>Hello</html>',
    });
    expect(pdfParse).not.toHaveBeenCalled();
  });
});
