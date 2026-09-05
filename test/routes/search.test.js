'use strict';

const axios = require('axios');
const SearchService = require('@services/web/search/search.service');
const WebController = require('@controllers/WebController');

jest.mock('axios');

describe('POST /search — expanded num limit', () => {
  beforeEach(() => {
    process.env.SERPER_API_KEY = 'test-key';
  });

  afterEach(() => { jest.clearAllMocks(); });

  function fakeRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() };
  }

  it('passes num=50 to Serper when requested', async () => {
    axios.request.mockResolvedValue({ data: { organic: [] } });
    const searchService = new SearchService('test-key');
    const controller = new WebController({ searchService });

    const req = { body: { query: 'test', num: 50 } };
    const res = fakeRes();
    await controller.search(req, res);

    const callData = JSON.parse(axios.request.mock.calls[0][0].data);
    expect(callData.num).toBe(50);
  });

  it('caps num at 50 when num=100', async () => {
    const organic = Array.from({ length: 50 }, (_, i) => ({
      title: `Result ${i}`,
      link: `https://example.com/${i}`,
      snippet: `Snippet ${i}`,
      position: i + 1,
    }));
    axios.request.mockResolvedValue({ data: { organic } });

    const searchService = new SearchService('test-key');
    const controller = new WebController({ searchService });
    const req = { body: { query: 'test', num: 100 } };
    const res = fakeRes();
    await controller.search(req, res);

    expect(res.json).toHaveBeenCalled();
    const result = res.json.mock.calls[0][0];
    expect(result.results.length).toBe(50);
  });
});
