import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="mb-2 text-lg font-semibold">개인정보 처리시스템 점검 자료 취합</h1>
        <p className="mb-5 text-sm text-slate-600">
          자료 제출 담당자는 보호담당자에게 전달받은 <b>제출 링크</b>로 접속해주세요.
        </p>
        <Link href="/admin" className="btn-secondary">관리자 로그인</Link>
      </div>
    </main>
  );
}
