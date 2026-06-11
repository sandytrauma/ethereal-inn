// components/BrandingJsonLd.tsx
import React from "react";

export default function BrandingJsonLd() {
  const canonicalUrl = "https://www.etherealinn.com/ethereal-inn";

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.etherealinn.com/#organization",
        "name": "Ethereal Inn",
        "url": "https://www.etherealinn.com",
        "logo": "https://www.etherealinn.com/logo-bg.jpeg",
        "sameAs": [
          "https://www.linkedin.com/company/etherealinn",
          "https://www.instagram.com/etherealinn"
        ],
        "description": "A high-performance cloud-native multi-tenant operating ecosystem engineered for automated hospitality management and wellness workflows.",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-8796211849",
          "contactType": "customer service",
          "email": "partners@etherealinn.com",
          "availableLanguage": ["en", "hi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.etherealinn.com/#website",
        "url": "https://www.etherealinn.com",
        "name": "Ethereal Inn",
        "publisher": {
          "@id": "https://www.etherealinn.com/#organization"
        },
        "description": "Frictionless multi-property tracking, dynamic inventory management, and day-end autonomous financial ledger reconciliation loops."
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}/#webpage`,
        "url": canonicalUrl,
        "name": "Ethereal Inn - Premium Partner Branding & Operations Ecosystem",
        "isPartOf": {
          "@id": "https://www.etherealinn.com/#website"
        },
        "description": "Align your hospitality property with the Ethereal brand network. Streamline your property management tracking, multi-vector inventory controls, and financial operations from a single dashboard node."
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}/#software`,
        "name": "Ethereal Inn Platform",
        "operatingSystem": "All Cloud-capable OS",
        "applicationCategory": "BusinessApplication",
        "browserRequirements": "Requires HTML5 capable browser",
        "publisher": {
          "@id": "https://www.etherealinn.com/#organization"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "0.00",
          "description": "Custom enterprise onboarding quote structures upon formal node prospectus application evaluation passes."
        },
        "featureList": [
          "Plug-and-play property activation loops with zero local development overhead",
          "Multi-vector structural inventory engine balancing milliliters, grams, packages, and units concurrently",
          "Day-end autonomous accounting and dynamic reorder threshold matrix monitors",
          "Unified multi-branch dashboard cross-reconciliation control"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}/#faq`,
        "isPartOf": {
          "@id": `${canonicalUrl}/#webpage`
        },
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How fast can we go live after partnering with Ethereal Inn?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Instantly. Because our core engine is entirely cloud-native and multi-tenant, you bypass heavy hardware setups or localized code installations. You simply register your hotel prospectus parameters, map your custom domain, and go live instantly."
            }
          },
          {
            "@type": "Question",
            "name": "Can the inventory pipeline handle items outside standard ml metrics?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Our stock tracking module features multi-vector support out of the box. You can configure and monitor items in milliliters, grams, pieces, packets, or kilograms—making it equally powerful for front-of-house consumables and back-office fixed assets."
            }
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}