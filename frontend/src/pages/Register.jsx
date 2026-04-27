import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      await register(email, password, name);
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
        <p className="overline text-terracotta mb-4">Become a member</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-espresso leading-[1] mb-6">Create<br /><em>account.</em></h1>
        <p className="text-muted-foreground font-light max-w-md">
          Members save favourites, track orders, and receive private invitations to drops.
        </p>
      </div>
      <form onSubmit={submit} data-testid="register-form" className="lg:col-span-5 lg:col-start-8 space-y-6">
        <div>
          <label className="overline text-muted-foreground">Full name</label>
          <input
            data-testid="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="luxury-input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="overline text-muted-foreground">Email</label>
          <input
            data-testid="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="luxury-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="overline text-muted-foreground">Password (min 6 characters)</label>
          <input
            data-testid="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="luxury-input"
            placeholder="••••••••"
          />
        </div>
        {err && <p data-testid="register-error" className="text-sm text-destructive font-light">{err}</p>}
        <button
          data-testid="register-submit"
          type="submit"
          disabled={submitting}
          className="btn-sharp w-full bg-espresso text-bone py-4 hover:bg-terracotta disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-sm text-muted-foreground font-light">
          Have one already?{" "}
          <Link data-testid="login-link" to="/login" className="text-espresso underline underline-offset-4 hover:text-terracotta">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
