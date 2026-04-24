'use client';

import { useState, type FormEvent } from 'react';

type LoginFormProps = {
  onSignIn: (credentials: { email: string; password: string }) => void;
};

export function LoginForm({ onSignIn }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onSignIn({ email, password });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(79,142,247,0.14),_transparent_30%),linear-gradient(180deg,_#0f1117_0%,_#0a0c13_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-brand-500/12 blur-3xl" />
        <div className="absolute right-[-7rem] top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-brand-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[28px] border border-white/[0.08] bg-[#0c1018]/80 p-6 sm:p-8 shadow-2xl shadow-black/25 backdrop-blur-xl"
        >
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-brand-200">
              Umurava Talent Screening
            </div>
            <h1 className="font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Sign in
            </h1>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="form-input h-12 rounded-xl"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                className="form-input h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="btn-primary btn h-12 w-full justify-center rounded-xl text-sm font-medium">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
