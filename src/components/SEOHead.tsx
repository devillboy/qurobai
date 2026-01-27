import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  jsonLd?: object;
}

const defaultMeta = {
  title: "QurobAi - India's Premier AI Assistant",
  description:
    "Your intelligent AI companion for coding, creating, and solving problems. Real-time data, code expertise, and natural conversations. Built in India, for the world.",
  keywords:
    "AI chatbot, AI assistant, coding helper, India AI, QurobAi, Qurob, artificial intelligence, GPT alternative, free AI, programming help",
  image: "/og-image.png",
  url: "https://qurobai.lovable.app",
};

export function SEOHead({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  url = defaultMeta.url,
  type = "website",
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | QurobAi`
    : defaultMeta.title;

  // Default JSON-LD for the AI chatbot
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QurobAi",
    description: defaultMeta.description,
    url: defaultMeta.url,
    applicationCategory: "AI Assistant",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@type": "Person",
      name: "Soham",
      nationality: "Indian",
    },
    featureList: [
      "AI Chat",
      "Code Generation",
      "Real-time Data",
      "Image Analysis",
      "Web Search",
    ],
  };

  const structuredData = jsonLd || defaultJsonLd;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Soham from India" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="QurobAi" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />

      {/* Mobile */}
      <meta name="theme-color" content="#4f6af5" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
