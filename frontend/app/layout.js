// layout.js is the root layout for the Next.js application.
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "SpotSync Upload",
  description: "Upload module",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

