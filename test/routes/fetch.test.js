'use strict';

const FetchService = require('../../src/services/web/fetch/fetch.service');
const WebController = require('../../src/controllers/WebController');

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

    const fetchService = new FetchService(axios, pdfParse);
    const controller = new WebController({ fetchService });
    const req = { body: { url: 'https://arxiv.org/pdf/2301.00001.pdf' } };
    const res = fakeRes();
    await controller.fetch(req, res);

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

    const fetchService = new FetchService(axios, pdfParse);
    const controller = new WebController({ fetchService });
    const req = { body: { url: 'https://example.com' } };
    const res = fakeRes();
    await controller.fetch(req, res);

    expect(res.json.mock.calls[0][0]).toMatchObject({
      type: 'html',
      body: '<html>Hello</html>',
    });
    expect(pdfParse).not.toHaveBeenCalled();
  });
});
