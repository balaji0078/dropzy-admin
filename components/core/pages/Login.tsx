"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Shield, ArrowRight, Loader2, Smartphone, KeyRound, ArrowLeft } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { coreAuth, coreSession, hasPortalRole, STAFF_ONLY_COPY } from "@/lib/core-api";
import { errorCopy } from "@/lib/core-errors";
import type { AuthResult, MfaEnrolment, OtpChallenge, Role } from "@/lib/core-types";
import { landingRoute } from "@/lib/roles";
import { OtpInput, QrCode } from "@/components/core/domain";
import { inputCls } from "@/components/core/ui";
import DropzyScene from "@/components/layout/DropzyScene";

type Step = "phone" | "otp" | "mfa" | "enrol-token" | "enrol-code";
const PHONE_RE = /^[6-9][0-9]{9}$/;

function rolesOf(r: AuthResult): Role[] {
  return (r.user?.roles || []).map((g) => g.role);
}

function LoginFlow() {
  const router = useRouter();
  const { user, roles, loading } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [enrolmentToken, setEnrolmentToken] = useState("");
  const [enrolment, setEnrolment] = useState<MfaEnrolment | null>(null);
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<{ title: string; ref?: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Message from an ended session ("Your session has ended. Please log in again.") or a non-staff login.
  useEffect(() => {
    const flash = coreSession.takeFlash();
    if (flash) setInfo(flash);
  }, []);

  // Already signed in (e.g. reload with a valid cookie session) → landing page.
  useEffect(() => {
    if (!loading && user) router.replace(landingRoute(roles));
  }, [loading, user, roles, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const fail = (e: unknown, ctx: "login" | "mfa" = "login") => {
    const c = errorCopy(e, ctx);
    setError({ title: c.body ? `${c.title} ${c.body}` : c.title, ref: c.correlationId });
  };

  const finish = async (r: AuthResult) => {
    if (r.mfaRequired) {
      setMfaToken(r.mfaToken || "");
      setStep(r.mfaEnrolmentRequired ? "enrol-token" : "mfa");
      return;
    }
    coreSession.apply(r);
    const me = r.user || (await coreAuth.me().catch(() => null));
    if (!me || !hasPortalRole(me)) {
      await coreAuth.logout();
      setStep("phone");
      setCode("");
      setError({ title: STAFF_ONLY_COPY });
      return;
    }
    coreSession.setMe(me);
    router.replace(landingRoute(rolesOf({ ...r, user: me })));
  };

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!PHONE_RE.test(phone)) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const c = await coreAuth.requestOtp(phone);
      setChallenge(c);
      setCode("");
      setResendIn(c.resendAfterSeconds || 30);
      setStep("otp");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!challenge || code.length !== (challenge.codeLength || 6)) return;
    setBusy(true);
    setError(null);
    try {
      await finish(await coreAuth.verifyOtp(challenge.challengeId, phone, code));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verifyMfa = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (totp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await finish(await coreAuth.verifyMfa(mfaToken, totp));
    } catch (err) {
      setTotp("");
      fail(err, "mfa");
    } finally {
      setBusy(false);
    }
  };

  const startEnrolment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enrolmentToken.trim().length < 16) return;
    setBusy(true);
    setError(null);
    try {
      setEnrolment(await coreAuth.enrollMfa(mfaToken, enrolmentToken.trim()));
      setStep("enrol-code");
    } catch (err) {
      fail(err, "mfa");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrolment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (totp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await finish(await coreAuth.confirmMfaEnrolment(mfaToken, enrolmentToken.trim(), totp));
    } catch (err) {
      setTotp("");
      fail(err, "mfa");
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setStep("phone");
    setCode("");
    setTotp("");
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-canvas px-6 py-12 overflow-hidden">
      {/* soft violet glow behind the card (DropzyColors.glow) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-dz-glow" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-2xl overflow-hidden border border-line shadow-rb-xl bg-surface">
          {/* Hero header, like the customer app's DropzyHero */}
          <div className="relative h-[188px] bg-dz-hero">
            <DropzyScene className="absolute inset-0 w-full h-full" sun={[370, 112]} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden />
            <div className="relative z-10 px-6 pt-6 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-dz-offer ring-1 ring-gold/60 shadow-violet flex-shrink-0">
                <Package className="w-6 h-6 text-gold" aria-hidden />
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold text-white leading-tight">Dropzy Staff Portal</h1>
                <p className="text-[13px] text-[#CFC8E6] mt-0.5">Operations · Warehouse · Support · Finance</p>
              </div>
            </div>
          </div>

        <div className="p-7 space-y-4 border-t border-line">
          {info && <p className="rounded-xl bg-warning/10 border border-warning/40 px-4 py-3 text-[13px] text-warning" role="status">{info}</p>}
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/40 px-4 py-3 text-[13px] text-danger" role="alert">
              <p>{error.title}</p>
              {error.ref && <p className="text-[11px] font-mono mt-1 text-danger">Ref: {error.ref}</p>}
            </div>
          )}

          {step === "phone" && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-[12px] font-bold text-ink-soft uppercase tracking-wider">Mobile number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-soft" aria-hidden>+91</span>
                  <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus maxLength={10} value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="10-digit mobile" className="rb-input pl-12" aria-describedby="phone-hint" />
                </div>
                <p id="phone-hint" className="text-[11px] text-ink-soft">Use the phone number registered for your staff account.</p>
              </div>
              <button type="submit" disabled={!PHONE_RE.test(phone) || busy} className="rb-btn rb-btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden />Sending…</> : <>Get OTP<ArrowRight className="w-4 h-4" aria-hidden /></>}
              </button>
            </form>
          )}

          {step === "otp" && challenge && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                <Smartphone className="w-4 h-4" aria-hidden />
                Enter the code sent to {challenge.phoneMasked || `+91 ${phone}`}
              </div>
              <OtpInput length={challenge.codeLength || 6} value={code} onChange={(v) => { setCode(v); setError(null); }} autoFocus label="Login code" />
              {challenge.devCode && <p className="text-[11px] text-ink-faint">Development code: <span className="font-mono">{challenge.devCode}</span></p>}
              <button type="submit" disabled={code.length !== (challenge.codeLength || 6) || busy} className="rb-btn rb-btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden />Verifying…</> : "Verify"}
              </button>
              <div className="flex items-center justify-between text-[12px]">
                <button type="button" onClick={back} className="inline-flex items-center gap-1 text-ink-soft hover:text-gold"><ArrowLeft className="w-3.5 h-3.5" aria-hidden />Change number</button>
                <button type="button" onClick={() => requestOtp()} disabled={resendIn > 0 || busy} className="font-semibold text-primary-light hover:text-gold disabled:text-ink-faint disabled:hover:text-ink-faint">
                  {resendIn > 0 ? `Resend in ${resendIn} s` : "Resend"}
                </button>
              </div>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={verifyMfa} className="space-y-4">
              <div className="flex items-center gap-2 text-[13px] text-ink font-semibold"><KeyRound className="w-4 h-4" aria-hidden />Two-factor authentication</div>
              <p className="text-[12px] text-ink-soft">Enter the 6-digit code from your authenticator app.</p>
              <OtpInput length={6} value={totp} onChange={(v) => { setTotp(v); setError(null); }} autoFocus label="Authenticator code" />
              <button type="submit" disabled={totp.length !== 6 || busy} className="rb-btn rb-btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden />Verifying…</> : "Verify"}
              </button>
              <button type="button" onClick={back} className="inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-gold"><ArrowLeft className="w-3.5 h-3.5" aria-hidden />Start again</button>
            </form>
          )}

          {step === "enrol-token" && (
            <form onSubmit={startEnrolment} className="space-y-4">
              <div className="flex items-center gap-2 text-[13px] text-ink font-semibold"><KeyRound className="w-4 h-4" aria-hidden />Set up two-factor authentication</div>
              <div className="space-y-1.5">
                <label htmlFor="enrol" className="block text-[12px] text-ink-soft">Enter the one-time setup code you received from your administrator.</label>
                <input id="enrol" autoFocus value={enrolmentToken} onChange={(e) => { setEnrolmentToken(e.target.value); setError(null); }} className={inputCls} autoComplete="off" maxLength={128} />
              </div>
              <button type="submit" disabled={enrolmentToken.trim().length < 16 || busy} className="rb-btn rb-btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden />Checking…</> : "Continue"}
              </button>
              <button type="button" onClick={back} className="inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-gold"><ArrowLeft className="w-3.5 h-3.5" aria-hidden />Start again</button>
            </form>
          )}

          {step === "enrol-code" && enrolment && (
            <form onSubmit={confirmEnrolment} className="space-y-4">
              <div className="flex items-center gap-2 text-[13px] text-ink font-semibold"><KeyRound className="w-4 h-4" aria-hidden />Set up two-factor authentication</div>
              <p className="text-[12px] text-ink-soft">Scan this QR code with your authenticator app, or enter the secret manually. Then enter the 6-digit code it shows.</p>
              <div className="flex flex-col items-center gap-2">
                <QrCode value={enrolment.otpauthUrl} label="QR code for your authenticator app" />
                <a href={enrolment.otpauthUrl} className="text-[12px] text-primary-light underline hover:text-gold">Open in authenticator app</a>
              </div>
              <div className="rounded-lg bg-surface-alt border border-line px-3 py-2">
                <p className="text-[11px] text-ink-soft">Secret</p>
                <p className="font-mono text-[13px] tracking-wider select-all break-all text-gold">{enrolment.secret}</p>
              </div>
              <OtpInput length={6} value={totp} onChange={(v) => { setTotp(v); setError(null); }} autoFocus label="Authenticator code" />
              <button type="submit" disabled={totp.length !== 6 || busy} className="rb-btn rb-btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden />Confirming…</> : "Confirm and sign in"}
              </button>
            </form>
          )}
        </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
          <Shield className="w-3.5 h-3.5 text-gold" aria-hidden /><span>Dropzy staff only — phone OTP and two-factor authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function CoreLoginPage() {
  return (
    <AuthProvider>
      <LoginFlow />
    </AuthProvider>
  );
}
