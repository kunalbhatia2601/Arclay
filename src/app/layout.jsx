import { ToastContainer } from "react-toastify";
import { Playfair_Display, Inter, Geist_Mono, Kumbh_Sans } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

// ESSVORA fonts
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

// VedicBro fonts
const kumbhSans = Kumbh_Sans({
  variable: "--font-kumbh",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Gourmet Indian Food - Premium Pickles & Snacks";

// Determine theme based on site name
const getTheme = (name) => {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '');
  if (normalizedName.includes('vedic') || normalizedName.includes('vedicbro')) {
    return 'vedicbro';
  }
  else if (normalizedName.includes('arclay')) {
    return 'arclay';
  }
  else {
    return 'essvora';
  }
};

const theme = getTheme(siteName);

export const metadata = {
  title: `${siteName} | ${siteDescription}`,
  description: "Crafted Flavours. Timeless Taste. Premium pickles & snacks made with patience, purity, and passion. 100% natural ingredients, small batch crafted.",
  keywords: "pickles, Indian food, gourmet snacks, mango pickle, masala cashews, traditional recipes",
};

import ClientTransition from "./components/ClientTransition";
import { getThemeTokens, tokensToCss } from "@/lib/theme";
import { getDefaultCardPreset } from "@/lib/cardPresetServer";
import CardPresetProvider from "./components/CardPresetProvider";
import { getNavigation } from "@/lib/navigationServer";

export default async function RootLayout({ children }) {
  // Design tokens are rendered server-side into a :root block so the correct
  // palette is present in the first paint — no flash of default colours.
  // Fetched here so every product card on the site — including pages the
  // builder does not own — honours the admin's default card style.
  const [{ tokens, customCss }, cardPreset, navigation] = await Promise.all([
    getThemeTokens(),
    getDefaultCardPreset(),
    getNavigation(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      {/* React hoists and dedupes <style> by `href`, managing its attributes
          itself — an `id` here would be dropped on the client and trip a
          hydration mismatch. `precedence` keeps it ordered ahead of the
          stylesheets so components can override the tokens. */}
      <style
        href="theme-tokens"
        precedence="high"
        dangerouslySetInnerHTML={{ __html: tokensToCss(tokens, customCss) }}
      />
      <body
        className={`${playfair.variable} ${inter.variable} ${geistMono.variable} ${kumbhSans.variable} antialiased overflow-x-hidden`}
      >
        <ToastContainer />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <CardPresetProvider preset={cardPreset}>
            <Navbar config={navigation.navbar} mobileConfig={navigation.mobileBar} />
            <ClientTransition>
              {children}
            </ClientTransition>
            {/* Bottom nav spacer for mobile - prevents content from hiding behind fixed bottom nav */}
            <div className="lg:hidden h-16" />
            <Footer config={navigation.footer} />
            <ChatWidget />
            
            {/* Global SVG Gooey Filter for Liquid Effects */}
            <svg className="fixed pointer-events-none opacity-0 invisible w-0 h-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="global-gooey">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="gooey" />
                  <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                </filter>
              </defs>
            </svg>
            </CardPresetProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
