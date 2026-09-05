import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaCloud,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaGithub,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    setSocialLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
      
      setTimeout(() => {
        setSocialLoading(false);
      }, 2000);
      
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
      setGoogleLoading(false);
      setSocialLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError("");
    setGithubLoading(true);
    setSocialLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
      
      setTimeout(() => {
        setSocialLoading(false);
      }, 2000);
      
    } catch (err) {
      setError(err.message || "GitHub login failed. Please try again.");
      setGithubLoading(false);
      setSocialLoading(false);
    }
  };

  const LoadingOverlay = ({ provider = "CloudVault" }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="flex flex-col items-center px-4">
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/50">
            <FaCloud className="text-3xl sm:text-4xl md:text-5xl text-white animate-bounce" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 animate-pulse text-center">
          {provider === "google" ? "Google" : provider === "github" ? "GitHub" : "CloudVault"}
        </h2>
        <p className="text-blue-200/80 text-sm sm:text-base md:text-lg text-center">
          {provider === "google" ? "Connecting to Google..." : 
           provider === "github" ? "Connecting to GitHub..." : 
           "Loading your files..."}
        </p>

        <div className="mt-4 sm:mt-6 flex gap-1.5 sm:gap-2">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce"></span>
        </div>

        <div className="mt-6 sm:mt-8 w-32 sm:w-40 md:w-48 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float">
            ☁️
          </div>
          <div className="absolute -bottom-20 -right-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float-delayed">
            ☁️
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[150px] sm:text-[200px] md:text-[300px] animate-spin-slow">
            ☁️
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-5deg); }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
      {(loading || socialLoading) && (
        <LoadingOverlay 
          provider={
            googleLoading ? "google" : 
            githubLoading ? "github" : 
            "CloudVault"
          } 
        />
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-6 xl:p-12">
          <div className="max-w-xl w-full">
            <div className="mb-6 xl:mb-8 flex items-center gap-3 xl:gap-4">
              <div className="flex h-14 w-14 xl:h-16 xl:w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
                <FaCloud className="text-2xl xl:text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-white">
                  CloudVault
                </h1>
                <p className="text-blue-200 text-sm xl:text-base">
                  Your files. Anywhere. Anytime.
                </p>
              </div>
            </div>

            <h2 className="mb-4 xl:mb-6 text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight text-white">
              Your digital world,
              <br />
              safely stored in
              <span className="text-blue-400"> one place.</span>
            </h2>

            <p className="text-base xl:text-lg leading-relaxed text-slate-300 max-w-lg">
              Store, organize, preview, and manage your important files with a
              modern cloud storage experience designed for simplicity.
            </p>

            <div className="mt-8 xl:mt-10 grid grid-cols-3 gap-3 xl:gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 xl:p-4 backdrop-blur">
                <p className="text-xl xl:text-2xl font-bold text-white">
                  20 GB
                </p>
                <p className="text-xs xl:text-sm text-slate-400">
                  Storage
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 xl:p-4 backdrop-blur">
                <p className="text-xl xl:text-2xl font-bold text-white">
                  Secure
                </p>
                <p className="text-xs xl:text-sm text-slate-400">
                  Files
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 xl:p-4 backdrop-blur">
                <p className="text-xl xl:text-2xl font-bold text-white">
                  Fast
                </p>
                <p className="text-xs xl:text-sm text-slate-400">
                  Access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10 md:py-12 lg:py-10 min-h-screen lg:min-h-0">
          <div className="w-full max-w-sm sm:max-w-md">

            {/* Mobile Logo */}
            <div className="mb-6 sm:mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-600">
                  <FaCloud className="text-xl sm:text-2xl text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  CloudVault
                </h1>
              </div>
            </div>

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <p className="mb-1 sm:mb-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-600">
                Welcome back
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-500">
                Access your files and continue where you left off.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 sm:mb-5 rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-2.5 sm:space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || githubLoading || loading}
                className="flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGoogle className="text-base sm:text-lg text-red-500" />
                {googleLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={githubLoading || googleLoading || loading}
                className="flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGithub className="text-lg sm:text-xl text-slate-900" />
                {githubLoading
                  ? "Connecting to GitHub..."
                  : "Continue with GitHub"}
              </button>
            </div>

            {/* Divider */}
            <div className="my-5 sm:my-6 flex items-center gap-3 sm:gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs sm:text-sm text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1.5 sm:mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 sm:mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || githubLoading}
                className="w-full rounded-xl bg-blue-600 px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Footer Links */}
            <p className="mt-6 sm:mt-8 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create account
              </Link>
            </p>

            <p className="mt-8 sm:mt-10 text-center text-xs text-slate-400">
              CloudVault • Secure Cloud Storage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;