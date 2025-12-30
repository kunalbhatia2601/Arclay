import { Playfair_Display, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Gourmet Indian Food - Premium Pickles & Snacks";

export const metadata = {
  title: `${siteName} | ${siteDescription}`,
  description: "Crafted Flavours. Timeless Taste. Premium pickles & snacks made with patience, purity, and passion. 100% natural ingredients, small batch crafted.",
  keywords: "pickles, Indian food, gourmet snacks, mango pickle, masala cashews, traditional recipes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
