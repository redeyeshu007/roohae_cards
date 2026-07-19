"use client";

import { useState } from "react";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, useAuthStore } from "@/lib/api";
import type { LocalAuthPayload } from "@/lib/types";
import { apiErrorMessage } from "@roohae/ui";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.post<{ success: true; data: LocalAuthPayload }>('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setSession(user as any, { accessToken, refreshToken });
      
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`h-[100dvh] w-full flex items-center justify-center bg-[#F8F4EF] relative overflow-hidden ${jakarta.className}`}
    >
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 z-50 flex items-center gap-3 text-[#6B6B6B] hover:text-[#1F1F1F] transition-colors group"
      >
        <div className="w-10 h-10 rounded-full border border-[#E7DDD6] bg-white/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:border-white group-hover:shadow-[0_4px_12px_rgb(0,0,0,0.04)] transition-all duration-300">
          <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[13px] font-medium hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
          Back to Home
        </span>
      </Link>

      {/* Subtle paper grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Abstract Animated Mesh / Rings */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full border border-[#D98CA6]/20 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full border border-[#1F1F1F]/5 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-[90%] max-w-[440px] max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden p-8 sm:p-10 bg-white/60 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_80px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center">
        {/* Logo Inside the Card for compactness */}
        <div className="relative w-[80px] h-[80px] md:w-[90px] md:h-[90px] mb-4">
          <Image
            src="/logo.png"
            alt="Roohae Cards Logo"
            fill
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>

        <h1
          className={`${cormorant.className} text-3xl md:text-4xl font-semibold text-[#1F1F1F] mb-2 text-center`}
        >
          Welcome
        </h1>
        <p className="text-[#6B6B6B] text-center text-[14px] mb-6 leading-relaxed px-2 font-light">
          Sign in to craft your memories.
        </p>

        <form suppressHydrationWarning className="w-full flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {/* Email Input */}
          <div className="relative w-full group">
            <input
              id="email"
              type="email"
              className="peer w-full px-5 pt-6 pb-2 bg-white/70 border border-[#E7DDD6] rounded-2xl text-[#1F1F1F] outline-none transition-all duration-300 focus:border-[#D98CA6] focus:ring-[3px] focus:ring-[#D98CA6]/10 placeholder-transparent hover:border-[#D98CA6]/50 focus:bg-white text-[15px]"
              placeholder="Email Address"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              suppressHydrationWarning
            />
            <label
              htmlFor="email"
              className="absolute left-5 top-2 text-[11px] font-medium text-[#6B6B6B] transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[14px] peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#D98CA6]"
            >
              Email Address
            </label>
          </div>

          {/* Password Input */}
          <div className="relative w-full group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="peer w-full pl-5 pr-10 pt-6 pb-2 bg-white/70 border border-[#E7DDD6] rounded-2xl text-[#1F1F1F] outline-none transition-all duration-300 focus:border-[#D98CA6] focus:ring-[3px] focus:ring-[#D98CA6]/10 placeholder-transparent hover:border-[#D98CA6]/50 focus:bg-white text-[15px]"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              suppressHydrationWarning
            />
            <label
              htmlFor="password"
              className="absolute left-5 top-2 text-[11px] font-medium text-[#6B6B6B] transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[14px] peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#D98CA6]"
            >
              Password
            </label>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1F1F1F] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
            </button>
          </div>

          <div className="flex justify-end items-center w-full pt-1">
            <Link
              href="#"
              className="text-[13px] text-[#6B6B6B] hover:text-[#1F1F1F] transition-colors relative group"
            >
              Forgot Password?
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#1F1F1F] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          <div className="pt-2">
            <button
              suppressHydrationWarning
              type="submit"
              className="group relative w-full flex items-center justify-center gap-2 bg-[#1F1F1F] text-white py-3.5 px-6 rounded-2xl font-medium text-[15px] transition-all duration-500 hover:bg-black hover:-translate-y-1 hover:shadow-[0_12px_24px_rgb(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F1F1F] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </div>
        </form>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#E7DDD6]"></div>
          <span className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.2em] uppercase">OR</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#E7DDD6]"></div>
        </div>

        <button suppressHydrationWarning className="w-full flex items-center justify-center gap-3 bg-transparent border border-[#E7DDD6] text-[#1F1F1F] py-3 px-6 rounded-2xl font-medium text-[14px] transition-all duration-300 hover:bg-white hover:border-transparent hover:-translate-y-1 hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] focus:outline-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-[14px] text-[#6B6B6B]">
          New to Roohae?{" "}
          <Link
            href="/register"
            className="text-[#D98CA6] font-semibold relative group inline-block"
          >
            Create Account
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#D98CA6] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </p>
      </div>
    </div>
  );
}
