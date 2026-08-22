'use strict';

const XLSX = require('xlsx');

/**
 * Service for Tech Learning management, AI Question Generation, and Mock Interviews.
 */
class TechService {
  /** @type {import('../models/TechRepository')} */
  #techRepo;
  /** @type {import('./AIService')} */
  #aiService;
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /**
   * @param {import('../models/TechRepository')} techRepo
   * @param {import('./AIService')} aiService
   * @param {import('../models/ConfigRepository')} configRepo
   */
  constructor(techRepo, aiService, configRepo) {
    this.#techRepo = techRepo;
    this.#aiService = aiService;
    this.#configRepo = configRepo;
  }

  /**
   * Smart Self-Healing JSON Extractor & Parser.
   * @private
   * @param {string} text
   */
  #parseAIJson(text) {
    const raw = String(text || '').trim().replace(/^\uFEFF/, '');

    // 1. Strip markdown fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
    let candidate = fenceMatch ? fenceMatch[1].trim() : raw;

    // 2. Extract outermost [ ... ] or { ... }
    const match = candidate.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) candidate = match[0].trim();

    // 3. Fast-path: Standard JSON parse
    try {
      return JSON.parse(candidate);
    } catch (_) {}

    // 4. Smart Self-Healing Pipeline
    try {
      let repaired = candidate
        // Strip comments
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
        // Convert single quotes
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
        // Quote unquoted object keys
        .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
        // Escape raw control characters inside quotes
        .replace(/"((?:[^"\\]|\\.)*)"/gs, (_, str) =>
          '"' + str.replace(/[\n\r\t\b\f]/g, (c) => ({
            '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f'
          }[c] || '')) + '"'
        )
        // Strip trailing commas
        .replace(/,\s*([\]}])/g, '$1');

      // Auto-balance missing closing brackets if truncated
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;

      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';

      return JSON.parse(repaired);
    } catch (err) {
      throw new Error(`AI JSON parse failed: ${err.message}`);
    }
  }

  /**
   * Generate a single technical interview question via AI.
   * @param {{
   *   stackSlug: string,
   *   level?: string,
   *   topicName?: string,
   *   customPrompt?: string,
   *   model?: string|null
   * }} opts
   */
  async generateQuestionWithAI({ stackSlug, level = 'junior', topicName = '', customPrompt = '', model = null }) {
    const stack = await this.#techRepo.findStackBySlug(stackSlug);
    if (!stack) throw new Error(`Tech stack "${stackSlug}" not found`);

    const systemPrompt = `Bạn là Senior Technical Architect kiêm Lead Interviewer tuyển dụng kỹ sư phần mềm chuyên nghiệp.
Nhiệm vụ của bạn là soạn 1 câu hỏi kỹ thuật chuẩn mực, sát thực tế phỏng vấn và công việc hằng ngày cho công nghệ ${stack.name}.
Ngôn ngữ sử dụng: Tiếng Việt (thuật ngữ kỹ thuật giữ nguyên tiếng Anh chuẩn).

Yêu cầu BẮT BUỘC trả về định dạng JSON thuần túy (không kèm text ngoài JSON) với cấu trúc sau:
{
  "title": "Tiêu đề câu hỏi ngắn gọn, súc tích",
  "question": "Nội dung câu hỏi chi tiết, tình huống phỏng vấn hoặc đề bài thực tế",
  "quick_answer": "Tóm tắt trả lời nhanh 30s - 1 phút khi phỏng vấn, tập trung vào bản chất và từ khóa đắt giá",
  "detailed_answer": "Phân tích chuyên sâu, giải thích cơ chế hoạt động chi tiết bên dưới (under the hood)",
  "code_example": "Đoạn code minh họa rõ ràng, so sánh Bad practice vs Good practice hoặc giải pháp tối ưu (có chú thích)",
  "interview_tips": "Bẫy phỏng vấn, câu hỏi follow-up mà nhà tuyển dụng hay vặn vẹo",
  "practical_tips": "Kinh nghiệm thực chiến, giải pháp xử lý lỗi, tối ưu hiệu năng hoặc bảo mật khi làm việc thực tế",
  "level": "${level || 'junior'}",
  "tags": "từ khóa phân loại cách nhau bởi dấu phẩy",
  "topic_name": "${topicName || 'Kiến thức cốt lõi'}"
}`;

    const userPrompt = customPrompt
      ? `Tạo câu hỏi về công nghệ ${stack.name} theo yêu cầu đặc thù: "${customPrompt}". Cấp độ: ${level}.`
      : `Tạo 1 câu hỏi phỏng vấn và thực chiến xuất sắc về ${stack.name}, chủ đề: "${topicName || 'Core concepts & Best practices'}", cấp độ: ${level}.`;

    const rawResponse = await this.#aiService.chatOnce(
      [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      model
    );

    const parsed = this.#parseAIJson(rawResponse);
    return {
      stackId: stack.id,
      stackSlug: stack.slug,
      stackName: stack.name,
      title: parsed.title || 'Câu hỏi kỹ thuật',
      question: parsed.question || '',
      quickAnswer: parsed.quick_answer || parsed.quickAnswer || '',
      detailedAnswer: parsed.detailed_answer || parsed.detailedAnswer || '',
      codeExample: parsed.code_example || parsed.codeExample || '',
      interviewTips: parsed.interview_tips || parsed.interviewTips || '',
      practicalTips: parsed.practical_tips || parsed.practicalTips || '',
      level: parsed.level || level,
      tags: parsed.tags || stack.slug,
      topicName: parsed.topic_name || topicName || '',
    };
  }

  /**
   * Batch generate N questions for a stack and module to fill up the question bank.
   * @param {{
   *   stackSlug: string,
   *   level?: string,
   *   topicName?: string,
   *   count?: number,
   *   model?: string|null
   * }} opts
   */
  async batchGenerateWithAI({ stackSlug, level = 'junior', topicName = '', count = 3, model = null }) {
    const stack = await this.#techRepo.findStackBySlug(stackSlug);
    if (!stack) throw new Error(`Tech stack "${stackSlug}" not found`);

    const existingRows = await this.#techRepo.findExistingTitlesByStack(stack.id);
    const existingTitles = existingRows.map((r) => `- ${r.title}`).slice(0, 30).join('\n');

    const num = Math.min(Math.max(Number(count || 3), 1), 10);

    const systemPrompt = `Bạn là Senior Technical Architect kiêm Lead Interviewer tuyển dụng kỹ sư phần mềm chuyên nghiệp.
Nhiệm vụ của bạn là soạn ${num} câu hỏi kỹ thuật chuẩn mực, sát thực tế phỏng vấn và công việc hằng ngày cho công nghệ ${stack.name}.
Ngôn ngữ sử dụng: Tiếng Việt (thuật ngữ kỹ thuật giữ nguyên tiếng Anh chuẩn).
Tránh trùng lặp với các câu hỏi sau:
${existingTitles || '(Chưa có câu hỏi nào)'}

Yêu cầu BẮT BUỘC trả về một JSON Array chứa chính xác ${num} objects với cấu trúc:
[
  {
    "title": "Tiêu đề câu hỏi ngắn gọn",
    "question": "Nội dung câu hỏi chi tiết hoặc tình huống thực tế",
    "quick_answer": "Tóm tắt trả lời nhanh 30s - 1 phút khi phỏng vấn",
    "detailed_answer": "Phân tích chuyên sâu và cơ chế hoạt động bên dưới",
    "code_example": "Đoạn code minh họa (clean code, có chú thích)",
    "interview_tips": "Bẫy phỏng vấn và câu hỏi follow-up",
    "practical_tips": "Kinh nghiệm thực chiến khi làm việc",
    "level": "${level}",
    "tags": "các tag phân loại",
    "topic_name": "${topicName || 'Chuyên đề kỹ thuật'}"
  }
]`;

    const userPrompt = `Tạo danh sách ${num} câu hỏi kỹ thuật về ${stack.name}, cấp độ ${level}, chủ đề: "${topicName || 'Core & Advanced'}".`;

    const rawResponse = await this.#aiService.chatOnce(
      [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      model
    );

    const list = this.#parseAIJson(rawResponse);
    if (!Array.isArray(list)) throw new Error('AI response is not an array');

    return list.map((parsed) => ({
      stackId: stack.id,
      stackSlug: stack.slug,
      stackName: stack.name,
      title: parsed.title || 'Câu hỏi kỹ thuật',
      question: parsed.question || '',
      quickAnswer: parsed.quick_answer || parsed.quickAnswer || '',
      detailedAnswer: parsed.detailed_answer || parsed.detailedAnswer || '',
      codeExample: parsed.code_example || parsed.codeExample || '',
      interviewTips: parsed.interview_tips || parsed.interviewTips || '',
      practicalTips: parsed.practical_tips || parsed.practicalTips || '',
      level: parsed.level || level,
      tags: parsed.tags || stack.slug,
      topicName: parsed.topic_name || topicName || '',
    }));
  }

  /**
   * Evaluate a user's answer in a Mock Interview scenario.
   * @param {{
   *   questionId: number,
   *   userAnswer: string,
   *   model?: string|null
   * }} opts
   */
  async evaluateMockInterview({ questionId, userAnswer, model = null }) {
    const question = await this.#techRepo.findQuestionById(questionId);
    if (!question) throw new Error(`Question #${questionId} not found`);

    const prompt = `Bạn là Senior Technical Interviewer đang phỏng vấn ứng viên cho vị trí kỹ sư phần mềm ${question.stack_name}.
ĐỀ BÀI PHỎNG VẤN:
- Câu hỏi: ${question.question}
- Đáp án chuẩn tóm tắt: ${question.quick_answer}
- Phân tích chuyên sâu: ${question.detailed_answer}
- Bẫy phỏng vấn: ${question.interview_tips || 'N/A'}

CÂU TRẢ LỜI CỦA ỨNG VIÊN:
"${userAnswer}"

Hãy đánh giá câu trả lời của ứng viên một cách công tâm, chuyên nghiệp và đưa ra nhận xét chi tiết.
Yêu cầu trả về DUY NHẤT một JSON hợp lệ:
{
  "score": 8, // Thang điểm 1-10
  "rating": "Tốt" | "Khá" | "Cần cải thiện" | "Xuất sắc",
  "strengths": "Điểm mạnh trong câu trả lời của ứng viên",
  "improvements": "Những điểm còn thiếu sót, hiểu sai hoặc chưa nói rõ cơ chế",
  "ideal_pitch": "Gợi ý cách ứng viên nên diễn đạt lại gãy gọn và ghi điểm tối đa trong 1 phút",
  "follow_up_question": "1 câu hỏi vặn follow-up mở rộng dành cho ứng viên nếu đây là phỏng vấn thực tế"
}`;

    const rawResponse = await this.#aiService.chatOnce(
      [{ role: 'user', content: prompt }],
      model
    );

    return this.#parseAIJson(rawResponse);
  }

  /**
   * Import questions from uploaded Excel buffer.
   * @param {Buffer} buffer
   * @param {string} defaultStackSlug
   */
  async importQuestionsFromExcel(buffer, defaultStackSlug = 'php') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      throw new Error('File Excel rỗng hoặc không đúng định dạng');
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.length) continue;

      try {
        const stackSlug = (row[0] ? String(row[0]) : defaultStackSlug).toLowerCase().trim();
        const stack = await this.#techRepo.findStackBySlug(stackSlug);
        if (!stack) {
          errors.push(`Dòng ${i + 1}: Không tìm thấy Tech "${stackSlug}"`);
          continue;
        }

        const title = row[1] ? String(row[1]).trim() : '';
        const question = row[2] ? String(row[2]).trim() : title;
        const quickAnswer = row[3] ? String(row[3]).trim() : '';
        const detailedAnswer = row[4] ? String(row[4]).trim() : quickAnswer;
        const codeExample = row[5] ? String(row[5]).trim() : '';
        const interviewTips = row[6] ? String(row[6]).trim() : '';
        const practicalTips = row[7] ? String(row[7]).trim() : '';
        const level = (row[8] ? String(row[8]).toLowerCase().trim() : 'junior');
        const tags = row[9] ? String(row[9]).trim() : stack.slug;
        const topicName = row[10] ? String(row[10]).trim() : '';

        if (!title || !quickAnswer) {
          errors.push(`Dòng ${i + 1}: Thiếu Tiêu đề hoặc Trả lời nhanh`);
          continue;
        }

        let topicId = null;
        if (topicName) {
          const topic = await this.#techRepo.findOrCreateTopic(stack.id, topicName);
          topicId = topic.id;
        }

        const result = await this.#techRepo.upsertQuestion({
          stackId: stack.id,
          topicId,
          title,
          question,
          quickAnswer,
          detailedAnswer,
          codeExample,
          interviewTips,
          practicalTips,
          level: ['fresher', 'junior', 'mid', 'senior'].includes(level) ? level : 'junior',
          tags,
          createdBy: 'excel_import',
        });

        if (result.action === 'created') created++;
        else updated++;
      } catch (err) {
        errors.push(`Dòng ${i + 1}: ${err.message}`);
      }
    }

    return { ok: true, created, updated, errors };
  }

  /**
   * Export questions to an Excel buffer.
   * @param {string|null} [stackSlug]
   */
  async exportQuestionsToExcel(stackSlug = null) {
    const questions = await this.#techRepo.findQuestions({
      stackSlug: stackSlug || undefined,
      limit: 1000,
      includeInactive: true,
    });

    const data = questions.map((q, idx) => ({
      STT: idx + 1,
      'Công nghệ (Stack)': q.stack_slug,
      'Chuyên đề (Topic)': q.topic_name || '',
      'Cấp độ (Level)': q.level,
      'Tiêu đề': q.title,
      'Câu hỏi chi tiết': q.question,
      'Trả lời nhanh phỏng vấn': q.quick_answer,
      'Phân tích chuyên sâu': q.detailed_answer,
      'Code minh họa': q.code_example || '',
      'Bẫy phỏng vấn': q.interview_tips || '',
      'Lưu ý thực chiến': q.practical_tips || '',
      Tags: q.tags || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tech Questions');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Seed curated high-yield initial questions for all 6 stacks if question table is empty.
   */
  async seedInitialBankIfEmpty() {
    const existing = await this.#techRepo.findQuestions({ limit: 1 });
    if (existing.length > 0) return;

    const initialSeeds = [
      // PHP
      {
        stackSlug: 'php',
        level: 'junior',
        topicName: 'Core PHP & OOP',
        title: 'Sự khác biệt giữa Interface và Abstract Class trong PHP 8+',
        question: 'Khi nào nên sử dụng Interface và khi nào nên dùng Abstract Class trong PHP? PHP 8+ hỗ trợ những tính năng gì mới cho Interface và Class?',
        quickAnswer: 'Interface định nghĩa contract (hợp đồng hành vi) mà class bắt buộc tuân theo (không chứa thuộc tính state hay method body, trừ constant). Abstract class là lớp cha trừu tượng cung cấp cả implementation mặc định và abstract methods. Một class có thể implement nhiều Interface nhưng chỉ inherit từ 1 Abstract class.',
        detailedAnswer: 'Trong PHP:\n1. Interface chỉ khai báo chữ ký phương thức (method signature). Từ PHP 8.0+, Interface có thể chứa attributes và method visibility phải luôn là public.\n2. Abstract Class cho phép chia sẻ mã nguồn chung giữa các class cùng phân cấp (is-a relationship), quản lý trạng thái qua properties (kể cả readonly properties trong PHP 8.2+).\n3. Khi thiết kế kiến trúc, ưu tiên "Program to an interface, not an implementation" để dễ dàng Mock trong unit testing và áp dụng Dependency Injection.',
        codeExample: `// Interface định nghĩa hợp đồng
interface PaymentGatewayInterface {
    public function charge(int $amountInCents): bool;
}

// Abstract class tái sử dụng logic ghi log và cấu hình chung
abstract class BaseGateway implements PaymentGatewayInterface {
    public function __construct(protected readonly string $apiKey) {}

    protected function logTransaction(string $msg): void {
        echo "[LOG] {$msg}\\n";
    }
}`,
        interviewTips: 'Bẫy phỏng vấn: Interviewer có thể hỏi: "PHP có hỗ trợ đa kế thừa không?" Đáp án: PHP không hỗ trợ đa kế thừa class trực tiếp, nhưng giải quyết bằng Traits (Horizontal reuse) và Multi-interface implementation.',
        practicalTips: 'Trong dự án Laravel/Symfony thực tế, luôn khai báo Repository và Service dưới dạng Interface để hoán đổi Driver (ví dụ: StripePayment vs PayPalPayment) mà không làm vỡ Controller.',
        tags: 'PHP, OOP, Interface, Abstract Class, SOLID',
      },
      {
        stackSlug: 'php',
        level: 'mid',
        topicName: 'Database & PDO',
        title: 'Cách phòng chống triệt để SQL Injection và xử lý N+1 Query trong PHP/Laravel',
        question: 'SQL Injection xảy ra như thế nào trong PHP? Làm sao để phòng chống triệt để với PDO? Giải thích bài toán N+1 Query và cách giải quyết.',
        quickAnswer: 'SQL Injection phòng chống triệt để bằng cách dùng PDO Prepared Statements với Parameterized Queries thay vì nối chuỗi trực tiếp. N+1 Query xảy ra khi truy vấn cha lấy N bản ghi rồi lặp qua từng bản ghi để query bảng con; giải quyết bằng Eager Loading (JOIN hoặc `with()` trong ORM).',
        detailedAnswer: '1. Prepared Statements tách biệt pha phân tích cú pháp SQL (Prepare) và pha truyền dữ liệu (Execute), khiến cơ sở dữ liệu luôn xử lý input như một giá trị thuần túy (data literal) thay vì mã lệnh SQL thực thi.\n2. N+1 Query: Lấy 100 User và profile của họ. Cách sai: 1 query lấy 100 User + 100 queries lấy profile từng user = 101 queries. Cách đúng: Eager loading `User::with("profile")->get()` chỉ tốn đúng 2 queries (1 cho users, 1 cho profiles với WHERE user_id IN (...)).',
        codeExample: `// 1. PDO Prepared Statements an toàn
$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = :email AND status = :status');
$stmt->execute(['email' => $userEmail, 'status' => 'active']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// 2. Laravel Eloquent Eager Loading giải quyết N+1
// Sai (N+1): $posts = Post::all(); foreach($posts as $p) { echo $p->author->name; }
// Đúng:
$posts = Post::with('author')->get();`,
        interviewTips: 'Bẫy phỏng vấn: Dùng `addslashes()` hay `mysqli_real_escape_string()` có thay thế được Prepared Statements không? Đáp án: Không hoàn toàn, chúng vẫn có thể bị bypass trong một số encoding đa byte (GBK, BIG5). Luôn chuẩn hóa bằng Prepared Statements.',
        practicalTips: 'Dùng Laravel Telescope hoặc thanh công cụ Clockwork trong môi trường Dev để bật cảnh báo N+1 query tự động trước khi deploy lên production.',
        tags: 'PHP, PDO, Security, SQL Injection, N+1 Query, Eloquent',
      },

      // Next.js
      {
        stackSlug: 'nextjs',
        level: 'mid',
        topicName: 'Rendering Strategies',
        title: 'Phân biệt SSR, SSG, ISR và React Server Components (RSC) trong Next.js App Router',
        question: 'Giải thích sự khác biệt giữa SSR, SSG, ISR và RSC trong Next.js. Khi nào nên dùng Server Component và khi nào bắt buộc dùng Client Component (`"use client"`)?',
        quickAnswer: 'SSG tạo HTML tĩnh lúc build; SSR tạo HTML động theo từng request; ISR cho phép cập nhật lại trang tĩnh theo chu kỳ hoặc on-demand mà không cần rebuild toàn bộ app. RSC chạy hoàn toàn trên server, không tải JavaScript của component xuống browser, giúp giảm bundle size tối đa. Chỉ dùng `"use client"` khi cần tương tác DOM, React Hooks (useState/useEffect), hoặc browser APIs.',
        detailedAnswer: '1. Server Components là mặc định trong Next.js App Router. RSC có thể fetch data trực tiếp từ Database/ORM mà không cần API route trung gian, không gửi thư viện phụ thuộc xuống client.\n2. Client Components (`"use client"`) đánh dấu ranh giới (boundary) nơi code cần hydrate trên browser. Server Components có thể được truyền vào Client Component dưới dạng `children` prop để giữ nguyên lợi thế bundle size.',
        codeExample: `// Server Component (mặc định - fetch trực tiếp không tốn client JS)
import db from '@/lib/db';
import ClientButton from './ClientButton';

export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({ where: { id: params.id } });

  return (
    <div>
      <h1>{product.name}</h1>
      <ClientButton productId={product.id}>Thêm vào giỏ</ClientButton>
    </div>
  );
}`,
        interviewTips: 'Bẫy: Tưởng rằng khai báo `"use client"` ở file cha thì mọi file con nhập vào đều là Client component. Đáp án: Đúng, nhưng nếu truyền Server Component qua `props.children` thì Server Component con vẫn giữ nguyên trạng thái server-only.',
        practicalTips: 'Di chuyển ranh giới `"use client"` xuống các lá sâu nhất của cây Component (Leaf components) để tối đa hóa hiệu năng và Core Web Vitals (LCP, INP).',
        tags: 'Next.js, App Router, RSC, SSR, SSG, ISR, Client Components',
      },
      {
        stackSlug: 'nextjs',
        level: 'senior',
        topicName: 'Caching Architecture',
        title: 'Cơ chế 4 tầng Cache trong Next.js App Router và cách Revalidation với Server Actions',
        question: 'Next.js App Router quản lý Caching như thế nào qua 4 tầng? Làm sao để revalidate dữ liệu khi thực hiện Server Action mutation?',
        quickAnswer: '4 tầng cache gồm: Request Memoization (trong 1 lần render), Data Cache (giữa các request/server), Full Route Cache (HTML tĩnh trên server), Router Cache (trên trình duyệt client). Sau khi mutate dữ liệu trong Server Action, sử dụng `revalidatePath()` hoặc `revalidateTag()` để làm mới cache tức thì.',
        detailedAnswer: '1. Request Memoization: Tránh duplicate fetch cùng 1 URL trong cùng một chu kỳ render.\n2. Data Cache: Lưu kết quả `fetch` qua các user sessions (dùng `cache: "force-cache"` hoặc `next: { revalidate: 60, tags: ["posts"] }`).\n3. Full Route Cache: Snapshot HTML + RSC Payload lúc build time hoặc sau khi revalidate.\n4. Router Cache: Cache client-side trong bộ nhớ browser giúp chuyển trang tức thì (In-memory cache theo session).',
        codeExample: `'use server';
import { revalidateTag } from 'next/cache';
import db from '@/lib/db';

export async function createPost(formData) {
  const title = formData.get('title');
  await db.post.create({ data: { title } });

  // Revalidate toàn bộ cache gắn tag 'posts'
  revalidateTag('posts');
}`,
        interviewTips: 'Câu hỏi follow-up: `revalidatePath()` vs `revalidateTag()` khác nhau gì? Đáp án: `revalidatePath` làm mới tất cả dữ liệu trên một đường dẫn cụ thể, còn `revalidateTag` làm mới dữ liệu trên tất cả các trang có fetch gắn chung tag đó.',
        practicalTips: 'Luôn kết hợp Server Actions với `useOptimistic` để cập nhật giao diện ngay lập tức trước khi server phản hồi, mang lại trải nghiệm 0ms latency cho người dùng.',
        tags: 'Next.js, Caching, Server Actions, revalidateTag, Optimization',
      },

      // Python
      {
        stackSlug: 'python',
        level: 'mid',
        topicName: 'Asyncio & GIL',
        title: 'Bản chất của GIL (Global Interpreter Lock) và khi nào dùng Multiprocessing vs Asyncio trong Python',
        question: 'GIL là gì trong CPython? Tại sao Python lại có GIL và làm thế nào để tận dụng đa nhân CPU cho các tác vụ tính toán nặng?',
        quickAnswer: 'GIL là mutex khóa trong CPython chỉ cho phép một thread thực thi Python bytecode tại một thời điểm để bảo vệ quản lý bộ nhớ (Reference Counting). Với I/O-bound (gọi API, đọc ghi file/DB), dùng Asyncio hoặc Threading. Với CPU-bound (xử lý ảnh, tính toán AI, mã hóa), phải dùng Multiprocessing hoặc gọi C/C++/Rust extensions để bypass GIL.',
        detailedAnswer: '1. Reference counting trong CPython yêu cầu an toàn luồng (thread-safety), GIL ngăn chặn race conditions khi tăng giảm counter bộ nhớ.\n2. `asyncio` sử dụng Cooperative Multitasking trên Single Thread với Event Loop, cực kỳ nhẹ (hàng vạn coroutine chỉ tốn vài chục MB RAM).\n3. `multiprocessing` khởi tạo nhiều tiến trình OS độc lập, mỗi tiến trình có 1 Python interpreter và 1 GIL riêng, chia sẻ dữ liệu qua IPC (Pipes, Queues, SharedMemory).',
        codeExample: `import asyncio
import concurrent.futures

# 1. Asyncio cho I/O bound
async def fetch_data(url):
    await asyncio.sleep(1) # Giả lập I/O
    return f"Data from {url}"

# 2. ProcessPoolExecutor cho CPU bound
def heavy_cpu_computation(n):
    return sum(i * i for i in range(n))

async def main():
    loop = asyncio.get_running_loop()
    with concurrent.futures.ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, heavy_cpu_computation, 10_000_000)
        print("CPU result:", result)`,
        interviewTips: 'Interviewer hỏi: Python 3.13 có gì mới về GIL? Đáp án: Python 3.13 đã giới thiệu chế độ Free-threaded build (PEP 703) cho phép tắt hoàn toàn GIL khi chạy đa luồng thật sự trên CPU đa nhân.',
        practicalTips: 'Trong các dịch vụ FastAPI xử lý AI/Data, không bao giờ chạy hàm CPU-heavy trực tiếp trong `async def` vì sẽ làm block toàn bộ Event loop; luôn đẩy vào background `ProcessPoolExecutor`.',
        tags: 'Python, GIL, Asyncio, Multiprocessing, Concurrency, CPython',
      },

      // React.js
      {
        stackSlug: 'reactjs',
        level: 'junior',
        topicName: 'Hooks Deep Dive',
        title: 'Sự khác biệt và cách sử dụng đúng của `useMemo`, `useCallback` và `useRef`',
        question: 'Giải thích mục đích của `useMemo`, `useCallback` và `useRef`. Khi nào nên dùng và khi nào KHÔNG nên lạm dụng `useMemo`/`useCallback`?',
        quickAnswer: '`useMemo` ghi nhớ (cache) kết quả tính toán đắt đỏ. `useCallback` ghi nhớ tham chiếu (reference) của một hàm giữa các lần render. `useRef` lưu trữ giá trị mutable hoặc tham chiếu DOM mà không gây re-render khi thay đổi. Không nên dùng useMemo/useCallback bừa bãi cho các phép tính đơn giản vì chi phí overhead so sánh dependency array còn tốn kém hơn.',
        detailedAnswer: '1. Trong JS, hàm khai báo trong component sẽ có địa chỉ bộ nhớ mới sau mỗi lần render. Truyền hàm này vào con được bọc `React.memo` sẽ làm con vẫn bị re-render vô ích -> Cần `useCallback`.\n2. `useRef` trả về một object `{ current: val }` duy nhất tồn tại suốt vòng đời component, hữu ích khi lưu timer ID, previous value, hoặc truy cập trực tiếp DOM node.',
        codeExample: `import { useState, useCallback, useMemo, useRef } from 'react';

function ProductList({ items, onItemClick }) {
  // useMemo: lọc danh sách đắt đỏ chỉ khi items hoặc filter đổi
  const [filter, setFilter] = useState('');
  const filteredItems = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));
  }, [items, filter]);

  // useCallback: giữ nguyên tham chiếu hàm tránh re-render Child
  const handleSelect = useCallback((id) => {
    onItemClick(id);
  }, [onItemClick]);

  // useRef: đếm số lần render không kích hoạt render mới
  const renderCount = useRef(0);
  renderCount.current += 1;

  return <div>Render count: {renderCount.current}</div>;
}`,
        interviewTips: 'Bẫy phỏng vấn: "Có phải bọc mọi hàm trong useCallback là tốt cho performance?" Đáp án: Sai. Việc tạo mảng deps và lưu closure tốn RAM và CPU; chỉ dùng useCallback khi hàm đó được truyền qua props vào component con có `React.memo` hoặc nằm trong deps của Hook khác.',
        practicalTips: 'Ưu tiên tối ưu hóa cấu trúc Component (Composition over memoization - chuyển state xuống gần component sử dụng) trước khi lạm dụng useMemo.',
        tags: 'React, Hooks, useMemo, useCallback, useRef, Performance',
      },

      // JavaScript
      {
        stackSlug: 'javascript',
        level: 'mid',
        topicName: 'Event Loop & Asynchronous',
        title: 'Cơ chế hoạt động của Event Loop, Microtasks và Macrotasks trong JavaScript',
        question: 'Event Loop điều phối Call Stack, Microtask Queue và Macrotask Queue (Task Queue) như thế nào? Đoạn code sau sẽ in ra thứ tự nào?',
        quickAnswer: 'JavaScript đơn luồng. Khi Call Stack rỗng, Event Loop sẽ ưu tiên thực thi TOÀN BỘ Microtask Queue (Promise.then, queueMicrotask, MutationObserver) cho đến khi cạn kiệt, sau đó mới lấy 1 Macrotask duy nhất từ Task Queue (setTimeout, setInterval, I/O), rồi lại quay lại dọn sạch Microtask Queue.',
        detailedAnswer: 'Thứ tự ưu tiên:\n1. Synchronous code trên Call Stack.\n2. Microtask Queue (xử lý sạch hoàn toàn trước khi render hoặc chuyển macrotask tiếp theo).\n3. RequestAnimationFrame (trong Browser trước khi repaint).\n4. 1 Macrotask tiếp theo từ Macrotask Queue.',
        codeExample: `console.log('1');

setTimeout(() => {
  console.log('2 (setTimeout - Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3 (Promise - Microtask)');
}).then(() => {
  console.log('4 (Promise Chaining - Microtask)');
});

queueMicrotask(() => {
  console.log('5 (queueMicrotask)');
});

console.log('6');

// KẾT QUẢ IN RA: 1 -> 6 -> 3 -> 5 -> 4 -> 2`,
        interviewTips: 'Bẫy phỏng vấn: Nếu trong 1 microtask lại tiếp tục tạo ra 1 microtask mới (đệ quy microtask) thì điều gì xảy ra? Đáp án: Trình duyệt sẽ bị treo (Event loop starvation / UI Freeze) vì nó không bao giờ đến được bước render hay xử lý macrotask/click event.',
        practicalTips: 'Dùng `queueMicrotask()` khi bạn muốn một đoạn code chạy bất đồng bộ ngay sau tác vụ hiện tại nhưng phải trước khi trình duyệt vẽ giao diện tiếp theo (trước repaint).',
        tags: 'JavaScript, Event Loop, Microtask, Macrotask, Promise, V8',
      },

      // Node.js
      {
        stackSlug: 'nodejs',
        level: 'senior',
        topicName: 'Streams & Libuv',
        title: 'Kiến trúc Libuv Thread Pool và cơ chế xử lý Backpressure trong Node.js Streams',
        question: 'Node.js đơn luồng nhưng tại sao xử lý được hàng ngàn kết nối đồng thời? Libuv Thread Pool dùng cho những tác vụ nào? Backpressure trong Stream là gì?',
        quickAnswer: 'Node.js sử dụng kiến trúc Non-blocking I/O dựa trên Epoll/Kqueue của OS qua Libuv cho socket mạng. Thread Pool (mặc định 4 threads) dùng riêng cho các tác vụ OS không hỗ trợ non-blocking (File System fs, DNS lookup, Crypto, Zlib). Backpressure xảy ra khi tốc độ đọc nhanh hơn tốc độ ghi vào stream; xử lý chuẩn bằng `stream.pipeline()`.',
        detailedAnswer: '1. Network I/O (HTTP/TCP) chạy hoàn toàn trên Event Loop đơn luồng nhờ cơ chế Multiplexing của OS kernel.\n2. Khi Writable stream bị đầy buffer nội bộ (`highWaterMark`), phương thức `writable.write(chunk)` trả về `false`. Readable stream cần `pause()` lại cho đến khi Writable stream xả bớt bộ nhớ và phát ra sự kiện `drain`.\n3. `stream.pipeline()` tự động xử lý backpressure và dọn dẹp bộ nhớ (destroy streams) an toàn khi gặp exception.',
        codeExample: `const fs = require('fs');
const { pipeline } = require('stream/promises');
const zlib = require('zlib');

async function compressLargeFile(inputPath, outputPath) {
  try {
    // pipeline tự động quản lý backpressure và đóng file descriptors
    await pipeline(
      fs.createReadStream(inputPath),
      zlib.createGzip(),
      fs.createWriteStream(outputPath)
    );
    console.log('Nén file thành công không tốn RAM');
  } catch (err) {
    console.error('Lỗi stream:', err);
  }
}`,
        interviewTips: 'Câu hỏi follow-up: Biến môi trường nào dùng để tăng số lượng Libuv threads? Đáp án: `UV_THREADPOOL_SIZE=8` (cần đặt trước khi process khởi tạo).',
        practicalTips: 'Không bao giờ dùng `fs.readFile()` cho file upload của người dùng trong production vì file lớn sẽ gây crash process do Out Of Memory (V8 Heap Limit). Luôn dùng Streams.',
        tags: 'Node.js, Libuv, Streams, Backpressure, Thread Pool, Performance',
      },
    ];

    for (const item of initialSeeds) {
      const stack = await this.#techRepo.findStackBySlug(item.stackSlug);
      if (!stack) continue;

      let topicId = null;
      if (item.topicName) {
        const topic = await this.#techRepo.findOrCreateTopic(stack.id, item.topicName);
        topicId = topic.id;
      }

      await this.#techRepo.createQuestion({
        stackId: stack.id,
        topicId,
        title: item.title,
        question: item.question,
        quickAnswer: item.quickAnswer,
        detailedAnswer: item.detailedAnswer,
        codeExample: item.codeExample,
        interviewTips: item.interviewTips,
        practicalTips: item.practicalTips,
        level: item.level,
        tags: item.tags,
        createdBy: 'seed',
      });
    }
  }
}

module.exports = TechService;
