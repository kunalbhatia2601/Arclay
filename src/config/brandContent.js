/**
 * Brand Content Configuration
 * 
 * This file contains all brand-specific content for the home page.
 * The site switches between ESSVORA (pickles & snacks) and VedicBro (Ayurvedic products)
 * based on the NEXT_PUBLIC_SITE_NAME environment variable.
 */

export const brandContent = {
    essvora: {
        hero: {
            titleLine1: "Crafted Flavours.",
            titleLine2: "Timeless Taste.",
            subtitle: "Premium pickles & snacks made with patience, purity, and passion.",
            ctaPrimary: "SHOP NOW",
            ctaSecondary: "EXPLORE OUR STORY",
            products: [
                { name: "Mango Pickle", color: "amber", size: "large" },
                { name: "Banana Chips", color: "yellow", size: "medium" },
                { name: "Roasted Nuts", color: "amber", size: "medium" },
                { name: "Lime Pickle", color: "green", size: "small" },
                { name: "Quinoa Puffs", color: "orange", size: "small" },
                { name: "Mixed Veg", color: "emerald", size: "small" },
            ]
        },

        productHighlight: {
            sectionTitle: "PRODUCT HIGHLIGHT",
            categories: [
                {
                    id: 1,
                    title: "SIGNATURE PICKLES",
                    subtitle: "Shop the range",
                    emoji: "🫙",
                    bgColor: "bg-amber-50",
                    products: ["Mango Pickle", "Lemon Pickle", "Mixed Pickle"],
                },
                {
                    id: 2,
                    title: "CRUNCHY SNACKS",
                    subtitle: "Discover Snacks",
                    emoji: "🥜",
                    bgColor: "bg-yellow-50",
                    products: ["Masala Cashews", "Banana Chips", "Quinoa Puffs"],
                },
                {
                    id: 3,
                    title: "BEST SELLERS",
                    subtitle: "View Top Rated",
                    emoji: "⭐",
                    bgColor: "bg-orange-50",
                    products: ["Spicy Mango", "Roasted Nuts", "Mixed Veg"],
                },
            ]
        },

        whyUs: {
            sectionTitle: "WHY ESSVORA",
            features: [
                {
                    id: 1,
                    title: "100% Natural Ingredients",
                    icon: "leaf",
                },
                {
                    id: 2,
                    title: "Small-Batch Crafted",
                    icon: "jar",
                },
                {
                    id: 3,
                    title: "No Preservatives",
                    icon: "no-preservatives",
                },
                {
                    id: 4,
                    title: "Hygienic Packaging",
                    icon: "package",
                },
            ]
        },

        ourStory: {
            sectionLabel: "OUR STORY",
            title: "Rooted in tradition, perfected for the modern palate.",
            description: "We source the finest ingredients to bring authentic flavours to your table. Each jar tells a story of heritage, crafted with recipes passed down through generations.",
            additionalText: "From the sun-ripened mangoes of South India to the aromatic spices of the Western Ghats, every ingredient is handpicked to ensure uncompromising quality and taste that takes you back to grandmother's kitchen.",
            stats: [
                { value: "25+", label: "Years of Heritage" },
                { value: "50+", label: "Unique Recipes" },
                { value: "10K+", label: "Happy Customers" },
            ]
        },

        socialProof: {
            sectionLabel: "SOCIAL PROOF",
            statsTitle: "Loved by 10,000+",
            statsSubtitle: "food lovers",
            rating: "4.9/5",
            reviewCount: "2,847 reviews",
            communityText: "Join our happy community",
            reviews: [
                {
                    id: 1,
                    rating: 5,
                    text: "The mango pickle is absolutely divine! Takes me back to my grandmother's kitchen.",
                    author: "Priya S.",
                    location: "Mumbai",
                },
                {
                    id: 2,
                    rating: 5,
                    text: "Best quality snacks I've ever had. The masala cashews are addictive!",
                    author: "Rahul M.",
                    location: "Delhi",
                },
                {
                    id: 3,
                    rating: 5,
                    text: "Finally found pickles that taste homemade. Will be ordering again!",
                    author: "Anita K.",
                    location: "Bangalore",
                },
            ]
        },

        footer: {
            tagline: "Crafted Flavours. Timeless Taste. Premium pickles & snacks made with patience, purity, and passion.",
            newsletterPrompt: "Have questions?",
        }
    },

    vedicbro: {
        hero: {
            titleLine1: "Ancient Wisdom.",
            titleLine2: "Modern Wellness.",
            subtitle: "Authentic Ayurvedic products crafted with traditional recipes for holistic health.",
            ctaPrimary: "EXPLORE PRODUCTS",
            ctaSecondary: "DISCOVER AYURVEDA",
            products: [
                { name: "Hair Oil", color: "teal", size: "large" },
                { name: "Ashwagandha", color: "green", size: "medium" },
                { name: "Chyawanprash", color: "amber", size: "medium" },
                { name: "Triphala", color: "emerald", size: "small" },
                { name: "Neem Capsules", color: "lime", size: "small" },
                { name: "Tulsi Drops", color: "green", size: "small" },
            ]
        },

        productHighlight: {
            sectionTitle: "PRODUCT HIGHLIGHT",
            categories: [
                {
                    id: 1,
                    title: "HERBAL OILS",
                    subtitle: "Shop the range",
                    emoji: "🧴",
                    bgColor: "bg-teal-50",
                    products: ["Hair Oil", "Body Oil", "Massage Oil"],
                },
                {
                    id: 2,
                    title: "WELLNESS CHURNAS",
                    subtitle: "Discover Blends",
                    emoji: "🌿",
                    bgColor: "bg-green-50",
                    products: ["Ashwagandha", "Triphala", "Brahmi"],
                },
                {
                    id: 3,
                    title: "IMMUNITY BOOSTERS",
                    subtitle: "View Best Sellers",
                    emoji: "💪",
                    bgColor: "bg-lime-50",
                    products: ["Chyawanprash", "Giloy Juice", "Tulsi Drops"],
                },
            ]
        },

        whyUs: {
            sectionTitle: "WHY VEDICBRO",
            features: [
                {
                    id: 1,
                    title: "Pure Ayurvedic Herbs",
                    icon: "leaf",
                },
                {
                    id: 2,
                    title: "Vedic Formulas",
                    icon: "jar",
                },
                {
                    id: 3,
                    title: "Lab Tested Quality",
                    icon: "no-preservatives",
                },
                {
                    id: 4,
                    title: "Eco-Friendly Packaging",
                    icon: "package",
                },
            ]
        },

        ourStory: {
            sectionLabel: "OUR STORY",
            title: "Reviving ancient Ayurvedic wisdom for modern wellness.",
            description: "We bring you authentic Ayurvedic formulations rooted in 5000 years of traditional knowledge. Each product is crafted with pure herbs and ancient recipes for holistic wellbeing.",
            additionalText: "From the sacred groves of the Himalayas to the pristine forests of Kerala, every herb is ethically sourced and traditionally processed to preserve its natural potency and healing properties.",
            stats: [
                { value: "5000+", label: "Years of Wisdom" },
                { value: "100+", label: "Herbal Formulas" },
                { value: "5K+", label: "Lives Transformed" },
            ]
        },

        socialProof: {
            sectionLabel: "SOCIAL PROOF",
            statsTitle: "Trusted by 5,000+",
            statsSubtitle: "wellness seekers",
            rating: "4.8/5",
            reviewCount: "1,523 reviews",
            communityText: "Join our wellness community",
            reviews: [
                {
                    id: 1,
                    rating: 5,
                    text: "The Ashwagandha churna has transformed my sleep quality. Truly pure and effective!",
                    author: "Vikram P.",
                    location: "Pune",
                },
                {
                    id: 2,
                    rating: 5,
                    text: "Finally found authentic Ayurvedic products. The hair oil works wonders!",
                    author: "Sneha R.",
                    location: "Hyderabad",
                },
                {
                    id: 3,
                    rating: 5,
                    text: "Chyawanprash tastes just like my grandmother used to make. Pure and potent!",
                    author: "Amit G.",
                    location: "Jaipur",
                },
            ]
        },

        footer: {
            tagline: "Ancient Wisdom. Modern Wellness. Authentic Ayurvedic products crafted with traditional recipes for holistic health.",
            newsletterPrompt: "Have questions?",
        }
    }
};

/**
 * Get the theme name based on site name
 */
export const getTheme = (siteName) => {
    const normalized = (siteName || "").toLowerCase().replace(/\s+/g, '');
    return normalized.includes('vedicbro') ? 'vedicbro' : 'essvora';
};

/**
 * Get brand content based on site name
 */
export const getBrandContent = (siteName) => {
    const theme = getTheme(siteName);
    return brandContent[theme];
};

/**
 * Get the site name from environment
 */
export const getSiteName = () => {
    return process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
};
