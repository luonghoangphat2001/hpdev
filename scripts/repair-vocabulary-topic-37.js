'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const createRepositories = require('../src/config/application/repositories');

const words = [
  ['gerontology', 'lão khoa; ngành nghiên cứu sự lão hóa', '/ˌdʒer.ənˈtɒl.ə.dʒi/', 'Gerontology examines how biological and social factors shape people\'s experiences of later life.', 'Lão khoa nghiên cứu cách các yếu tố sinh học và xã hội định hình trải nghiệm của con người khi về già.'],
  ['ageism', 'sự phân biệt đối xử vì tuổi tác', '/ˈeɪ.dʒɪ.zəm/', 'Ageism can prevent capable older workers from securing meaningful employment.', 'Sự phân biệt tuổi tác có thể khiến những lao động lớn tuổi có năng lực không tìm được công việc ý nghĩa.'],
  ['cognitive decline', 'sự suy giảm nhận thức', '/ˈkɒɡ.nə.tɪv dɪˈklaɪn/', 'Regular mental stimulation may delay cognitive decline among older adults.', 'Việc kích thích trí não thường xuyên có thể làm chậm suy giảm nhận thức ở người cao tuổi.'],
  ['retirement age', 'tuổi nghỉ hưu', '/rɪˈtaɪə.mənt eɪdʒ/', 'Several governments have raised the retirement age to maintain a sustainable workforce.', 'Một số chính phủ đã tăng tuổi nghỉ hưu để duy trì lực lượng lao động bền vững.'],
  ['pension reform', 'cải cách lương hưu', '/ˈpen.ʃən rɪˌfɔːm/', 'Pension reform is essential when a shrinking workforce supports more retirees.', 'Cải cách lương hưu là thiết yếu khi lực lượng lao động thu hẹp phải hỗ trợ nhiều người nghỉ hưu hơn.'],
  ['assisted living', 'mô hình nhà ở có hỗ trợ cho người cao tuổi', '/əˌsɪs.tɪd ˈlɪv.ɪŋ/', 'Assisted living allows many elderly residents to retain independence while receiving daily support.', 'Mô hình nhà ở có hỗ trợ giúp nhiều người cao tuổi duy trì sự độc lập trong khi vẫn được hỗ trợ hằng ngày.'],
  ['palliative care', 'chăm sóc giảm nhẹ', '/ˌpæl.i.ə.tɪv ˈkeə/', 'Palliative care prioritizes comfort and dignity for patients with serious illnesses.', 'Chăm sóc giảm nhẹ ưu tiên sự thoải mái và phẩm giá cho bệnh nhân mắc bệnh nghiêm trọng.'],
  ['chronic illness', 'bệnh mãn tính', '/ˌkrɒn.ɪk ˈɪl.nəs/', 'Managing chronic illness places increasing pressure on ageing societies and public hospitals.', 'Quản lý bệnh mãn tính tạo áp lực ngày càng lớn lên các xã hội già hóa và bệnh viện công.'],
  ['eldercare', 'dịch vụ chăm sóc người cao tuổi', '/ˈel.də.keə/', 'Affordable eldercare enables family members to balance employment with caring responsibilities.', 'Dịch vụ chăm sóc người cao tuổi với chi phí hợp lý giúp các thành viên gia đình cân bằng công việc và trách nhiệm chăm sóc.'],
  ['social participation', 'sự tham gia xã hội', '/ˈsəʊ.ʃəl pɑːˌtɪs.ɪˈpeɪ.ʃən/', 'Social participation reduces loneliness and improves well-being in later life.', 'Sự tham gia xã hội làm giảm cô đơn và cải thiện sức khỏe tinh thần khi về già.'],
  ['intergenerational solidarity', 'sự đoàn kết giữa các thế hệ', '/ˌɪn.təˌdʒen.əˈreɪ.ʃən.əl ˌsɒl.ɪˈdær.ə.ti/', 'Intergenerational solidarity helps communities share resources fairly across age groups.', 'Sự đoàn kết giữa các thế hệ giúp cộng đồng chia sẻ nguồn lực công bằng giữa các nhóm tuổi.'],
];

async function main() {
  const { vocabRepo } = await createRepositories();
  let created = 0;
  let updated = 0;
  for (const [word, meaning, pronunciation, example, note] of words) {
    const result = await vocabRepo.upsertWordByTopicAndWord({
      topicNo: 37,
      word,
      meaning,
      pronunciation,
      example,
      note,
      isActive: 1,
    });
    if (result.action === 'created') created++;
    else updated++;
  }
  console.log(JSON.stringify({ ok: true, topicNo: 37, created, updated }));
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
