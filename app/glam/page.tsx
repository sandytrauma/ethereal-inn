import { Metadata } from 'next';
import EtherealGlam from '@/components/EtherealGlam';

export const metadata: Metadata = {
  metadataBase: new URL("https://ethereal-inn.vercel.app"),
  title: 'Ethereal Glam | Luxury Bridal & Aesthetic Procedures',
  description: 'Experience elite bridal makeup, couture styling, and advanced aesthetic procedures at Ethereal Glam. Part of Ethereal Inn Hospitality LLP.',
  openGraph: {
    title: 'Ethereal Glam - Procedures & Luxury Styling',
    description: 'Advanced Bridal Artistry and Couture Boutique.',
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&h=630&fit=crop'], 
  },
  keywords: ['Bridal Makeup Delhi', 'Airbrush Makeup', 'Couture Boutique Gurugram', 'Aesthetic Procedures'],
};

export default function Glam() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Ethereal Glam: Boutique & Makeup Studio",
    "description": "Premium Bridal Artistry and Aesthetic Procedures.",
    "parentOrganization": {
      "@type": "Organization",
      "name": "Ethereal Inn Hospitality LLP"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Ethereal Glam Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Signature Airbrush HD Procedure" }},
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Couture Silhouette Draping" }},
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dermal Radiance Prep" }}
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EtherealGlam />
    </>
  );
}