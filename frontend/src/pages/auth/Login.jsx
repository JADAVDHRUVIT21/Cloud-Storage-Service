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

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

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
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError("");
    setGithubLoading(true);

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
    } catch (err) {
      setError(err.message || "GitHub login failed. Please try again.");
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="flex min-h-screen">

        <div className="hidden w-1/2 items-center justify-center p-12 lg:flex">
          <div className="max-w-xl">

            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
                <FaCloud className="text-3xl text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white">
                  CloudVault
                </h1>

                <p className="text-blue-200">
                  Your files. Anywhere. Anytime.
                </p>
              </div>
            </div>

            <h2 className="mb-6 text-5xl font-bold leading-tight text-white">
              Your digital world,
              <br />
              safely stored in
              <span className="text-blue-400"> one place.</span>
            </h2>

            <p className="max-w-lg text-lg leading-relaxed text-slate-300">
              Store, organize, preview, and manage your important files with a
              modern cloud storage experience designed for simplicity.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-2xl font-bold text-white">
                  20 GB
                </p>

                <p className="text-sm text-slate-400">
                  Storage
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-2xl font-bold text-white">
                  Secure
                </p>

                <p className="text-sm text-slate-400">
                  Files
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-2xl font-bold text-white">
                  Fast
                </p>

                <p className="text-sm text-slate-400">
                  Access
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-white px-5 py-10 lg:w-1/2">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <FaCloud className="text-2xl text-white" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  CloudVault
                </h1>

              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold text-slate-900">
                Sign in to your account
              </h2>

              <p className="mt-3 text-slate-500">
                Access your files and continue where you left off.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || githubLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGoogle className="text-lg text-red-500" />

                {googleLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={githubLoading || googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGithub className="text-xl text-slate-900" />

                {githubLoading
                  ? "Connecting to GitHub..."
                  : "Continue with GitHub"}
              </button>

            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>

              <span className="text-sm text-slate-400">
                OR
              </span>

              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || githubLoading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create account
              </Link>
            </p>

            <p className="mt-10 text-center text-xs text-slate-400">
              CloudVault • Secure Cloud Storage
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;