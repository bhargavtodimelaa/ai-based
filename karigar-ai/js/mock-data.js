/* ============================================
   KarigarAI - Mock Data
   ============================================ */

const MOCK_USER = {
    name: 'Bhargav',
    role: 'Artisan',
    avatar: 'B',
    phone: '+91 98765 43210',
    languages: ['English', 'हिन्दी', 'తెలుగు'],
    location: 'Hyderabad, Telangana',
    shopName: 'Bhargav Handicrafts'
};

const MOCK_PRODUCTS = [
    {
        id: 1,
        name: 'Handwoven Silk Saree',
        nameHi: 'हाथ से बुनी सिल्क साड़ी',
        nameTe: 'చేతి వెల్లడి పట్టు చీర',
        price: 1299,
        originalPrice: 1599,
        category: 'Textiles',
        status: 'published',
        emoji: '🧶',
        description: 'Beautifully handcrafted silk saree featuring a traditional zari border, created using traditional weaving techniques passed down through generations.',
        descriptionHi: 'पारंपरिक ज़री बॉर्डर वाली सुंदर हाथ से बनी सिल्क साड़ी।',
        material: 'Silk',
        craftType: 'Handwoven',
        keywords: ['silk', 'handwoven', 'zari', 'saree', 'traditional'],
        languages: ['English', 'Hindi'],
        dateAdded: '2025-08-20',
        featured: true,
        popularity: 95
    },
    {
        id: 2,
        name: 'Bamboo Basket',
        nameHi: 'बांस की टोकरी',
        nameTe: 'వెదురు బుట్ట',
        price: 799,
        category: 'Handicrafts',
        status: 'published',
        emoji: '🧺',
        description: 'Eco-friendly bamboo basket, handcrafted by skilled artisans. Perfect for home storage, decoration, or as a gift.',
        material: 'Bamboo',
        craftType: 'Handcrafted',
        keywords: ['bamboo', 'basket', 'eco-friendly', 'handmade'],
        languages: ['English'],
        dateAdded: '2025-08-18',
        featured: true,
        popularity: 82
    },
    {
        id: 3,
        name: 'Terracotta Vase',
        nameHi: 'मिट्टी का फूलदान',
        nameTe: 'మట్టి పువ్వుల కుండ',
        price: 599,
        category: 'Home Decor',
        status: 'draft',
        emoji: '🏺',
        description: 'Handmade terracotta vase with intricate traditional designs. Each piece is unique and tells a story.',
        material: 'Terracotta',
        craftType: 'Handmade',
        keywords: ['terracotta', 'vase', 'handmade', 'traditional'],
        languages: ['English'],
        dateAdded: '2025-08-15',
        featured: false,
        popularity: 71
    },
    {
        id: 4,
        name: 'Handmade Jute Bag',
        nameHi: 'हस्तनिर्मित जूट बैग',
        nameTe: 'చేతితో తయారుచేసిన జూట్ బ్యాగ్',
        price: 449,
        category: 'Handicrafts',
        status: 'published',
        emoji: '👜',
        description: 'Sustainable jute bag with hand-painted traditional motifs. Strong, durable, and environmentally friendly.',
        material: 'Jute',
        craftType: 'Hand-painted',
        keywords: ['jute', 'bag', 'sustainable', 'hand-painted'],
        languages: ['English'],
        dateAdded: '2025-08-12',
        featured: false,
        popularity: 68
    },
    {
        id: 5,
        name: 'Wooden Craft Box',
        nameHi: 'लकड़ी की शिल्प बॉक्स',
        nameTe: 'కలప క్రాఫ్ట్ బాక్స్',
        price: 899,
        category: 'Handicrafts',
        status: 'published',
        emoji: '📦',
        description: 'Intricately carved wooden box using traditional techniques. Perfect for jewelry storage or as a decorative piece.',
        material: 'Wood',
        craftType: 'Carved',
        keywords: ['wooden', 'carved', 'box', 'traditional'],
        languages: ['English'],
        dateAdded: '2025-08-10',
        featured: true,
        popularity: 77
    },
    {
        id: 6,
        name: 'Handcrafted Necklace',
        nameHi: 'हाथ से बना हार',
        nameTe: 'చేతితో తయారుచేసిన నెక్లెస్',
        price: 1899,
        category: 'Jewellery',
        status: 'published',
        emoji: '📿',
        description: 'Stunning handcrafted necklace with traditional silver work. A statement piece for any occasion.',
        material: 'Silver',
        craftType: 'Handcrafted',
        keywords: ['necklace', 'silver', 'handcrafted', 'traditional'],
        languages: ['English'],
        dateAdded: '2025-08-08',
        featured: true,
        popularity: 88
    },
    {
        id: 7,
        name: 'Cotton Dupatta',
        nameHi: 'कपास की दुपट्टा',
        nameTe: 'పత్తి దుప్పట్టా',
        price: 699,
        category: 'Textiles',
        status: 'published',
        emoji: '🧣',
        description: 'Lightweight cotton dupatta with hand-block printed patterns. Perfect for daily wear and special occasions.',
        material: 'Cotton',
        craftType: 'Block Printed',
        keywords: ['cotton', 'dupatta', 'block print', 'handmade'],
        languages: ['English'],
        dateAdded: '2025-08-05',
        featured: false,
        popularity: 65
    },
    {
        id: 8,
        name: 'Brass Decorative Lamp',
        nameHi: 'पीतल का सजावटी दीपक',
        nameTe: 'రాగి అలంకారిక దీపం',
        price: 1499,
        category: 'Home Decor',
        status: 'draft',
        emoji: '🪔',
        description: 'Exquisite brass lamp with traditional Indian motifs. Creates a warm, inviting ambiance in any room.',
        material: 'Brass',
        craftType: 'Handmade',
        keywords: ['brass', 'lamp', 'decorative', 'traditional'],
        languages: ['English'],
        dateAdded: '2025-08-01',
        featured: true,
        popularity: 84
    }
];

const MOCK_ORDERS = [
    {
        id: 'ORD-1024',
        productId: 1,
        productName: 'Handwoven Silk Saree',
        emoji: '🧶',
        buyer: 'Priya Sharma',
        quantity: 1,
        price: 1299,
        status: 'pending',
        date: '2025-08-22',
        address: 'Mumbai, Maharashtra',
        timeline: [
            { step: 'Order received', date: 'Aug 22, 2025', completed: true },
            { step: 'Processing', date: '', completed: false },
            { step: 'Shipped', date: '', completed: false },
            { step: 'Delivered', date: '', completed: false }
        ]
    },
    {
        id: 'ORD-1023',
        productId: 6,
        productName: 'Handcrafted Necklace',
        emoji: '📿',
        buyer: 'Ananya Reddy',
        quantity: 2,
        price: 3798,
        status: 'processing',
        date: '2025-08-21',
        address: 'Bangalore, Karnataka',
        timeline: [
            { step: 'Order received', date: 'Aug 21, 2025', completed: true },
            { step: 'Processing', date: 'Aug 21, 2025', completed: true },
            { step: 'Shipped', date: '', completed: false },
            { step: 'Delivered', date: '', completed: false }
        ]
    },
    {
        id: 'ORD-1022',
        productId: 2,
        productName: 'Bamboo Basket',
        emoji: '🧺',
        buyer: 'Rajesh Kumar',
        quantity: 3,
        price: 2397,
        status: 'completed',
        date: '2025-08-18',
        address: 'Chennai, Tamil Nadu',
        timeline: [
            { step: 'Order received', date: 'Aug 18, 2025', completed: true },
            { step: 'Processing', date: 'Aug 18, 2025', completed: true },
            { step: 'Shipped', date: 'Aug 19, 2025', completed: true },
            { step: 'Delivered', date: 'Aug 21, 2025', completed: true }
        ]
    },
    {
        id: 'ORD-1021',
        productId: 4,
        productName: 'Handmade Jute Bag',
        emoji: '👜',
        buyer: 'Meera Joshi',
        quantity: 1,
        price: 449,
        status: 'completed',
        date: '2025-08-15',
        address: 'Pune, Maharashtra',
        timeline: [
            { step: 'Order received', date: 'Aug 15, 2025', completed: true },
            { step: 'Processing', date: 'Aug 15, 2025', completed: true },
            { step: 'Shipped', date: 'Aug 16, 2025', completed: true },
            { step: 'Delivered', date: 'Aug 18, 2025', completed: true }
        ]
    },
    {
        id: 'ORD-1020',
        productId: 5,
        productName: 'Wooden Craft Box',
        emoji: '📦',
        buyer: 'Vikram Singh',
        quantity: 1,
        price: 899,
        status: 'pending',
        date: '2025-08-22',
        address: 'Delhi, NCR',
        timeline: [
            { step: 'Order received', date: 'Aug 22, 2025', completed: true },
            { step: 'Processing', date: '', completed: false },
            { step: 'Shipped', date: '', completed: false },
            { step: 'Delivered', date: '', completed: false }
        ]
    }
];

const MOCK_CATEGORIES = [
    { id: 'all', name: 'All', emoji: '✨' },
    { id: 'textiles', name: 'Textiles', emoji: '🧶' },
    { id: 'handicrafts', name: 'Handicrafts', emoji: '🏺' },
    { id: 'jewellery', name: 'Jewellery', emoji: '📿' },
    { id: 'home-decor', name: 'Home Decor', emoji: '🪔' }
];

const AI_RESPONSES = [
    "Based on your costs and market patterns for similar handcrafted items, I recommend pricing your product competitively.",
    "Your product has great potential! Consider adding more keywords to reach a wider audience.",
    "The current market demand for this category is strong. Your pricing looks good!",
    "I notice your product could benefit from better photos. Would you like me to enhance them?",
    "Your listing is well-optimized. It should perform well in the marketplace.",
    "Based on seasonal trends, this product could see increased demand in the coming weeks."
];

const AI_SUGGESTIONS = [
    "Your saree listing is missing material details.",
    "Your product photo could be improved with AI enhancement.",
    "3 products have no descriptions yet.",
    "Consider adding Hindi descriptions to reach more buyers.",
    "Your pricing for the Bamboo Basket is very competitive!",
    "New orders are waiting for processing."
];

const VOICE_SIMULATIONS = [
    "Handmade silk saree with traditional zari border, created using traditional weaving techniques passed down through generations.",
    "Eco-friendly bamboo basket, perfect for home storage and decoration.",
    "Handcrafted terracotta vase with intricate traditional designs.",
    "Sustainable jute bag with hand-painted traditional motifs.",
    "Intricately carved wooden box using traditional techniques."
];
