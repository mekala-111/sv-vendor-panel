import type { Metadata } from "next";
import Image from "next/image";
import ui from "@/components/ui.module.css";
import { login } from "@/lib/auth";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Vendor Login — SV Live Events",
};

function errorMessage(error?: string) {
  if (error === "role") return "This account is not a vendor. Use a vendor login.";
  if (error === "session") return "Your session expired. Please sign in again.";
  if (error) return "Invalid email or password. Please try again.";
  return null;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = errorMessage(error);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Image src="/img/logo.png" alt="SV Live Events" width={38} height={38} className={styles.logo} />
          <div>
            <div className={styles.brandName}>SV LIVE</div>
            <div className={styles.brandSub}>EVENTS</div>
          </div>
        </div>

        <h1 className={styles.title}>Vendor Login</h1>
        <p className={styles.subtitle}>Sign in to your SV Live vendor panel</p>

        <form action={login}>
          <label className={ui.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className={`${ui.input} ${styles.field}`}
          />

          <label className={ui.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            className={`${ui.input} ${styles.field}`}
          />

          {message ? (
            <p className={styles.error} role="alert">
              {message}
            </p>
          ) : null}

          <label className={styles.remember}>
            <input type="checkbox" name="remember" />
            Remember me
          </label>

          <button type="submit" className={`${ui.btnPrimary} ${styles.submit}`}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
