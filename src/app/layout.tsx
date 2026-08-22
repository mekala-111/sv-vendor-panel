import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { AppToasts } from "@/components/toast/AppToasts";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SV Live Events — Vendor Panel",
  description: "Manage your customers, live events, themes, and payments.",
  icons: {
    icon: "/img/logo.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <AppToasts>{children}</AppToasts>
      </body>
    </html>
  );
}
