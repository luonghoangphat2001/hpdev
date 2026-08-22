'use strict';

const XLSX = require('xlsx');

/**
 * Admin dashboard controller for daily vocabulary notifications.
 */
class VocabularyController {
  /** @type {import('../models/VocabularyRepository')} */
  #vocabRepo;
  /** @type {import('../services/VocabularyService')} */
  #vocabService;

  /**
   * @param {import('../models/VocabularyRepository')} vocabRepo
   * @param {import('../services/VocabularyService')} vocabService
   */
  constructor(vocabRepo, vocabService) {
    this.#vocabRepo = vocabRepo;
    this.#vocabService = vocabService;
    this.getConfig = this.getConfig.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
    this.topics = this.topics.bind(this);
    this.updateTopic = this.updateTopic.bind(this);
    this.words = this.words.bind(this);
    this.createWord = this.createWord.bind(this);
    this.updateWord = this.updateWord.bind(this);
    this.deleteWord = this.deleteWord.bind(this);
    this.importWords = this.importWords.bind(this);
    this.exportWords = this.exportWords.bind(this);
    this.fillPronunciations = this.fillPronunciations.bind(this);
    this.sendWordToDiscord = this.sendWordToDiscord.bind(this);
    this.history = this.history.bind(this);
  }

  async fillPronunciations(_req, res) {
    const result = await this.#vocabService.fillMissingPronunciations();
    res.json({ ok: true, ...result });
  }

  async sendWordToDiscord(req, res) {
    try {
      const id = Number(req.params.id);
      const result = await this.#vocabService.sendSingleWordToDiscord(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  getConfig(_req, res) {
    res.json(this.#vocabService.getConfig());
  }

  async updateConfig(req, res) {
    await this.#vocabService.updateConfig(req.body);
    res.json({ ok: true, config: this.#vocabService.getConfig() });
  }

  async topics(_req, res) {
    res.json({ topics: await this.#vocabRepo.findTopics() });
  }

  async updateTopic(req, res) {
    const topicNo = Number(req.params.topicNo);
    if (!topicNo || topicNo < 1 || topicNo > 50) {
      return res.status(400).json({ error: 'Invalid topic number' });
    }
    const ok = await this.#vocabRepo.updateTopic(topicNo, {
      name: req.body.name,
      isActive: req.body.is_active,
      sortOrder: req.body.sort_order,
    });
    res.json({ ok });
  }

  async words(req, res) {
    const topicNo = req.query.topic ? Number(req.query.topic) : null;
    const words = await this.#vocabRepo.findWords(topicNo, {
      limit: req.query.limit || 500,
      includeInactive: req.query.include_inactive === '1',
    });
    res.json({ words });
  }

  async createWord(req, res) {
    const data = VocabularyController.#wordPayload(req.body);
    const error = VocabularyController.#validateWord(data);
    if (error) return res.status(400).json({ error });
    const id = await this.#vocabRepo.createWord(data);
    res.json({ ok: true, id });
  }

  async updateWord(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid word id' });
    const data = VocabularyController.#wordPayload(req.body, true);
    const ok = await this.#vocabRepo.updateWord(id, data);
    res.json({ ok });
  }

  async deleteWord(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid word id' });
    const ok = await this.#vocabRepo.deleteWord(id);
    res.json({ ok });
  }

  async importWords(req, res) {
    const rowsResult = await this.#extractImportRows(req);
    if (rowsResult.error) {
      return res.status(400).json({ error: rowsResult.error });
    }

    let created = 0;
    let updated = 0;
    const errors = [];
    const topicState = {
      byLabel: new Map(),
      usedNos: new Set(),
      renamedNos: new Set(),
    };
    const rows = rowsResult.rows;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNo = row.rowNo;
      let data;
      if (rowsResult.format === 'excel') {
        const [, topic, word, meaning, exampleEn, exampleVi] = row.values;
        const topicInfo = await this.#resolveImportTopic(topic, topicState);
        if (topicInfo.error) {
          errors.push(`Row ${rowNo}: ${topicInfo.error}`);
          continue;
        }
        if (topicInfo.rename && !topicState.renamedNos.has(topicInfo.topicNo)) {
          await this.#vocabRepo.updateTopic(topicInfo.topicNo, { name: topicInfo.label });
          topicState.renamedNos.add(topicInfo.topicNo);
        }
        data = {
          topicNo: topicInfo.topicNo,
          word: (word || '').trim(),
          meaning: (meaning || '').trim(),
          pronunciation: '',
          example: (exampleEn || '').trim(),
          note: (exampleVi || '').trim(),
        };
      } else {
        const [topicNoRaw, word, meaning, pronunciation, example, note] = row.values;
        const topicNo = await this.#resolveTopicNo(topicNoRaw);
        data = {
          topicNo,
          word: (word || '').trim(),
          meaning: (meaning || '').trim(),
          pronunciation: (pronunciation || '').trim(),
          example: (example || '').trim(),
          note: (note || '').trim(),
        };
      }
      const error = VocabularyController.#validateWord(data);
      if (error) {
        errors.push(`Row ${rowNo}: ${error}`);
        continue;
      }
      try {
        const result = await this.#vocabRepo.upsertWordByTopicAndWord(data);
        if (result.action === 'created') {
          created++;
        } else {
          updated++;
        }
      } catch (err) {
        errors.push(`Row ${rowNo}: ${err.message}`);
      }
    }
    res.json({ ok: true, created, updated, errors });
  }

  async history(req, res) {
    const logs = await this.#vocabRepo.findLogs(req.query.date || null, req.query.limit || 100);
    res.json({ logs });
  }

  static #wordPayload(body, partial = false) {
    const out = {};
    const map = {
      topic_no: 'topicNo',
      word: 'word',
      meaning: 'meaning',
      pronunciation: 'pronunciation',
      example: 'example',
      note: 'note',
      is_active: 'isActive',
    };
    for (const [src, dst] of Object.entries(map)) {
      if (body[src] !== undefined || !partial) out[dst] = body[src];
    }
    if (out.topicNo !== undefined) out.topicNo = Number(out.topicNo);
    if (out.isActive !== undefined) out.isActive = out.isActive ? 1 : 0;
    return out;
  }

  static #validateWord(data) {
    if (!data.topicNo || data.topicNo < 1 || data.topicNo > 50) return 'topic_no must be 1-50';
    if (!data.word) return 'word is required';
    if (!data.meaning) return 'meaning is required';
    return null;
  }

  static #splitImportLine(line) {
    if (line.includes('\t')) return line.split('\t');
    return line.split(',').map((part) => part.trim());
  }

  async #resolveTopicNo(topicValue) {
    const raw = String(topicValue || '').trim();
    if (!raw) return 0;
    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 50) {
      return asNumber;
    }
    const topic = await this.#vocabRepo.findTopicByName(raw);
    return Number(topic?.topic_no || 0);
  }

  async #resolveImportTopic(topicValue, state) {
    const raw = String(topicValue || '').trim();
    if (!raw) return { error: 'topic is required' };

    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 50) {
      state.usedNos.add(asNumber);
      return { topicNo: asNumber, label: raw, rename: false };
    }

    const existing = await this.#vocabRepo.findTopicByName(raw);
    if (existing) {
      const topicNo = Number(existing.topic_no);
      state.usedNos.add(topicNo);
      return { topicNo, label: raw, rename: false };
    }

    if (state.byLabel.has(raw)) {
      const topicNo = state.byLabel.get(raw);
      state.usedNos.add(topicNo);
      return { topicNo, label: raw, rename: false };
    }

    let topicNo = 0;
    for (let i = 1; i <= 50; i++) {
      if (!state.usedNos.has(i)) {
        topicNo = i;
        break;
      }
    }
    if (!topicNo) {
      return { error: 'No available topic slot left for this file' };
    }

    state.byLabel.set(raw, topicNo);
    state.usedNos.add(topicNo);
    return { topicNo, label: raw, rename: true };
  }

  async #extractImportRows(req) {
    if (req.file?.buffer) {
      return this.#parseExcelFile(req.file.buffer);
    }

    const text = String(req.body.text || '').trim();
    if (!text) return { error: 'Import file is required' };

    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return { error: 'Import text is required' };

    return {
      format: 'legacy',
      rows: lines.map((line, index) => {
        const cols = VocabularyController.#splitImportLine(line);
        const [topicNo, word, meaning, pronunciation, example, note] = cols;
        return {
          rowNo: index + 1,
          values: [topicNo, word, meaning, pronunciation, example, note],
        };
      }),
    };
  }

  #parseExcelFile(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return { error: 'Excel file has no worksheet' };
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length < 2) {
        return { error: 'Excel file must include a header row and at least one data row' };
      }
      const header = rows[0].map((cell) => String(cell || '').trim());
      const expected = ['STT', 'Chủ đề', 'Từ vựng', 'Nghĩa tiếng Việt', 'Câu thực tiễn EN', 'Câu thực tiễn VI'];
      const normalizedHeader = header.slice(0, expected.length);
      const matchesHeader = expected.every((label, index) => normalizedHeader[index] === label);
      if (!matchesHeader) {
        return { error: `Excel header must be: ${expected.join(' | ')}` };
      }

      const dataRows = rows.slice(1)
        .map((row, index) => ({ rowNo: index + 2, values: row.slice(0, 6) }))
        .filter((row) => row.values.some((cell) => String(cell || '').trim()));

      return { format: 'excel', rows: dataRows };
    } catch (err) {
      return { error: `Cannot read Excel file: ${err.message}` };
    }
  }

  async exportWords(req, res) {
    try {
      const rawTopicNo = req.query.topic_no;
      const topicNo = rawTopicNo && rawTopicNo !== 'all' ? Number(rawTopicNo) : null;
      const words = await this.#vocabRepo.findWords(topicNo, { limit: 5000, includeInactive: true });

      const data = words.map((w, index) => ({
        'STT': index + 1,
        'Chủ đề': w.topic_no,
        'Tên chủ đề': w.topic_name || '',
        'Từ vựng': w.word || '',
        'Phiên âm Mỹ': w.pronunciation || '',
        'Nghĩa tiếng Việt': w.meaning || '',
        'Câu thực tiễn EN': w.example || '',
        'Câu thực tiễn VI': w.note || '',
        'Trạng thái': Number(w.is_active) === 1 ? 'Bật' : 'Tắt',
        'Đã gửi Discord': Number(w.is_sent) === 1 ? 'Đã gửi' : 'Chưa gửi',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      const sheetName = topicNo ? `Topic ${topicNo}` : 'All Vocabulary';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = topicNo ? `vocabulary_topic_${topicNo}.xlsx` : 'vocabulary_all_topics.xlsx';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = VocabularyController;
