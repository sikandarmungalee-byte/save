export const SHOWCASE_CONTACT = {
  phone: '+27 61 364 5712',
  phoneDisplay: '+27 61 364 5712',
  phoneHref: 'tel:+27613645712',
  whatsappNumber: '27613645712',
  whatsappDisplay: 'Chat with Us on WhatsApp',
  whatsappHref: 'https://wa.me/27613645712?text=Hello%20Savour%C3%A9%2C%20I%20would%20like%20to%20enquire%20about%20your%20artisanal%20pastry%20range.',
  email: 'info@savoure.co.za',
  emailHref: 'mailto:info@savoure.co.za',
  alternateEmail: 'orders@savoure.co.za',
  address: 'South Africa · Nationwide Cold-Chain Delivery',
  operatingHours: 'Mon - Fri: 06:00 - 17:00 | Sat: 06:00 - 13:00',
};

export type CraftSpecialty = ShowcaseProductItem;

export interface ShowcaseProductItem {
  id: string;
  name: string;
  detail: string;
  tone: 'roti' | 'wrap' | 'samosa' | 'springroll';
  mark: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  packSpec: string;
  sizeSpec: string;
  tags: string[];
  highlights: string[];
}

export const SHOWCASE_COLLECTION: ShowcaseProductItem[] = [
  {
    id: 'roti',
    name: 'Classic Roti',
    detail: '12 soft flatbreads',
    tone: 'roti',
    mark: 'ROTI',
    category: 'Traditional Flatbreads',
    tagline: 'Melt-in-the-mouth multi-layered lachha flake',
    description:
      'Soft, flexible, and crafted for everyday moments of tradition. Traditional hand-stretched recipe with pure vegetable shortening and clarified butter for distinct airy golden layers that peel apart effortlessly.',
    image: '/showcase/savoure-roti.png',
    packSpec: 'Pack of 12 Rotis (Dozen) & Catering Crates',
    sizeSpec: '200mm Diameter',
    tags: ['Vegan', 'Halal', 'Made with care'],
    highlights: ['Multi-layered flake structure', 'Tava ready in 45 seconds', 'Stays soft without drying out'],
  },
  {
    id: 'tortilla',
    name: 'Tortilla Wraps',
    detail: '12 artisanal wraps',
    tone: 'wrap',
    mark: 'WRAPS',
    category: 'Artisanal Wraps',
    tagline: 'Light, foldable, and ready for whatever you are making next',
    description:
      'Formulated with stone-ground flour and natural moisture binders to guarantee maximum foldability. Perfect for loaded burritos, deli wraps, cold lunchboxes, and grilled paninis without edge cracking.',
    image: '/showcase/savoure-tortilla.png',
    packSpec: 'Pack of 12 Wraps (Dozen) & Foodservice Boxes',
    sizeSpec: '250mm & 300mm Diameter',
    tags: ['Vegan', 'Halal', 'Zero cracking'],
    highlights: ['Zero split when rolled cold or hot', 'Clean label ingredients', 'Ideal for delis & restaurants'],
  },
  {
    id: 'samoosa',
    name: 'Triangle Samosa Pastry',
    detail: '50 pastry strips',
    tone: 'samosa',
    mark: 'SAMOSA',
    category: 'Pastry Strips',
    tagline: 'Precision-cut strips for razor-sharp folding corners',
    description:
      'Golden, delicate pastry sheets for crisp, generous parcels made to be passed around. Handcrafted using unbleached wheat flour and pure vegetable shortenings for a delicate bubble-blistered crust.',
    image: '/showcase/savoure-samoosa.png',
    packSpec: 'Commercial 50-Strip Packs & Wholesale Dozens',
    sizeSpec: '70mm × 250mm Strips',
    tags: ['Halal', 'Porous blister', 'Zero oil retention'],
    highlights: ['Zero tear during corner folding', 'Porous blistering when fried', '100% vegetarian fats'],
  },
  {
    id: 'springroll',
    name: 'Spring Roll Pastry',
    detail: '30 tissue-thin sheets',
    tone: 'springroll',
    mark: 'SPRING ROLL',
    category: 'Pastry Sheets',
    tagline: 'Glass-like crispness with zero oil retention',
    description:
      'Engineered specifically for high-moisture vegetable, chicken, and prawn fillings. Delicately thin sheets that peel apart without sticking, frying to an acoustic golden crunch that resists sogginess even under buffet warmers.',
    image: '/showcase/savoure-springroll.png',
    packSpec: 'Commercial 30-Sheet Packs & Custom Cartons',
    sizeSpec: '215mm × 215mm Square',
    tags: ['Vegan', 'Halal', 'Glass-like crunch'],
    highlights: ['Micro-thin sheet separation', 'Resists filling moisture', 'Fries to a glass-shatter crunch'],
  },
];

export const CRAFT_SPECIALTIES = SHOWCASE_COLLECTION;

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'ordering' | 'products' | 'wholesale' | 'delivery';
}

export const SHOWCASE_FAQS: FAQItem[] = [
  {
    id: 'q1',
    category: 'ordering',
    question: 'How do I place an enquiry or order with Savouré?',
    answer:
      'Simply click "Enquire now" on any page or tap the Contact tab. You can message our wholesale desk directly on WhatsApp (+27 61 364 5712) or submit your requirements via our online enquiry form. We deliver nationwide across South Africa with prompt confirmation.',
  },
  {
    id: 'q2',
    category: 'ordering',
    question: 'Can I order in Dozens or Commercial Foodservice Packs?',
    answer:
      'Yes, we cater to both. Dozens (calculated in 12s) are ideal for banquet caterers, restaurants, and home cooks calculating per-portion prep. We also supply sealed commercial packs (such as 30 sheets per spring roll pack, 50 strips per samoosa pack, or 12 rotis per pack) suited for retail shelves and high-volume prep lines.',
  },
  {
    id: 'q3',
    category: 'wholesale',
    question: 'Do you offer sample tasting packs for executive chefs and restaurants?',
    answer:
      'Yes! We provide complimentary tasting sample packs to verified commercial caterers, restaurant groups, and retail delis looking to test our pastry crispness, folding strength, and frying performance. Click "Enquire now" and select "Sample Tasting Pack" to request yours.',
  },
  {
    id: 'q4',
    category: 'products',
    question: 'Are Savouré pastry sheets, wraps, and rotis Halaal certified?',
    answer:
      'Yes, 100%. All Savouré products are strictly Halaal compliant. We utilize certified pure vegetable shortenings, clarified butters, unbleached flours, and zero animal-derived enzymes. Our bakery operates under strict SANHA-aligned sanitation standards.',
  },
  {
    id: 'q5',
    category: 'products',
    question: 'Can leftover pastry sheets and rotis be frozen?',
    answer:
      'Yes, our pastry sheets freeze exceptionally well for up to 6 months. To use, simply defrost in the refrigerator overnight or on the counter for 30 minutes in their sealed packaging. Do not microwave pastry sheets to thaw.',
  },
  {
    id: 'q6',
    category: 'delivery',
    question: 'Do you deliver nationwide across South Africa?',
    answer:
      'Yes! We deliver nationwide across all provinces in South Africa. We run daily scheduled cold-chain delivery routes across Gauteng (Johannesburg, Sandton, Midrand, Pretoria), and ship to the Western Cape, KwaZulu-Natal, Free State, Eastern Cape, and nationwide via temperature-controlled logistics.',
  },
];

export const SHOWCASE_TESTIMONIALS = [
  {
    id: 't1',
    author: 'Chef Imran Moola',
    role: 'Executive Caterer · Moola Events & Banqueting',
    quote:
      'Savouré spring roll sheets hold moisture without tearing during large-scale folding. They fry to a clean, non-greasy crisp that guests consistently rave about. Best wholesale pastry supplier.',
  },
  {
    id: 't2',
    author: 'Nadia Hendricks',
    role: 'Owner · The Cape Deli Co',
    quote:
      'The flaky rotis have that authentic layered texture you only get from hand-stretched dough. Ordering weekly dozens via their WhatsApp desk has been completely seamless.',
  },
  {
    id: 't3',
    author: 'Chef David van der Merwe',
    role: 'Head of Culinary · Artisan Street Food Kitchens',
    quote:
      'We switched our restaurant wraps to Savouré tortillas 6 months ago. They fold tight without cracking, warm up beautifully on the flat-top, and stay fresh significantly longer than commercial factory brands.',
  },
];
