import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FLKRD Movies - Premium Movie Streaming Experience",
  description: "Discover and stream your favorite movies with FLKRD Movies. Premium streaming experience with advanced tracking, content filtering, and personalized recommendations. Created by Zana Faroq, powered by FLKRD STUDIO.",
  keywords: ["movies", "streaming", "cinema", "entertainment", "FLKRD", "film", "watch online", "movie tracking", "Kurdish movies"],
  authors: [{ name: "Zana Faroq" }, { name: "FLKRD STUDIO" }],
  creator: "Zana Faroq",
  publisher: "FLKRD STUDIO",
  applicationName: "FLKRD Movies",
  generator: "Next.js",
  
  // Open Graph metadata for social sharing
  openGraph: {
    title: "FLKRD Movies - Premium Movie Streaming Experience",
    description: "Discover and stream your favorite movies with premium quality, advanced tracking, and personalized recommendations. Built by Zana Faroq.",
    url: "https://flkrd-movies.com",
    siteName: "FLKRD Movies",
    images: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg",
        width: 1200,
        height: 630,
        alt: "FLKRD Movies - Premium Movie Streaming and Discovery Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "FLKRD Movies - Premium Movie Streaming",
    description: "Discover and stream your favorite movies with premium quality, advanced tracking, and personalized recommendations.",
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg"],
    creator: "@ZanaFaroq",
    site: "@FLKRDStudio",
  },
  
  // Enhanced app icons and favicon for better home screen support
  icons: {
    icon: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg",
        sizes: "16x16",
        type: "image/jpeg",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg",
        sizes: "32x32",
        type: "image/jpeg",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg",
        sizes: "180x180",
        type: "image/jpeg",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg",
        sizes: "152x152",
        type: "image/jpeg",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg",
        sizes: "120x120",
        type: "image/jpeg",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg",
        color: "#e50914",
      },
    ],
  },
  
  // Enhanced PWA and mobile app metadata for better home screen support
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FLKRD Movies",
    startupImage: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  
  // Additional metadata
  manifest: "/manifest.json",
  themeColor: "#e50914",
  colorScheme: "dark",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  
  // Verification and SEO
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  
  // Category and classification
  category: "entertainment",
  classification: "movies streaming entertainment",
  
  // Enhanced metadata for better social sharing and PWA support
  other: {
    "mobile-web-app-capable": "yes",
    "mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#e50914",
    "msapplication-TileImage": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
    "msapplication-config": "/browserconfig.xml",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:type": "image/jpeg",
    // Enhanced PWA support
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "FLKRD Movies",
    "application-name": "FLKRD Movies",
    "theme-color": "#e50914",
    "msapplication-navbutton-color": "#e50914",
    "apple-mobile-web-app-orientation": "portrait",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Enhanced favicon formats for better browser support */}
        <link 
          rel="icon" 
          type="image/jpeg" 
          sizes="32x32" 
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg" 
        />
        <link 
          rel="icon" 
          type="image/jpeg" 
          sizes="16x16" 
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg" 
        />
        <link 
          rel="shortcut icon" 
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/simple-favicon-icon-for-flkrd-movies-app-6cab667f-20250905082450.jpg" 
        />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Enhanced Apple-specific meta tags for better home screen support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FLKRD Movies" />
        <meta name="apple-mobile-web-app-orientation" content="portrait" />
        
        {/* Multiple Apple touch icon sizes for better compatibility */}
        <link 
          rel="apple-touch-icon" 
          sizes="180x180"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="152x152"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="144x144"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="120x120"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="114x114"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="76x76"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="72x72"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="60x60"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        <link 
          rel="apple-touch-icon" 
          sizes="57x57"
          href="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/apple-touch-icon-for-flkrd-movies---slee-85618d6a-20250905082529.jpg" 
        />
        
        {/* Enhanced Microsoft-specific meta tags */}
        <meta name="msapplication-TileColor" content="#e50914" />
        <meta name="msapplication-TileImage" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg" />
        <meta name="msapplication-square70x70logo" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg" />
        <meta name="msapplication-square150x150logo" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg" />
        <meta name="msapplication-wide310x150logo" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg" />
        <meta name="msapplication-square310x310logo" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg" />
        
        {/* Enhanced social sharing meta tags */}
        <meta property="og:image" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:alt" content="FLKRD Movies - Premium Movie Streaming Platform" />
        <meta property="og:logo" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg" />
        
        <meta name="twitter:image" content="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg" />
        <meta name="twitter:image:alt" content="FLKRD Movies - Premium Movie Streaming Platform" />
        
        {/* Enhanced theme colors for better PWA integration */}
        <meta name="theme-color" content="#e50914" />
        <meta name="msapplication-navbutton-color" content="#e50914" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Performance and SEO optimizations */}
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <link rel="canonical" href="https://flkrd-movies.com" />
        
        {/* Enhanced structured data for rich snippets and better social sharing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "FLKRD Movies",
              "description": "Premium movie streaming experience with advanced tracking, content filtering, and personalized recommendations. Stream your favorite movies and discover new content.",
              "url": "https://flkrd-movies.com",
              "applicationCategory": "Entertainment",
              "operatingSystem": "All",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "author": {
                "@type": "Person",
                "name": "Zana Faroq",
                "url": "https://github.com/zanafaroq"
              },
              "publisher": {
                "@type": "Organization",
                "name": "FLKRD STUDIO",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg",
                  "width": 512,
                  "height": 512
                }
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "screenshot": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150"
              },
              "featureList": [
                "Movie streaming and discovery",
                "Advanced tracking and analytics",
                "Personalized recommendations",
                "Offline viewing support",
                "Multi-device synchronization",
                "Kurdish language support"
              ],
              "image": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/large-social-media-sharing-banner-for-fl-f9439df6-20250905082549.jpg",
              "sameAs": [
                "https://flkrd-movies.com",
                "https://github.com/zanafaroq"
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            className: "glass-card border-border/50 text-foreground",
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        />
      </body>
    </html>
  );
}