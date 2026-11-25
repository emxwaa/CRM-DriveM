import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "DriveM CRM", template: "%s · DriveM CRM" }, icons: { icon: "/DriveM.svg" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body className="antialiased">{children}</body></html>;
}
