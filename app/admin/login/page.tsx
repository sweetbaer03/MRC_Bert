import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { Flash, } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import type { FlashParams } from "@/lib/flash";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: FlashParams }) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold">관리자 로그인</h1>
        <p className="mb-5 text-sm text-slate-500">개인정보 처리시스템 점검 자료 취합</p>
        <Flash error={error} />
        <form action={login} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">비밀번호</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="확인 중...">로그인</SubmitButton>
        </form>
      </div>
    </main>
  );
}
