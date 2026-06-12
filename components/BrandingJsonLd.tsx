// components/BrandingJsonLd.tsx
import React from "react";

export default function BrandingJsonLd() {
  const canonicalUrl = "https://www.etherealinn.com/ethereal-inn";

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      // 🌟 Parent Corporate Entity (LLP)
      {
        "@type": "HospitalityBusiness",
        "@id": "https://www.etherealinn.com/#corporate-llp",
        "name": "Ethereal Inn Hospitality LLP",
        "url": "https://www.etherealinn.com",
        "logo": "https://www.etherealinn.com/logo-bg.jpeg",
        "sameAs": [
          "https://www.linkedin.com/company/etherealinn",
          "https://www.instagram.com/etherealinn"
        ],
        "description": "A premier multi-tenant hospitality corporation operating premium budget lodging networks, curated lifestyle aesthetic spaces, and advanced enterprise tech ecosystems.",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-8796211849",
          "contactType": "customer service",
          "email": "etherealinn055@gmail.com",
          "availableLanguage": ["en", "hi"]
        },
        // 🔗 Linking Child Operational Brands to the Parent LLP
        "subOrganization": [
          {
            "@type": "LocalBusiness",
            "name": "Ethereal Inn",
            "description": "Premium luxury-budget lodging network and modern boutique stays."
          },
          {
            "@type": "LocalBusiness",
            "name": "Ethereal Glam",
            "description": "Premium curated lifestyle, aesthetics, and elevated hospitality presentations."
          },
          {
            "@type": "FoodEstablishment",
            "name": "Urban Ambrosia",
            "description": "Premium culinary destinations, cafe concepts, and upscale food & beverage management units."
          }
        ]
      },

      // 🌐 Website Entity
      {
        "@type": "WebSite",
        "@id": "https://www.etherealinn.com/#website",
        "url": "https://www.etherealinn.com",
        "name": "Ethereal Inn",
        "publisher": {
          "@id": "https://www.etherealinn.com/#corporate-llp"
        },
        "description": "Frictionless multi-property tracking, dynamic inventory management, and day-end autonomous financial ledger reconciliation loops."
      },

      // 📄 Current WebPage Entity
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

      // 💻 Software / Tech Solution Entity
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}/#software`,
        "name": "Ethereal Inn Platform",
        "operatingSystem": "All Cloud-capable OS",
        "applicationCategory": "BusinessApplication",
        "browserRequirements": "Requires HTML5 capable browser",
        "publisher": {
          "@id": "https://www.etherealinn.com/#corporate-llp"
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

      // ❓ FAQ Page Entity
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