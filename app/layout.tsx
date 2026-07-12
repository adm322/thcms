import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TrainHub — Malaysia HR & Training Platform",
  description:
    "Malaysian HR management and training development platform. Browse programs, manage employees, payroll, leave, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var s=localStorage.getItem("trainhub-dark");if(s==="true"||(!s&&window.matchMedia("(prefers-color-scheme:dark)").matches))d.classList.add("dark")}catch(e){}})()`,
          }}
        />
        {/*
          Browser-side error interceptor — loaded as a plain static
          <script src> (not the Next.js <Script> wrapper) so it runs
          immediately on parse, before any hydration or app JS. Forwards
          JS errors, unhandled promise rejections, and failed fetch/XHR
          calls to the local chrome-log-server at
          http://localhost:3100/log-error. See chrome-log-server/README.md.
        */}
        <script src="/chrome-log-interceptor.js" />
      </head>
      <body className="min-h-full bg-background text-foreground overflow-x-hidden">
        <NextTopLoader color="#8b5cf6" showSpinner={true} />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
