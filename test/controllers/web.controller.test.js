'use strict';

const WebController = require('@controllers/WebController');

describe('WebController', () => {
  let mockSearchService;
  let mockCrawlService;
  let mockAutomateService;
  let mockFetchService;
  let controller;
  let res;

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn().mockResolvedValue({ query: 'test', results: [] }),
    };
    mockCrawlService = {
      crawl: jest.fn().mockResolvedValue({ url: 'https://example.com', text: 'ok' }),
    };
    mockAutomateService = {
      automate: jest.fn().mockResolvedValue({ task: 'click', result: 'done' }),
    };
    mockFetchService = {
      fetchUrl: jest.fn().mockResolvedValue({ status: 200, content: 'html' }),
    };
    controller = new WebController({
      searchService: mockSearchService,
      crawlService: mockCrawlService,
      automateService: mockAutomateService,
      fetchService: mockFetchService,
    });
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('search delegates to searchService', async () => {
    const req = { body: { query: 'test query', num: 10 } };
    await controller.search(req, res);
    expect(mockSearchService.search).toHaveBeenCalledWith({ query: 'test query', num: 10 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('crawl delegates to crawlService', async () => {
    const req = { body: { url: 'https://example.com', options: { depth: 2 } } };
    await controller.crawl(req, res);
    expect(mockCrawlService.crawl).toHaveBeenCalledWith({ url: 'https://example.com', depth: 2 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('automate delegates to automateService', async () => {
    const req = { body: { task: 'login', options: { timeout: 5000 } } };
    await controller.automate(req, res);
    expect(mockAutomateService.automate).toHaveBeenCalledWith({ task: 'login', timeout: 5000 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('fetch delegates to fetchService and handles status code', async () => {
    const req = { body: { url: 'https://example.com' } };
    await controller.fetch(req, res);
    expect(mockFetchService.fetchUrl).toHaveBeenCalledWith({ url: 'https://example.com' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
