// app/layout.tsx
import { Tajawal, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import { InstallProvider } from "@/context/InstallContext";
import type { Metadata, Viewport } from "next";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Trois Huit | 3x8",
  description: "Advanced shift management PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trois Huit",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={`${tajawal.variable} ${jetbrainsMono.variable} antialiased selection:bg-blue-500/30 select-none bg-[#020617] text-[#f8fafc]`}
      >
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-6B4HMT8E9K`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6B4HMT8E9K');
            `,
          }}
        />

        {/* Microsoft Clarity Analytics */}
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vonl4y7r9x");`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <InstallProvider>
            <ServiceWorkerRegistration />
            <ThemeAccentApplier />
            {children}
            <InstallPrompt />
          </InstallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function ThemeAccentApplier() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("trois_huit_settings");
      if (saved) {
        const { accentColor } = JSON.parse(saved);
        if (accentColor) {
          document.documentElement.setAttribute("data-accent", accentColor);
        }
      }
    } catch (_) {}
  }
  return null;
}
