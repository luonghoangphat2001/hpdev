'use strict';

const XLSX = require('xlsx');
const VocabularyController = require('../../src/controllers/VocabularyController');

describe('VocabularyController importWords', () => {
  let repo;
  let service;
  let controller;
  let res;

  beforeEach(() => {
    repo = {
      findTopicByName: jest.fn(),
      updateTopic: jest.fn().mockResolvedValue(true),
      upsertWordByTopicAndWord: jest.fn(),
    };
    service = {};
    controller = new VocabularyController(repo, service);
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('imports rows from an Excel file with six columns', async () => {
    repo.findTopicByName.mockResolvedValue(null);
    repo.upsertWordByTopicAndWord.mockResolvedValue({ action: 'created' });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['STT', 'Chủ đề', 'Từ vựng', 'Nghĩa tiếng Việt', 'Câu thực tiễn EN', 'Câu thực tiễn VI'],
      [1, 'Travel', 'airport', 'sân bay', 'I arrived at the airport early.', 'Tôi đến sân bay sớm.'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    await controller.importWords({ file: { buffer }, body: {} }, res);

    expect(repo.findTopicByName).toHaveBeenCalledWith('Travel');
    expect(repo.updateTopic).toHaveBeenCalledWith(1, { name: 'Travel' });
    expect(repo.upsertWordByTopicAndWord).toHaveBeenCalledWith({
      topicNo: 1,
      word: 'airport',
      meaning: 'sân bay',
      pronunciation: '',
      example: 'I arrived at the airport early.',
      note: 'Tôi đến sân bay sớm.',
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true, created: 1, updated: 0, errors: [] });
  });

  test('keeps legacy text import working', async () => {
    repo.upsertWordByTopicAndWord.mockResolvedValue({ action: 'updated' });

    await controller.importWords({
      body: {
        text: '1\tword\tmeaning\tpronunciation\texample\tnote',
      },
    }, res);

    expect(repo.upsertWordByTopicAndWord).toHaveBeenCalledWith({
      topicNo: 1,
      word: 'word',
      meaning: 'meaning',
      pronunciation: 'pronunciation',
      example: 'example',
      note: 'note',
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true, created: 0, updated: 1, errors: [] });
  });
});
