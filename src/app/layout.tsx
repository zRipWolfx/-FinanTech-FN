import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import { AppProviders } from "@/modules/shared/ui/AppProviders";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanTech",
  applicationName: "FinanTech",
  description: "FinanTech S.A. — préstamos, cuotas y control de pagos.",
  icons: {
    icon: [{ url: "/Logo_F_Ligth.png", type: "image/png" }],
    shortcut: "/Logo_F_Ligth.png",
    apple: "/Logo_F_Ligth.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${space.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
