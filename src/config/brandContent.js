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
            subtitle: "Premium artisanal snacks made with patience, purity, and passion.",
            ctaPrimary: "SHOP COLLECTION",
            ctaSecondary: "DISCOVER STORY",
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
            sectionTitle: "CURATED SELECTION",
            categories: [
                {
                    id: 1,
                    title: "SIGNATURE JARS",
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
            sectionTitle: "THE ESSVORA STANDARD",
            features: [
                {
                    id: 1,
                    title: "100% Natural",
                    icon: "leaf",
                },
                {
                    id: 2,
                    title: "Small-Batch",
                    icon: "jar",
                },
                {
                    id: 3,
                    title: "No Preservatives",
                    icon: "no-preservatives",
                },
                {
                    id: 4,
                    title: "Premium Pack",
                    icon: "package",
                },
            ]
        },

        ourStory: {
            sectionLabel: "OUR HERITAGE",
            title: "Rooted in tradition, crafted for the modern lifestyle.",
            description: "We source the finest ingredients to bring authentic experiences to your home. Each product tells a story of heritage, crafted with recipes passed down through generations.",
            additionalText: "From the sun-ripened orchards to the aromatic spice gardens, every ingredient is handpicked to ensure uncompromising quality and a taste of true luxury.",
            stats: [
                { value: "25+", label: "Years of Heritage" },
                { value: "50+", label: "Unique Blends" },
                { value: "10K+", label: "Happy Customers" },
            ]
        },

        socialProof: {
            sectionLabel: "COMMUNITY",
            statsTitle: "Loved by 10,000+",
            statsSubtitle: "connoisseurs",
            rating: "4.9/5",
            reviewCount: "2,847 reviews",
            communityText: "Join our community",
            reviews: [
                {
                    id: 1,
                    rating: 5,
                    text: "The authentic taste is unmatched. A true premium experience.",
                    author: "Priya S.",
                    location: "Mumbai",
                },
                {
                    id: 2,
                    rating: 5,
                    text: "Best quality snacks I've ever had. Packaging is stunning too.",
                    author: "Rahul M.",
                    location: "Delhi",
                },
                {
                    id: 3,
                    rating: 5,
                    text: "Finally found products that match my standards. Highly recommended.",
                    author: "Anita K.",
                    location: "Bangalore",
                },
            ]
        },

        footer: {
            tagline: "Crafted Flavours. Timeless Taste. Premium artisanal products.",
            newsletterPrompt: "Join our list",
        }
    },

    vedicbro: {
        hero: {
            titleLine1: "Ancient Wisdom.",
            titleLine2: "Modern Wellness.",
            subtitle: "Authentic Ayurvedic products crafted with traditional recipes for holistic health.",
            ctaPrimary: "EXPLORE COLLECTION",
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
            sectionTitle: "WELLNESS EDIT",
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
                    title: "WELLNESS BLENDS",
                    subtitle: "Discover Blends",
                    emoji: "🌿",
                    bgColor: "bg-green-50",
                    products: ["Ashwagandha", "Triphala", "Brahmi"],
                },
                {
                    id: 3,
                    title: "IMMUNITY",
                    subtitle: "View Best Sellers",
                    emoji: "💪",
                    bgColor: "bg-lime-50",
                    products: ["Chyawanprash", "Giloy Juice", "Tulsi Drops"],
                },
            ]
        },

        whyUs: {
            sectionTitle: "THE VEDIC PROMISE",
            features: [
                {
                    id: 1,
                    title: "Pure Herbs",
                    icon: "leaf",
                },
                {
                    id: 2,
                    title: "Vedic Formulas",
                    icon: "jar",
                },
                {
                    id: 3,
                    title: "Lab Tested",
                    icon: "no-preservatives",
                },
                {
                    id: 4,
                    title: "Eco-Packaging",
                    icon: "package",
                },
            ]
        },

        ourStory: {
            sectionLabel: "OUR ORIGINS",
            title: "Reviving ancient wisdom for modern living.",
            description: "We bring you authentic formulations rooted in 5000 years of knowledge. Each product is crafted with pure ingredients and time-honored methods.",
            additionalText: "From the sacred groves to the pristine forests, every herb is ethically sourced to preserve its natural potency and effectiveness.",
            stats: [
                { value: "5000+", label: "Years of Wisdom" },
                { value: "100+", label: "Formulations" },
                { value: "5K+", label: "Lives Improved" },
            ]
        },

        socialProof: {
            sectionLabel: "TRUSTED BY MANY",
            statsTitle: "Trusted by 5,000+",
            statsSubtitle: "wellness seekers",
            rating: "4.8/5",
            reviewCount: "1,523 reviews",
            communityText: "Join our wellness community",
            reviews: [
                {
                    id: 1,
                    rating: 5,
                    text: "The Ashwagandha has transformed my routine. Truly effective!",
                    author: "Vikram P.",
                    location: "Pune",
                },
                {
                    id: 2,
                    rating: 5,
                    text: "Finally found authentic products. The oil works wonders!",
                    author: "Sneha R.",
                    location: "Hyderabad",
                },
                {
                    id: 3,
                    rating: 5,
                    text: "Tastes just like home made. Pure and potent!",
                    author: "Amit G.",
                    location: "Jaipur",
                },
            ]
        },

        footer: {
            tagline: "Ancient Wisdom. Modern Wellness. Authentic Ayurvedic products.",
            newsletterPrompt: "Join our list",
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
