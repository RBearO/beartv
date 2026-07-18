import type { Metadata } from "next";
import { Inter, Space_Grotesk, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { ThemeInitScript } from "@/components/ThemeInitScript";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-default",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-modern",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-friendly",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BearTV — Random Video Chat",
  description:
    "Connect with people around the world through random video chat. Safe, moderated, and free.",
  keywords: ["video chat", "random chat", "omegle alternative", "bear tv"],
  openGraph: {
    title: "BearTV — Random Video Chat",
    description: "Meet new people through random video chat.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${nunito.variable}`}
      data-font-style="default"
      data-theme="dark"
      data-animations="full"
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="font-app antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
