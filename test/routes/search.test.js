'use strict';

jest.mock('axios');
const axios = require('axios');

describe('POST /search — expanded num limit', () => {
  beforeAll(() => {
    process.env.SERPER_KEY = 'test-key';
    const organic = Array.from({ length: 50 }, (_, i) => ({
      title: `Result ${i}`, link: `https://example.com/${i}`, snippet: `Snippet ${i}`,
    }));
    axios.request.mockResolvedValue({ data: { organic } });
  });

  afterEach(() => { jest.clearAllMocks(); });

  function fakeRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() };
  }

  it('passes num=50 to Serper when requested', async () => {
    const router  = require('../../routes/search');
    const handler = router.stack[0].route.stack[0].handle;

    const req = { body: { query: 'test', num: 50 } };
    const res = fakeRes();
    await handler(req, res, () => {});

    const callData = JSON.parse(axios.request.mock.calls[0][0].data);
    expect(callData.num).toBe(50);
    expect(res.json.mock.calls[0][0].results).toHaveLength(50);
  });

  it('caps num at 50 when num=100', async () => {
    jest.resetModules();
    jest.mock('axios');
    const ax = require('axios');
    const organic = Array.from({ length: 50 }, (_, i) => ({
      title: `R${i}`, link: `https://x.com/${i}`, snippet: '',
    }));
    ax.request.mockResolvedValue({ data: { organic } });

    const router  = require('../../routes/search');
    const handler = router.stack[0].route.stack[0].handle;
    const req = { body: { query: 'test', num: 100 } };
    const res = fakeRes();
    await handler(req, res, () => {});

    const callData = JSON.parse(ax.request.mock.calls[0][0].data);
    expect(callData.num).toBe(50);
  });
});
