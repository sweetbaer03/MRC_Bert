import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedItem = {
  code: string;
  title: string;
  description: string;
  evidenceType?: "STATUS" | "STATUS_FILE" | "TEXT" | "FILE";
};

type SeedCategory = {
  name: string;
  description: string;
  items: SeedItem[];
};

// 개인정보 보호수준 평가(공공기관 개인정보 보호수준 평가 등)에서 일반적으로 다루는
// 개인정보 처리시스템 점검 영역을 기준으로 구성한 기본 체크리스트입니다.
// 관리자 화면(체크리스트 관리)에서 기관 상황에 맞게 자유롭게 추가/수정/비활성화할 수 있습니다.
const CATEGORIES: SeedCategory[] = [
  {
    name: "관리체계 및 공개",
    description: "개인정보 처리방침 공개, 보호책임자 지정 등 기본 관리체계 현황",
    items: [
      {
        code: "1-1",
        title: "개인정보 처리방침 최신화 및 공개",
        description: "홈페이지 등에 개인정보 처리방침이 최신 내용으로 게시되어 있는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "1-2",
        title: "개인정보 보호책임자(CPO) 지정 및 공시",
        description: "보호책임자 지정 여부 및 연락처 등 공시 현황",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "1-3",
        title: "내부관리계획 수립·시행",
        description: "개인정보 내부관리계획 수립일자, 최근 개정일, 시행 현황",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "1-4",
        title: "개인정보 처리시스템·수집항목 현황 최신화",
        description: "운영 중인 개인정보처리시스템 목록 및 수집항목이 최신 상태로 관리되는지 확인",
        evidenceType: "TEXT",
      },
    ],
  },
  {
    name: "접근권한 관리",
    description: "개인정보취급자 지정 및 계정·권한 관리 현황",
    items: [
      {
        code: "2-1",
        title: "개인정보취급자 지정 및 최소인원 운영",
        description: "업무상 필요한 최소한의 인원에게만 취급 권한이 부여되어 있는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "2-2",
        title: "계정별 접근권한 차등 부여 및 정기 검토",
        description: "권한 부여 기준 및 정기 검토(연 1회 이상) 실시 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "2-3",
        title: "권한 부여·변경·말소 이력 관리",
        description: "인사이동/퇴직 등에 따른 권한 변경·말소 이력 기록 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "2-4",
        title: "비밀번호 작성규칙 및 안전한 인증수단 적용",
        description: "비밀번호 복잡도 규칙, 2단계 인증 등 안전한 인증수단 적용 여부",
        evidenceType: "STATUS",
      },
    ],
  },
  {
    name: "접속기록의 관리·점검",
    description: "접속기록 보관, 위변조 방지, 정기 점검 현황",
    items: [
      {
        code: "3-1",
        title: "접속기록 보관(최소 1년 이상)",
        description: "누가/언제/어떤 정보에 접속했는지 기록이 법정 보관기간 이상 보관되는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "3-2",
        title: "접속기록 위변조 방지 조치",
        description: "접속기록 백업 등 위변조 방지를 위한 기술적 조치 여부",
        evidenceType: "STATUS",
      },
      {
        code: "3-3",
        title: "접속기록 정기 점검(월 1회 이상) 및 결과 보관",
        description: "비정상 접속 여부 등을 정기적으로 점검하고 그 결과를 기록·보관하는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "3-4",
        title: "대량 개인정보 다운로드·출력 시 별도 인증",
        description: "대량의 개인정보를 다운로드하거나 출력할 때 추가 인증 절차가 있는지 확인",
        evidenceType: "STATUS",
      },
    ],
  },
  {
    name: "암호화 조치",
    description: "저장·전송 구간 개인정보 암호화 적용 현황",
    items: [
      {
        code: "4-1",
        title: "고유식별정보·비밀번호·생체정보 저장 시 암호화",
        description: "주민등록번호, 비밀번호, 생체인식정보 등 저장 시 암호화 적용 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "4-2",
        title: "개인정보 송·수신 구간 암호화",
        description: "인터넷 구간 등 개인정보 송수신 시 암호화 통신(HTTPS/TLS 등) 적용 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "4-3",
        title: "업무용 단말기(PC·모바일) 저장 개인정보 암호화",
        description: "업무용 컴퓨터, 모바일 기기 등에 저장된 개인정보파일의 암호화 여부",
        evidenceType: "STATUS",
      },
    ],
  },
  {
    name: "개인정보의 파기",
    description: "보유기간 경과 개인정보 및 분리보관 대상 관리 현황",
    items: [
      {
        code: "5-1",
        title: "보유기간 경과·목적 달성 개인정보 파기",
        description: "보유기간이 경과했거나 처리목적을 달성한 개인정보를 지체 없이 파기하는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "5-2",
        title: "분리보관 대상 개인정보 별도 관리",
        description: "다른 법령에 따라 보존해야 하는 개인정보를 별도로 분리하여 저장·관리하는지 확인",
        evidenceType: "STATUS",
      },
      {
        code: "5-3",
        title: "파기 결과 기록·보관(파기대장 등)",
        description: "개인정보 파기 결과를 파기대장 등으로 기록하고 보관하는지 확인",
        evidenceType: "STATUS_FILE",
      },
    ],
  },
  {
    name: "위탁 및 제3자 제공 관리",
    description: "업무 위탁 현황 및 수탁자 관리·감독 현황",
    items: [
      {
        code: "6-1",
        title: "개인정보 처리업무 위탁 현황 최신화 및 공개",
        description: "위탁업무 내용, 수탁자 현황이 개인정보 처리방침 등에 최신으로 반영되어 있는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "6-2",
        title: "수탁자에 대한 관리·감독(교육·점검) 실시",
        description: "수탁자 대상 정기 교육 및 관리·감독(점검) 실시 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "6-3",
        title: "제3자 제공 시 법적 근거·동의 확보",
        description: "개인정보를 제3자에게 제공한 사례가 있다면 법적 근거 또는 정보주체 동의를 확보했는지 확인",
        evidenceType: "TEXT",
      },
    ],
  },
  {
    name: "물리적 보안",
    description: "전산실 출입통제 및 보조저장매체 관리 현황",
    items: [
      {
        code: "7-1",
        title: "전산실·자료보관실 출입통제",
        description: "개인정보처리시스템이 설치된 장소의 출입통제 절차 운영 여부",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "7-2",
        title: "보조저장매체(외장하드, USB 등) 관리",
        description: "개인정보가 저장된 보조저장매체의 보관·반출입·폐기 절차 운영 여부",
        evidenceType: "STATUS",
      },
    ],
  },
  {
    name: "교육 및 자체점검",
    description: "개인정보취급자 교육 및 자체 점검 실시 현황",
    items: [
      {
        code: "8-1",
        title: "개인정보취급자 정기 교육(연 1회 이상)",
        description: "개인정보취급자를 대상으로 연 1회 이상 교육을 실시하고 있는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "8-2",
        title: "자체 점검 실시 및 결과 기록",
        description: "개인정보 보호법에 따른 자체 점검을 실시하고 결과를 기록·보관하는지 확인",
        evidenceType: "STATUS_FILE",
      },
    ],
  },
  {
    name: "유출 등 사고 대응체계",
    description: "유출사고 대응 매뉴얼 및 실제 사고 발생·조치 현황",
    items: [
      {
        code: "9-1",
        title: "유출 대응 매뉴얼 및 비상연락체계 구축",
        description: "개인정보 유출 등 사고 발생 시 대응 절차와 비상연락망이 마련되어 있는지 확인",
        evidenceType: "STATUS_FILE",
      },
      {
        code: "9-2",
        title: "최근 1년 내 유출사고 발생 여부 및 조치 내역",
        description: "유출사고가 있었다면 신고·통지 절차 준수 여부와 조치 내역을 서술",
        evidenceType: "TEXT",
      },
    ],
  },
];

async function main() {
  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const c = CATEGORIES[ci];
    const category = await prisma.category.upsert({
      where: { id: `seed-cat-${ci}` },
      update: { name: c.name, description: c.description, order: ci },
      create: {
        id: `seed-cat-${ci}`,
        name: c.name,
        description: c.description,
        order: ci,
      },
    });

    for (let ii = 0; ii < c.items.length; ii++) {
      const it = c.items[ii];
      await prisma.item.upsert({
        where: { id: `seed-item-${ci}-${ii}` },
        update: {
          title: it.title,
          description: it.description,
          evidenceType: it.evidenceType ?? "STATUS_FILE",
          order: ii,
          categoryId: category.id,
          code: it.code,
        },
        create: {
          id: `seed-item-${ci}-${ii}`,
          categoryId: category.id,
          code: it.code,
          title: it.title,
          description: it.description,
          evidenceType: it.evidenceType ?? "STATUS_FILE",
          order: ii,
        },
      });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "관리자";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });

  console.log(`시드 완료: 카테고리 ${CATEGORIES.length}개, 관리자 계정 ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
