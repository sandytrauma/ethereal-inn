import { Metadata } from 'next';
import EtherealGlam from '@/components/EtherealGlam';

export const metadata: Metadata = {
  title: 'Ethereal Glam | Luxury Bridal Makeup Studio & Boutique',
  description: 'Discover the art of bridal elegance at Ethereal Glam, a premier boutique and makeup studio under Ethereal Inn Hospitality LLP. Opening soon.',
  openGraph: {
    title: 'Ethereal Glam - Opening Soon',
    description: 'Luxury Bridal Makeup & Couture Boutique.',
    images: ['/glam-preview.jpg'], // Ensure you have a marketing image in public folder
  },
  keywords: ['Bridal Makeup Gurugram', 'Luxury Boutique', 'Ethereal Inn Hospitality', 'Makeup Studio'],
};

export default function Glam() {
  // SEO Structured Data for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Ethereal Glam: Boutique & Makeup Studio",
    "parentOrganization": {
      "@type": "Organization",
      "name": "Ethereal Inn Hospitality LLP"
    },
    "description": "Premium Bridal Makeup and Luxury Couture Boutique.",
    "status": "https://schema.org/ComingSoon"
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