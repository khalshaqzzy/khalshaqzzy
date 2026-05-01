import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muhammad Khalfani Shaquille Indrajaya / Interstellar Atlas",
  description: "AI engineering, backend systems, systems architecture, and cloud-native execution profile."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
