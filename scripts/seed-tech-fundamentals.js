'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const SEED_OWNER = 'seed-tech-fundamentals-100-v1';
const LEVEL = 'beginner';

const banks = {
  php: {
    name: 'PHP',
    concepts: [
      ['Thẻ PHP và câu lệnh', 'Mã PHP đặt trong <?php ... ?>; đa số câu lệnh kết thúc bằng dấu chấm phẩy.', '<?php\n$message = "Hello";\necho $message;', 'Quên dấu chấm phẩy gây ParseError.'],
      ['Biến và quy tắc đặt tên', 'Biến PHP bắt đầu bằng $, tên phân biệt hoa thường và không cần khai báo kiểu trước.', '$studentName = "An";\n$score = 8.5;', '$score và $Score là hai biến khác nhau.'],
      ['Kiểu dữ liệu cơ bản', 'Các kiểu phổ biến gồm int, float, string, bool, null, array và object.', '$age = 18;\n$passed = true;\nvar_dump($age, $passed);', 'Dùng gettype hoặc var_dump khi cần kiểm tra kiểu lúc học và debug.'],
      ['Ép kiểu và type juggling', 'PHP có thể tự chuyển kiểu theo ngữ cảnh; ép kiểu tường minh giúp ý định rõ hơn.', '$input = "20";\n$total = (int) $input + 5;', 'So sánh lỏng có thể tạo kết quả bất ngờ; ưu tiên === và !==.'],
      ['Toán tử số học', '+, -, *, /, %, ** thực hiện cộng, trừ, nhân, chia, chia dư và lũy thừa.', '$remainder = 17 % 5;\n$power = 2 ** 3;', 'Phép chia cho 0 phát sinh lỗi; cần kiểm tra mẫu số.'],
      ['Toán tử so sánh và logic', '=== so sánh cả giá trị lẫn kiểu; &&, || và ! kết hợp hoặc phủ định điều kiện.', '$valid = $age >= 18 && $passed === true;', 'Không nhầm = là gán với == hoặc === là so sánh.'],
      ['Chuỗi và nối chuỗi', 'Chuỗi dùng nháy đơn hoặc kép; toán tử . nối các chuỗi.', '$name = "Lan";\necho "Hello " . $name;', 'Nội suy biến hoạt động trong nháy kép nhưng không hoạt động trong nháy đơn.'],
      ['Mảng chỉ số', 'Mảng chỉ số lưu danh sách theo khóa số bắt đầu từ 0 khi không chỉ định khóa.', '$colors = ["red", "blue"];\necho $colors[0];', 'Truy cập chỉ số không tồn tại tạo cảnh báo undefined array key.'],
      ['Mảng kết hợp', 'Mảng kết hợp dùng khóa có ý nghĩa để biểu diễn dữ liệu dạng bản ghi.', '$student = ["name" => "An", "age" => 18];\necho $student["name"];', 'Kiểm tra array_key_exists hoặc toán tử ?? trước khi đọc khóa tùy chọn.'],
      ['Điều kiện if và match', 'if xử lý nhánh điều kiện; match so khớp nghiêm ngặt và trả về một giá trị.', '$label = match ($score) {\n  10 => "Perfect",\n  default => "Other",\n};', 'match dùng so sánh nghiêm ngặt và cần nhánh default nếu đầu vào chưa được phủ hết.'],
      ['Vòng lặp for và foreach', 'for phù hợp khi biết số lần lặp; foreach duyệt trực tiếp phần tử hoặc cặp khóa-giá trị.', 'foreach ($colors as $index => $color) {\n    echo "$index: $color";\n}', 'Không sửa mảng bằng tham chiếu trong foreach nếu không thật sự cần.'],
      ['Hàm và giá trị trả về', 'Hàm đóng gói logic, nhận tham số và dùng return để trả kết quả cho nơi gọi.', 'function add(int $a, int $b): int {\n    return $a + $b;\n}', 'Một hàm không có return tường minh sẽ trả về null.'],
      ['Phạm vi biến', 'Biến trong hàm có local scope; biến bên ngoài không tự động khả dụng bên trong hàm.', '$tax = 0.1;\n$priceWithTax = fn($price) => $price * (1 + $tax);', 'Arrow function tự bắt biến bên ngoài theo giá trị; closure thường dùng use.'],
      ['Tham số mặc định và named arguments', 'Tham số có thể có giá trị mặc định; named arguments truyền theo tên thay vì vị trí.', 'function greet(string $name, string $prefix = "Hi") {}\ngreet(name: "An");', 'Tham số bắt buộc nên đặt trước tham số tùy chọn.'],
      ['Class và object', 'Class là khuôn mẫu gồm thuộc tính và phương thức; object là một thể hiện được tạo bằng new.', 'class Student {\n  public function __construct(public string $name) {}\n}\n$student = new Student("An");', 'Dùng -> để truy cập thành viên của object, không dùng cú pháp mảng.'],
      ['Visibility và đóng gói', 'public, protected và private kiểm soát nơi thuộc tính hoặc phương thức được truy cập.', 'class Wallet {\n  private int $balance = 0;\n  public function balance(): int { return $this->balance; }\n}', 'Không đặt mọi thuộc tính public vì sẽ làm mất kiểm soát trạng thái.'],
      ['Null và toán tử ??', 'null biểu thị chưa có giá trị; ?? cung cấp giá trị dự phòng khi biến hoặc khóa không tồn tại hay là null.', '$displayName = $student["nickname"] ?? "Guest";', '?? không thay thế việc validate những giá trị rỗng nhưng không phải null.'],
      ['Exception và try-catch', 'Exception biểu diễn lỗi có thể xử lý; try-catch cho phép bắt và phản hồi phù hợp.', 'try {\n  throw new RuntimeException("Failed");\n} catch (RuntimeException $e) {\n  echo $e->getMessage();\n}', 'Chỉ bắt exception khi có thể xử lý, bổ sung ngữ cảnh hoặc giải phóng tài nguyên.'],
      ['Include, require và autoload', 'require nạp tệp bắt buộc; Composer autoload tự ánh xạ class mà không cần require thủ công từng tệp.', 'require __DIR__ . "/vendor/autoload.php";', 'Đường dẫn tương đối phụ thuộc thư mục chạy; __DIR__ ổn định hơn.'],
      ['Form, request và validation', 'Dữ liệu từ $_GET hoặc $_POST là đầu vào không tin cậy và phải được validate trước khi dùng.', '$email = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);', 'Validate dữ liệu và escape đầu ra; không ghép input trực tiếp vào SQL hay HTML.'],
    ],
  },
  nextjs: {
    name: 'Next.js',
    concepts: [
      ['Next.js là gì', 'Next.js là framework React cung cấp routing theo tệp, render phía server, tối ưu tài nguyên và công cụ build.', 'export default function Page() {\n  return <h1>Hello Next.js</h1>;\n}', 'React là thư viện UI; Next.js bổ sung cấu trúc ứng dụng và khả năng server.'],
      ['Cấu trúc App Router', 'Trong App Router, thư mục app và các tệp page, layout, loading, error tạo route và UI theo quy ước.', 'app/\n  layout.js\n  page.js\n  about/page.js', 'Chỉ page.js làm một đoạn route truy cập trực tiếp được.'],
      ['Tệp page', 'page.js hoặc page.tsx export default component đại diện nội dung của một route.', 'export default function AboutPage() {\n  return <main>About</main>;\n}', 'Thiếu default export hợp lệ làm route không render được.'],
      ['Tệp layout', 'layout chia sẻ UI giữa các route con và nhận children để đặt nội dung trang.', 'export default function Layout({ children }) {\n  return <section>{children}</section>;\n}', 'Root layout phải chứa html và body.'],
      ['Server Component', 'Component trong App Router mặc định chạy trên server, phù hợp đọc dữ liệu và giữ bí mật phía server.', 'export default async function Page() {\n  const data = await getData();\n  return <pre>{JSON.stringify(data)}</pre>;\n}', 'Server Component không dùng state, effect hoặc event handler trình duyệt.'],
      ['Client Component', 'Chỉ thị use client tạo ranh giới client để dùng state, effect, event và API trình duyệt.', '"use client";\nimport { useState } from "react";\nexport default function Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}', 'Không thêm use client cho cả cây nếu chỉ một phần nhỏ cần tương tác.'],
      ['Props qua ranh giới server-client', 'Props truyền từ Server Component sang Client Component phải tuần tự hóa được.', '<Counter initialValue={3} />', 'Không truyền trực tiếp function server thông thường làm prop client; Server Action là trường hợp riêng.'],
      ['Route tĩnh và động', 'Thư mục [id] tạo dynamic segment; params chứa giá trị lấy từ URL.', 'export default async function Page({ params }) {\n  const { id } = await params;\n  return <p>{id}</p>;\n}', 'Cần validate params trước khi dùng để truy vấn dữ liệu.'],
      ['Link điều hướng', 'Component Link điều hướng nội bộ phía client và cho phép Next.js tối ưu tải route.', 'import Link from "next/link";\n<Link href="/about">About</Link>', 'Dùng a trực tiếp cho nội bộ có thể gây tải lại toàn trang.'],
      ['Image tối ưu ảnh', 'Component Image hỗ trợ kích thước ảnh, lazy loading và định dạng tối ưu.', 'import Image from "next/image";\n<Image src="/logo.png" alt="Logo" width={120} height={40} />', 'Luôn cung cấp alt phù hợp và kích thước để hạn chế layout shift.'],
      ['Metadata cơ bản', 'Export metadata cho phép khai báo title và description phục vụ SEO và chia sẻ.', 'export const metadata = {\n  title: "Home",\n  description: "Student portal",\n};', 'Metadata chỉ chạy trong Server Component.'],
      ['Đọc dữ liệu bằng fetch', 'Server Component có thể await fetch trực tiếp; cần kiểm tra response.ok trước khi đọc dữ liệu.', 'const response = await fetch("https://example.com/api");\nif (!response.ok) throw new Error("Fetch failed");\nconst data = await response.json();', 'Không giả định mọi phản hồi HTTP đều thành công.'],
      ['Caching và revalidation', 'Next.js cho phép cache dữ liệu và revalidate để cân bằng tốc độ với độ mới.', 'fetch(url, { next: { revalidate: 60 } });', 'Dữ liệu theo từng người dùng thường không nên dùng chung cache công khai.'],
      ['Route Handler', 'route.js định nghĩa hàm theo HTTP method như GET hoặc POST và trả về Response.', 'export async function GET() {\n  return Response.json({ ok: true });\n}', 'Route Handler là endpoint server, không phải React component.'],
      ['Request và Response', 'Web Request đọc URL, header hoặc body; Response biểu diễn status, header và nội dung trả về.', 'export async function POST(request) {\n  const body = await request.json();\n  return Response.json(body, { status: 201 });\n}', 'Body JSON có thể sai định dạng và cần được xử lý, validate.'],
      ['Biến môi trường', 'Biến môi trường mặc định chỉ ở server; tiền tố NEXT_PUBLIC_ làm giá trị được đưa tới client bundle.', 'const secret = process.env.API_SECRET;', 'Không đặt khóa bí mật trong biến NEXT_PUBLIC_.'],
      ['Loading UI', 'loading.js cung cấp giao diện chờ khi segment đang stream hoặc tải dữ liệu.', 'export default function Loading() {\n  return <p>Loading...</p>;\n}', 'Loading state nên ngắn gọn và giữ bố cục ổn định.'],
      ['Error UI', 'error.js là Client Component bắt lỗi render trong segment và có thể cho người dùng thử lại.', '"use client";\nexport default function ErrorView({ reset }) {\n  return <button onClick={reset}>Retry</button>;\n}', 'Error boundary không thay thế logging phía server.'],
      ['notFound và trang 404', 'Hàm notFound dừng render segment và hiển thị not-found.js gần nhất.', 'import { notFound } from "next/navigation";\nif (!post) notFound();', 'Dùng notFound cho tài nguyên không tồn tại, không dùng cho mọi lỗi server.'],
      ['Build và hydration', 'Build tạo artifact tối ưu; hydration gắn logic client vào HTML đã render để phần tương tác hoạt động.', 'npm run build\nnpm start', 'HTML server và lần render client đầu tiên phải nhất quán để tránh hydration mismatch.'],
    ],
  },
  python: {
    name: 'Python',
    concepts: [
      ['Biến và phép gán', 'Python tạo tên biến khi gán; không cần từ khóa khai báo và tên nên theo snake_case.', 'student_name = "An"\nscore = 8.5', 'Gán liên kết tên với object; biến không phải chiếc hộp có kiểu cố định.'],
      ['Kiểu số', 'int biểu diễn số nguyên không giới hạn cố định; float biểu diễn số thực dấu phẩy động.', 'count = 10\nprice = 19.5\ntotal = count * price', 'Số float có sai số biểu diễn; tiền tệ nên cân nhắc Decimal.'],
      ['Chuỗi và f-string', 'str là chuỗi Unicode bất biến; f-string chèn biểu thức vào chuỗi dễ đọc.', 'name = "Lan"\nmessage = f"Hello, {name}"', 'Không thể sửa trực tiếp một ký tự trong str vì chuỗi bất biến.'],
      ['Boolean và None', 'bool có True, False; None biểu thị không có giá trị và nên so sánh bằng is None.', 'result = None\nif result is None:\n    print("missing")', 'Không dùng == None khi is None diễn đạt đúng identity rõ hơn.'],
      ['Toán tử số học', '+, -, *, /, //, %, ** lần lượt xử lý số học, chia thực, chia sàn, dư và lũy thừa.', 'quotient = 7 // 2\nremainder = 7 % 2', '/ luôn trả float; // làm tròn xuống, kể cả với số âm.'],
      ['So sánh và logic', '== so sánh giá trị; is so sánh identity; and, or, not kết hợp điều kiện.', 'eligible = age >= 18 and has_id', 'Không dùng is để so sánh hai số hoặc chuỗi theo giá trị.'],
      ['List', 'list là tập hợp có thứ tự, thay đổi được và cho phép phần tử trùng nhau.', 'colors = ["red", "blue"]\ncolors.append("green")', 'Chỉ số bắt đầu từ 0; truy cập ngoài phạm vi gây IndexError.'],
      ['Tuple', 'tuple là tập hợp có thứ tự nhưng bất biến, phù hợp nhóm giá trị không cần thay đổi.', 'point = (10, 20)\nx, y = point', 'Tuple một phần tử cần dấu phẩy: (1,).'],
      ['Dictionary', 'dict lưu cặp key-value; key phải hashable và thường dùng để biểu diễn bản ghi.', 'student = {"name": "An", "age": 18}\nprint(student["name"])', 'Dùng get cho khóa tùy chọn để tránh KeyError.'],
      ['Set', 'set lưu các giá trị duy nhất và hỗ trợ hợp, giao, hiệu tập hợp.', 'unique_ids = {1, 2, 2}\nunique_ids.add(3)', 'Set rỗng là set(), còn {} tạo dict rỗng.'],
      ['if, elif và else', 'Cấu trúc điều kiện chọn đúng một nhánh dựa trên truth value.', 'if score >= 8:\n    grade = "A"\nelif score >= 6.5:\n    grade = "B"\nelse:\n    grade = "C"', 'Thụt lề xác định block và phải nhất quán.'],
      ['for và range', 'for duyệt iterable; range tạo dãy số thường dùng khi cần lặp theo chỉ số.', 'for index in range(3):\n    print(index)', 'Ưu tiên duyệt trực tiếp phần tử hoặc enumerate thay vì tự quản lý chỉ số.'],
      ['while, break và continue', 'while lặp khi điều kiện còn đúng; break thoát vòng lặp, continue sang lượt kế.', 'while attempts < 3:\n    attempts += 1\n    if success:\n        break', 'Điều kiện không đổi có thể tạo vòng lặp vô hạn.'],
      ['Hàm và return', 'def định nghĩa hàm; tham số nhận đầu vào và return trả kết quả.', 'def add(a: int, b: int) -> int:\n    return a + b', 'Hàm không gặp return sẽ trả None.'],
      ['Phạm vi LEGB', 'Python tìm tên theo Local, Enclosing, Global, Built-in.', 'tax = 0.1\ndef total(price):\n    return price * (1 + tax)', 'Gán vào biến global trong hàm tạo local mới trừ khi dùng global.'],
      ['List comprehension', 'List comprehension tạo list mới từ iterable bằng biểu thức và điều kiện tùy chọn.', 'squares = [n * n for n in range(5)]', 'Không nhồi nhiều nhánh phức tạp vào comprehension vì khó đọc.'],
      ['Class và instance', 'class định nghĩa dữ liệu và hành vi; instance được tạo bằng cách gọi class.', 'class Student:\n    def __init__(self, name):\n        self.name = name\nstudent = Student("An")', 'self tham chiếu instance hiện tại và phải là tham số đầu của instance method.'],
      ['Exception', 'try-except bắt lỗi dự kiến; raise phát sinh exception khi dữ liệu vi phạm yêu cầu.', 'try:\n    age = int(raw_age)\nexcept ValueError:\n    age = 0', 'Bắt lớp exception cụ thể, tránh except trống che lỗi lập trình.'],
      ['Module và import', 'Mỗi tệp .py là một module; import cho phép tái sử dụng tên từ module khác.', 'from math import sqrt\nresult = sqrt(16)', 'Không đặt tên file trùng module chuẩn như math.py.'],
      ['File và with', 'with quản lý context và tự đóng file dù có lỗi xảy ra.', 'with open("notes.txt", "r", encoding="utf-8") as file:\n    text = file.read()', 'Chỉ rõ encoding giúp kết quả nhất quán giữa môi trường.'],
    ],
  },
  reactjs: {
    name: 'React.js',
    concepts: [
      ['Component', 'Component là hàm trả về UI và có tên viết hoa để React phân biệt với thẻ HTML.', 'function Welcome() {\n  return <h1>Hello</h1>;\n}', 'Không gọi component như hàm thông thường trong JSX; dùng <Welcome />.'],
      ['JSX', 'JSX là cú pháp mô tả UI gần giống HTML và cho phép chèn biểu thức JavaScript bằng dấu ngoặc nhọn.', 'const name = "An";\nreturn <p>Hello {name}</p>;', 'JSX dùng className thay cho class và mọi thẻ phải đóng.'],
      ['Props', 'Props là dữ liệu chỉ đọc được component cha truyền xuống component con.', 'function Greeting({ name }) {\n  return <p>Hello {name}</p>;\n}\n<Greeting name="Lan" />', 'Component con không nên thay đổi trực tiếp props.'],
      ['State', 'State lưu dữ liệu thay đổi theo thời gian và khi cập nhật sẽ yêu cầu React render lại.', 'const [count, setCount] = useState(0);', 'Không sửa state trực tiếp; gọi hàm setter với giá trị mới.'],
      ['Event handler', 'Event handler là hàm được truyền cho prop sự kiện như onClick và chạy khi người dùng tương tác.', '<button onClick={() => setCount(count + 1)}>Add</button>', 'Truyền hàm cho onClick, không gọi ngay trong lúc render.'],
      ['Render có điều kiện', 'Có thể dùng if, toán tử ba ngôi hoặc && để chọn UI theo trạng thái.', 'return loggedIn ? <Dashboard /> : <Login />;', 'Với &&, giá trị 0 có thể bị render; nên chuyển điều kiện sang boolean rõ ràng.'],
      ['Render danh sách', 'map biến mỗi phần tử dữ liệu thành một React element.', 'items.map((item) => <li key={item.id}>{item.name}</li>)', 'Mỗi phần tử cùng cấp cần key ổn định và duy nhất trong danh sách.'],
      ['Key', 'Key giúp React nhận diện phần tử được thêm, xóa hoặc di chuyển giữa các lần render.', '<Row key={student.id} student={student} />', 'Không dùng index làm key khi danh sách có thể sắp xếp hoặc xóa.'],
      ['Form controlled', 'Controlled input lấy value từ state và cập nhật state qua onChange.', '<input value={name} onChange={(e) => setName(e.target.value)} />', 'Có value nhưng thiếu onChange làm ô nhập chỉ đọc.'],
      ['Nâng state lên', 'Khi hai component cần cùng dữ liệu, đặt state ở cha chung gần nhất rồi truyền props xuống.', '<TemperatureInput value={temperature} onChange={setTemperature} />', 'Tránh lưu cùng một dữ liệu nguồn ở nhiều state gây mất đồng bộ.'],
      ['State bất biến', 'Array và object trong state nên được thay bằng bản sao mới để React nhận thấy thay đổi.', 'setStudent((old) => ({ ...old, name: "An" }));', 'push hoặc gán trực tiếp thuộc tính trên state cũ có thể không render đúng.'],
      ['Cập nhật state từ giá trị cũ', 'Dùng updater function khi state mới phụ thuộc state trước để tránh giá trị snapshot cũ.', 'setCount((current) => current + 1);', 'Gọi setCount(count + 1) nhiều lần trong một handler có thể không cộng như mong đợi.'],
      ['useEffect', 'useEffect đồng bộ component với hệ thống bên ngoài sau render, như subscription hoặc API trình duyệt.', 'useEffect(() => {\n  document.title = title;\n}, [title]);', 'Không dùng effect để tính dữ liệu có thể tính trực tiếp trong render.'],
      ['Cleanup effect', 'Effect có thể trả hàm cleanup để hủy listener, timer hoặc kết nối cũ.', 'useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);', 'Thiếu cleanup có thể gây memory leak hoặc cập nhật lặp.'],
      ['Dependency array', 'Dependency array liệt kê mọi giá trị reactive mà effect sử dụng.', 'useEffect(() => {\n  fetchUser(userId);\n}, [userId]);', 'Bỏ dependency để né effect chạy lại dễ tạo stale closure.'],
      ['useRef', 'useRef giữ một giá trị qua các lần render mà thay đổi current không kích hoạt render.', 'const inputRef = useRef(null);\ninputRef.current?.focus();', 'Dữ liệu ảnh hưởng UI nên dùng state thay vì ref.'],
      ['Context', 'Context truyền dữ liệu sâu trong cây mà không phải chuyển prop qua mọi tầng.', 'const ThemeContext = createContext("light");', 'Không đưa mọi state vào một context lớn vì nhiều consumer có thể render lại.'],
      ['Custom Hook', 'Custom Hook là hàm bắt đầu bằng use và tái sử dụng logic stateful giữa component.', 'function useOnlineStatus() {\n  const [online, setOnline] = useState(true);\n  return online;\n}', 'Hook chia sẻ logic, không tự động chia sẻ cùng một state giữa các nơi gọi.'],
      ['Rules of Hooks', 'Hook chỉ gọi ở cấp cao nhất của component hoặc custom Hook và theo cùng thứ tự mỗi render.', 'function Form() {\n  const [name, setName] = useState("");\n}', 'Không gọi Hook bên trong if, loop hoặc hàm lồng nhau.'],
      ['Data flow và composition', 'React dùng luồng dữ liệu một chiều; composition ghép component qua props và children.', 'function Card({ children }) {\n  return <section>{children}</section>;\n}', 'Ưu tiên composition trước khi tạo hệ thống kế thừa component.'],
    ],
  },
  javascript: {
    name: 'JavaScript',
    concepts: [
      ['let, const và var', 'const không cho gán lại binding; let cho phép gán lại; var có function scope và hoisting dễ gây nhầm.', 'const name = "An";\nlet score = 0;\nscore += 1;', 'Ưu tiên const, dùng let khi cần gán lại và tránh var trong mã mới.'],
      ['Kiểu nguyên thủy', 'Các primitive gồm string, number, bigint, boolean, undefined, symbol và null.', 'const age = 18;\nconst active = true;\nconst missing = null;', 'typeof null trả về "object" do đặc điểm lịch sử của JavaScript.'],
      ['Object', 'Object lưu các cặp key-value; thuộc tính được đọc bằng dấu chấm hoặc ngoặc vuông.', 'const student = { name: "An", age: 18 };\nconsole.log(student.name);', 'Dùng ngoặc vuông khi key nằm trong biến hoặc không phải identifier hợp lệ.'],
      ['Array', 'Array là object đặc biệt lưu danh sách có thứ tự và chỉ số bắt đầu từ 0.', 'const colors = ["red", "blue"];\ncolors.push("green");', 'Đọc chỉ số ngoài phạm vi trả undefined thay vì ném lỗi.'],
      ['Toán tử số học', '+, -, *, /, %, ** thực hiện số học; + cũng nối chuỗi khi có toán hạng chuỗi.', 'const remainder = 10 % 3;\nconst power = 2 ** 4;', '"5" + 1 tạo "51"; cần chuyển kiểu khi mong muốn phép cộng số.'],
      ['So sánh nghiêm ngặt', '=== và !== so sánh cả kiểu và giá trị mà không ép kiểu ngầm.', 'const same = 5 === Number("5");', 'Ưu tiên === thay == để tránh các quy tắc coercion khó nhớ.'],
      ['Toán tử logic và nullish', '&&, || xử lý logic theo truthy/falsy; ?? chỉ dùng giá trị phải khi bên trái null hoặc undefined.', 'const page = inputPage ?? 1;', '|| cũng thay thế 0, chuỗi rỗng và false; ?? giữ các giá trị hợp lệ đó.'],
      ['Ép kiểu', 'Number, String và Boolean chuyển giá trị tường minh sang kiểu mong muốn.', 'const age = Number(rawAge);\nif (Number.isNaN(age)) throw new Error("Invalid age");', 'Number của chuỗi không hợp lệ tạo NaN và cần kiểm tra.'],
      ['if và switch', 'if phù hợp điều kiện linh hoạt; switch so sánh một biểu thức với nhiều case bằng so sánh nghiêm ngặt.', 'switch (role) {\n  case "admin": access = true; break;\n  default: access = false;\n}', 'Thiếu break có thể làm chạy xuyên sang case kế tiếp.'],
      ['for và while', 'for thường dùng khi có bước khởi tạo/cập nhật; while lặp khi một điều kiện còn đúng.', 'for (let i = 0; i < 3; i += 1) {\n  console.log(i);\n}', 'Điều kiện hoặc bước cập nhật sai dễ tạo vòng lặp vô hạn.'],
      ['for...of và for...in', 'for...of duyệt giá trị iterable; for...in duyệt tên thuộc tính enumerable của object.', 'for (const color of colors) {\n  console.log(color);\n}', 'Không dùng for...in để duyệt giá trị array thông thường.'],
      ['Function declaration', 'Function declaration định nghĩa hàm có tên và được hoist để có thể gọi trước dòng khai báo.', 'function add(a, b) {\n  return a + b;\n}', 'Tham số thiếu có giá trị undefined; cần default hoặc validation khi bắt buộc.'],
      ['Arrow function', 'Arrow function có cú pháp gọn và không tạo this riêng.', 'const double = (number) => number * 2;', 'Không dùng arrow function khi cần this động của method hoặc constructor.'],
      ['Scope và closure', 'Block tạo scope cho let/const; closure cho hàm nhớ lexical environment nơi nó được tạo.', 'function counter() {\n  let value = 0;\n  return () => ++value;\n}', 'Closure giữ tham chiếu tới dữ liệu nên có thể giữ bộ nhớ lâu hơn dự kiến.'],
      ['Destructuring', 'Destructuring lấy phần tử array hoặc thuộc tính object vào các biến ngắn gọn.', 'const { name, age = 0 } = student;\nconst [first] = colors;', 'Destructure từ null hoặc undefined sẽ ném TypeError.'],
      ['Spread và rest', 'Spread mở rộng iterable/object; rest gom các giá trị còn lại vào array hoặc object.', 'const copy = { ...student, active: true };\nfunction sum(...numbers) {}', 'Spread chỉ sao chép nông, object lồng nhau vẫn dùng chung tham chiếu.'],
      ['Các phương thức array', 'map biến đổi, filter chọn phần tử, find tìm phần tử đầu và reduce tích lũy một kết quả.', 'const passed = scores.filter((score) => score >= 5);', 'map luôn trả array cùng số phần tử; dùng filter khi muốn loại phần tử.'],
      ['Exception', 'throw tạo lỗi; try-catch xử lý lỗi đồng bộ hoặc lỗi từ promise đã await.', 'try {\n  JSON.parse(text);\n} catch (error) {\n  console.error(error.message);\n}', 'Không để catch rỗng vì sẽ che nguyên nhân lỗi.'],
      ['Promise và async-await', 'Promise biểu diễn kết quả tương lai; async function trả Promise và await chờ Promise hoàn tất.', 'async function load() {\n  const response = await fetch("/api/items");\n  return response.json();\n}', 'await không tự kiểm tra status HTTP; cần kiểm tra response.ok.'],
      ['ES Modules', 'export chia sẻ binding từ module; import sử dụng binding đó trong module khác.', 'export function add(a, b) { return a + b; }\n// import { add } from "./math.js";', 'Named export và default export có cú pháp import khác nhau.'],
    ],
  },
  nodejs: {
    name: 'Node.js',
    concepts: [
      ['Node.js là gì', 'Node.js là JavaScript runtime chạy ngoài trình duyệt, xây trên V8 và cung cấp API hệ điều hành.', 'console.log(process.version);', 'Node.js không phải framework và không cung cấp DOM như trình duyệt.'],
      ['Chạy tệp và REPL', 'Lệnh node file.js chạy chương trình; REPL cho phép thử biểu thức tương tác.', 'node app.js\nnode', 'Đảm bảo dùng phiên bản Node tương thích với dự án.'],
      ['global và process', 'globalThis truy cập global object; process cung cấp argv, env, trạng thái và thông tin tiến trình.', 'const port = Number(process.env.PORT ?? 3000);', 'Biến môi trường là chuỗi và cần chuyển kiểu, validate.'],
      ['CommonJS modules', 'CommonJS dùng require để nhập và module.exports để xuất giá trị.', 'const fs = require("node:fs");\nmodule.exports = { readFile: fs.readFile };', 'Không trộn CommonJS và ESM nếu chưa cấu hình quy tắc rõ ràng.'],
      ['ES Modules trong Node.js', 'ESM dùng import/export và được bật bằng .mjs hoặc type module trong package.json.', 'import { readFile } from "node:fs/promises";\nexport const load = readFile;', 'ESM không có __dirname mặc định; có thể suy ra từ import.meta.url.'],
      ['npm và package.json', 'npm quản lý package; package.json mô tả metadata, scripts và dependencies của dự án.', 'npm install express\nnpm run start', 'Commit lockfile để cài dependency nhất quán.'],
      ['Semantic versioning', 'Phiên bản semver có dạng major.minor.patch; major thường chứa thay đổi không tương thích.', '"dependencies": { "express": "^4.18.0" }', 'Dấu ^ cho phép cập nhật minor và patch trong cùng major, không ghim tuyệt đối.'],
      ['Event loop', 'Event loop cho phép Node xử lý nhiều tác vụ I/O bằng callback mà không chặn một thread JavaScript chính.', 'setTimeout(() => console.log("later"), 0);\nconsole.log("now");', 'Callback timeout 0 vẫn chạy sau code đồng bộ hiện tại.'],
      ['Callback', 'Callback là hàm được truyền để chạy sau khi thao tác hoặc sự kiện hoàn tất.', 'fs.readFile("note.txt", "utf8", (error, text) => {\n  if (error) return console.error(error);\n  console.log(text);\n});', 'Callback kiểu Node thường nhận error ở tham số đầu tiên.'],
      ['Promise và async-await', 'API Promise kết hợp async-await giúp luồng bất đồng bộ dễ đọc và bắt lỗi bằng try-catch.', 'const text = await readFile("note.txt", "utf8");', 'Quên await có thể khiến code dùng Promise thay vì dữ liệu đã hoàn tất.'],
      ['File system', 'Module node:fs và node:fs/promises đọc, ghi, liệt kê và quản lý tệp.', 'import { readFile } from "node:fs/promises";\nconst text = await readFile("note.txt", "utf8");', 'Tránh API đồng bộ trong request server vì chúng chặn event loop.'],
      ['Path', 'Module node:path ghép và chuẩn hóa đường dẫn theo hệ điều hành.', 'import path from "node:path";\nconst file = path.join("data", "users.json");', 'Không tự nối đường dẫn bằng / khi mã cần chạy đa nền tảng.'],
      ['Buffer', 'Buffer biểu diễn dãy byte dùng cho file, network và dữ liệu nhị phân.', 'const buffer = Buffer.from("Hello", "utf8");\nconsole.log(buffer.length);', 'Độ dài byte có thể khác số ký tự Unicode.'],
      ['EventEmitter', 'EventEmitter cho object phát sự kiện có tên và đăng ký listener.', 'emitter.on("ready", () => console.log("ready"));\nemitter.emit("ready");', 'Thêm listener mãi mà không gỡ có thể gây memory leak warning.'],
      ['HTTP server cơ bản', 'Module node:http tạo server và cung cấp request, response cho mỗi yêu cầu.', 'http.createServer((req, res) => {\n  res.writeHead(200, { "content-type": "text/plain" });\n  res.end("Hello");\n}).listen(3000);', 'Mỗi response phải được kết thúc bằng end hoặc stream hoàn tất.'],
      ['Request URL và method', 'req.method cho HTTP method; req.url chứa path và query thô của yêu cầu.', 'if (req.method === "GET" && req.url === "/health") {\n  res.end("ok");\n}', 'Cần parser URL và router cho ứng dụng có nhiều route.'],
      ['JSON response', 'Server trả JSON bằng cách đặt content-type application/json và stringify object.', 'res.writeHead(200, { "content-type": "application/json" });\nres.end(JSON.stringify({ ok: true }));', 'Không truyền object trực tiếp cho res.end.'],
      ['Stream', 'Stream xử lý dữ liệu theo từng chunk thay vì nạp toàn bộ vào bộ nhớ.', 'createReadStream("video.mp4").pipe(res);', 'Cần xử lý sự kiện error ở cả nguồn và đích hoặc dùng pipeline.'],
      ['Xử lý lỗi bất đồng bộ', 'Promise rejection phải được await/catch hoặc chuyển tới middleware xử lý lỗi.', 'try {\n  await loadUser();\n} catch (error) {\n  console.error(error);\n}', 'Unhandled rejection có thể làm tiến trình không ổn định hoặc thoát.'],
      ['Graceful shutdown cơ bản', 'Ứng dụng nghe SIGTERM, ngừng nhận request mới, đóng server và tài nguyên trước khi thoát.', 'process.on("SIGTERM", () => {\n  server.close(() => process.exit(0));\n});', 'Thoát ngay có thể cắt request đang xử lý và làm mất dữ liệu.'],
    ],
  },
};

const questionVariants = [
  {
    key: 'khai-niem',
    title: (topic, name) => `Nhập môn ${name}: ${topic} là gì?`,
    prompt: (topic, name) => `Giải thích ${topic} trong ${name} bằng ngôn ngữ của sinh viên mới học. Nêu mục đích chính và một ví dụ ngắn.`,
    quick: (concept) => concept,
    detail: (concept, pitfall) => `${concept} Điểm cần nhớ: ${pitfall}`,
    tip: 'Trả lời định nghĩa trước, sau đó nêu một ví dụ nhỏ và kết quả mong đợi.',
  },
  {
    key: 'cu-phap',
    title: (topic, name) => `Cú pháp cơ bản: ${topic} trong ${name}`,
    prompt: (topic, name) => `Viết cú pháp tối thiểu minh họa ${topic} trong ${name}, rồi giải thích vai trò của từng phần quan trọng.`,
    quick: (concept) => concept,
    detail: (concept, pitfall) => `${concept} Đọc ví dụ theo thứ tự khai báo, thao tác và kết quả; lưu ý ${pitfall}`,
    tip: 'Viết đoạn code ngắn có thể chạy, dùng tên biến rõ nghĩa và giải thích từng dòng.',
  },
  {
    key: 'doc-code',
    title: (topic, name) => `Đọc code ${name}: ${topic}`,
    prompt: (topic, name) => `Đọc code minh họa về ${topic} trong ${name}. Hãy mô tả chương trình làm gì và dự đoán giá trị hoặc hành vi chính.`,
    quick: (concept) => concept,
    detail: (concept, pitfall) => `Muốn dự đoán đúng cần lần theo thứ tự thực thi và trạng thái dữ liệu. ${concept} Cẩn thận: ${pitfall}`,
    tip: 'Lần theo code từ trên xuống, ghi lại giá trị sau từng bước trước khi kết luận.',
  },
  {
    key: 'loi-thuong-gap',
    title: (topic, name) => `Lỗi fresher thường gặp: ${topic} trong ${name}`,
    prompt: (topic, name) => `Nêu một lỗi sinh viên thường mắc khi dùng ${topic} trong ${name}, nguyên nhân và cách sửa đúng.`,
    quick: (_concept, pitfall) => pitfall,
    detail: (concept, pitfall) => `${pitfall} Cách sửa phải dựa trên nguyên tắc: ${concept}`,
    tip: 'Nêu triệu chứng, nguyên nhân, bản sửa nhỏ nhất và cách kiểm tra lại.',
  },
  {
    key: 'thuc-hanh',
    title: (topic, name) => `Bài tập fresher ${name}: áp dụng ${topic}`,
    prompt: (topic, name) => `Cho một bài tập nhỏ áp dụng ${topic} trong ${name}. Trình bày đầu vào, các bước xử lý và kết quả cần đạt.`,
    quick: (concept) => `Áp dụng đúng nguyên tắc: ${concept}`,
    detail: (concept, pitfall) => `Tách bài toán thành khai báo đầu vào, thao tác chính và kiểm tra kết quả. ${concept} Tránh lỗi: ${pitfall}`,
    tip: 'Bắt đầu từ ví dụ tối thiểu, thử một trường hợp bình thường và một trường hợp biên.',
  },
];

function buildFundamentalItems(slug, bank) {
  return bank.concepts.flatMap(([topic, concept, code, pitfall]) =>
    questionVariants.map((variant) => ({
      title: variant.title(topic, bank.name),
      prompt: variant.prompt(topic, bank.name),
      level: LEVEL,
      content: {
        quick_answer: variant.quick(concept, pitfall),
        detailed_answer: variant.detail(concept, pitfall),
        code_example: code,
        interview_tips: variant.tip,
        practical_tips: `Tự chạy ví dụ, thay đổi một đầu vào và giải thích vì sao kết quả thay đổi. ${pitfall}`,
      },
      sampleSolution: {
        key_takeaways: `${concept} ${pitfall}`,
      },
      tags: `${slug}, intern, fresher, fundamentals, theory, beginner, seed:fundamentals-v1`,
    }))
  );
}

async function seedTechFundamentals(db) {
  let created = 0;
  let skipped = 0;

  await db.beginTransaction();
  try {
    for (const [slug, bank] of Object.entries(banks)) {
      const [learningRows] = await db.execute(
        "SELECT id FROM learning WHERE slug = ? AND type = 'tech_question' LIMIT 1",
        [slug]
      );
      if (!learningRows.length) throw new Error(`Learning stack not found: ${slug}`);

      const learningId = learningRows[0].id;
      const items = buildFundamentalItems(slug, bank);
      const [existingRows] = await db.execute(
        `SELECT title FROM learning_item
         WHERE learning_id = ? AND type = 'tech_question'`,
        [learningId]
      );
      const existingTitles = new Set(existingRows.map((row) => String(row.title).trim()));
      const inserts = items.filter((item) => !existingTitles.has(item.title));
      skipped += items.length - inserts.length;

      if (inserts.length) {
        const placeholders = inserts
          .map(() => "(?, 'tech_question', ?, ?, ?, ?, ?, ?, 1, ?)")
          .join(', ');
        const params = inserts.flatMap((item) => [
          learningId,
          item.title,
          item.prompt,
          item.level,
          JSON.stringify(item.content),
          JSON.stringify(item.sampleSolution),
          item.tags,
          SEED_OWNER,
        ]);
        const [result] = await db.execute(
          `INSERT INTO learning_item
           (learning_id, type, title, prompt, level, content, sample_solution, tags, is_active, created_by)
           VALUES ${placeholders}`,
          params
        );
        created += result.affectedRows || 0;
      }
    }

    await db.commit();
    return { ok: true, created, skipped, total: created + skipped };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log(JSON.stringify(await seedTechFundamentals(db)));
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  LEVEL,
  SEED_OWNER,
  banks,
  buildFundamentalItems,
  questionVariants,
  seedTechFundamentals,
};
