import "./globals.css";
import type { Metadata, Viewport } from "next";
import { NavBar } from "@/components/NavBar";
import { themeBootScript } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Daily Startup Finder",
  description: "Find startups hiring for your skills — matched to your resume, with the reason for every match.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the phone tab bar sit above the home indicator (safe-area padding)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e13" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may add class="dark" before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <NavBar />
        {/* Extra bottom padding on phones so content isn't hidden behind the tab bar. */}
        <main className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-6">{children}</main>
      </body>
    </html>
  );
}
