export interface CampaignConfig {
  title: string;
  subtitle: string;
  primaryImage: string;
  whatsappMessage: string;
  badge?: string;
  marketingPoints?: string[];
}

export const CAMPAIGN_MAP: Record<string, CampaignConfig> = {
  "couple-friendly-stay": {
    title: "Elite Comfort. Absolute Privacy.",
    subtitle: "Premium boutique stays in New Delhi curated for couples and corporate travelers who refuse to compromise on peace, safety, and price.",
    primaryImage: "/couple-friendly-stay-Ad-01.jpeg",
    badge: "Couple-Friendly & Secure Sanctuary",
    whatsappMessage: "Hello Ethereal Inn, I saw your Couple-Friendly Premium Stay ad. I'd like to check current room rates and availability.",
    marketingPoints: [
      "100% Secure & Private Sanctuary Stays",
      "No-Questions-Asked, Local ID Friendly Check-in",
      "Premium Amenities at Pocket-Friendly Rates",
      "Minutes Away from Delhi Metro Station Network"
    ]
  },
  
  // NEW COMPONENT: Corporate Executive Campaign Mapping
  "corporate-stay": {
    title: "Seamless Business Transit. Premium Living.",
    subtitle: "The ultimate hospitality sanctuary for corporate professionals and business travelers in New Delhi. Engineered for productivity, luxury, and frictionless administrative check-ins.",
    primaryImage: "/Catalogue_1.avif", 
    badge: "Corporate Elite Transit Tier",
    whatsappMessage: "Hello Ethereal Inn Reservations, I am flying into Delhi on business. I would like to check availability, corporate tariffs, and corporate booking arrangements.",
    marketingPoints: [
      "Frictionless GST & Corporate Invoicing Compliance",
      "High-Speed Uninterrupted Wi-Fi & Work Desks",
      "Express 2-Minute Automated Check-In Matrix",
      "Strategic Corporate Tariffs & Long-Term SLAs"
    ]
  },

  "urban-ambrosia": {
    title: "THE ART OF FINE DINING",
    subtitle: "Reserve an exquisite evening at Urban Ambrosia Culinary wing.",
    primaryImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    whatsappMessage: "Hello, I want to reserve a table experience at Urban Ambrosia Culinary."
  },

  "glam-studio": {
    title: "EDITORIAL GLAMOUR AWAITS",
    subtitle: "Book a signature makeover session with our elite master artists.",
    primaryImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    whatsappMessage: "Hello, I am interested in booking a luxury makeover session at Ethereal Glam Studio."
  }
};