export interface ShowcaseProduct {
  name: string;
  note: string;
  description: string;
  detail: string;
  image: string;
  imageClass: string;
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    name: 'Roti',
    note: 'Soft · Flexible · Delicious',
    description: 'A dependable table staple, made fresh in white and brown varieties.',
    detail: 'Small 12 per pack · Medium & large 10 per pack',
    image: '/images/savoure/savoure-roti.png',
    imageClass: 'object-cover',
  },
  {
    name: 'Tortilla Wraps',
    note: 'Soft · Flexible · Delicious',
    description: 'Versatile wraps for generous fillings, platters and everyday menus.',
    detail: 'Small, medium & large · 6 per pack',
    image: '/images/savoure/savoure-tortilla.png',
    imageClass: 'object-cover',
  },
  {
    name: 'Samoosa Pastry',
    note: 'Ready to fill',
    description: 'Consistent pastry sheets made for neat folding and crisp results.',
    detail: 'Three sizes · 95 sheets',
    image: '/images/savoure/savoure-samoosa.png',
    imageClass: 'object-contain',
  },
  {
    name: 'Spring Roll Pastry',
    note: 'Thin · Crispy · Delicious',
    description: 'Fine pastry sheets for golden, delicate spring rolls and starters.',
    detail: 'Three sizes · 50 sheets',
    image: '/images/savoure/savoure-springroll.png',
    imageClass: 'object-contain',
  },
];

export const SHOWCASE_CONTACT = {
  phone: '061 364 5712',
  phoneHref: 'tel:+27613645712',
  whatsappNumber: '27613645712',
  whatsappHref: 'https://wa.me/27613645712?text=Hello%20Savour%C3%A9%2C%20I%20would%20like%20to%20enquire%20about%20your%20products',
  email: 'info@savoure.co.za',
  emailHref: 'mailto:info@savoure.co.za',
  alternateEmail: 'desai.shaahoon@gmail.com',
  address: 'Unit 4, Tradition Square, 18 Artisanal Way, Sandton, Johannesburg, 2196',
};

export const SHOWCASE_NAV_ITEMS = [
  { to: 'home', label: 'Home' },
  { to: 'products', label: 'Products' },
  { to: 'wholesale', label: 'Wholesale' },
  { to: 'about', label: 'Our story' },
  { to: 'shop', label: 'Shop' },
  { to: 'contact', label: 'Contact' },
];
