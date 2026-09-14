"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setErrorMessage(
        mode === "login"
          ? "이메일 또는 비밀번호를 확인해 주세요."
          : "회원가입하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.",
      );
    } else if (mode === "signup" && !result.data.session) {
      setMessage("가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 주세요.");
    }

    setIsSubmitting(false);
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage("");
    setErrorMessage("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5 py-12 text-[#1d1d1f]">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#2563eb] text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7.5h16M7 4v3.5M17 4v3.5M5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20Z" />
              <path d="M8 12h3v3H8z" />
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
            기현이가 만든 AI 가계부
          </h1>
          <p className="mt-3 text-base text-[#6e6e73]">
            나만의 수입과 지출을 안전하게 기록하세요.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-6 sm:p-8">
          <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f3f1] p-1.5">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`min-h-12 rounded-xl text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-white text-[#2563eb]"
                  : "text-[#6e6e73]"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => changeMode("signup")}
              className={`min-h-12 rounded-xl text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-white text-[#2563eb]"
                  : "text-[#6e6e73]"
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-3 block text-base font-semibold">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
                required
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-3 block text-base font-semibold">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="6자 이상 입력해 주세요"
                minLength={6}
                required
                className="field"
              />
            </div>

            {errorMessage && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-[#eff4ff] px-4 py-3 text-sm text-[#2563eb]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-[#2563eb] text-base font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "처리 중..."
                : mode === "login"
                  ? "로그인"
                  : "회원가입"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
