import type { Metadata } from "next";
import { Roboto, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import Nav from "@/components/Nav";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Contact Sheet — Photography Competition Platform",
  description: "Enter, judge, and follow photography competitions from registration to winner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ReduxProvider>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
