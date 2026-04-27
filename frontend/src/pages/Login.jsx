import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-[1400px] mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-5">
        <p className="overline text-terracotta mb-4">Welcome back</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-espresso leading-[1] mb-6">Sign in.</h1>
        <p className="text-muted-foreground font-light max-w-md">
          Track your orders, save favourites, and check out faster.
        </p>
      </div>
      <form onSubmit={submit} data-testid="login-form" className="lg:col-span-5 lg:col-start-8 space-y-6">
        <div>
          <label className="overline text-muted-foreground">Email</label>
          <input
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="luxury-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="overline text-muted-foreground">Password</label>
          <input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="luxury-input"
            placeholder="••••••••"
          />
        </div>
        {err && <p data-testid="login-error" className="text-sm text-destructive font-light">{err}</p>}
        <button
          data-testid="login-submit"
          type="submit"
          disabled={submitting}
          className="btn-sharp w-full bg-espresso text-bone py-4 hover:bg-terracotta disabled:opacity-50 transition-colors"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-muted-foreground font-light">
          New here?{" "}
          <Link data-testid="register-link" to="/register" className="text-espresso underline underline-offset-4 hover:text-terracotta">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
