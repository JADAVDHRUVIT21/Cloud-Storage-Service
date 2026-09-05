import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_URL}/api/v1/auth/register`, {
        full_name: fullName.trim(),
        email: email.trim(),
        password: password,
      });

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-12 py-16 text-white lg:flex lg:flex-col">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-3xl shadow-lg shadow-blue-500/30">
                ☁
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-wide">
                  CloudVault
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Your files. Anywhere. Anytime.
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <h2 className="text-5xl font-bold leading-tight tracking-tight">
                Your digital world,
                <br />
                safely stored in{" "}
                <span className="text-blue-400">
                  one place.
                </span>
              </h2>

              <p className="mt-7 max-w-lg text-lg leading-7 text-slate-300">
                Store, organize, preview, and manage your important files with
                a modern cloud storage experience designed for simplicity.
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="text-2xl font-bold">
                    20 GB
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Storage
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="text-2xl font-bold">
                    Secure
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Files
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="text-2xl font-bold">
                    Fast
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Access
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 text-sm text-slate-500">
            © {new Date().getFullYear()} CloudVault
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
                  ☁
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    CloudVault
                  </h1>

                  <p className="text-sm text-slate-500">
                    Your files. Anywhere. Anytime.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold tracking-widest text-blue-600">
                GET STARTED
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                Create your account
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Create an account and start storing your files securely.
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="mt-8 space-y-5"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                  {success}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}

              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Sign in
              </button>
            </div>

            <div className="mt-10 text-center text-xs text-slate-400">
              CloudVault • Secure Cloud Storage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;