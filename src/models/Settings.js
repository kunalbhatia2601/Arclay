import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    isDemo: {
        type: Boolean,
        default: false
    },
    isMaintenance: {
        type: Boolean,
        default: false
    },
    payment: {
        razorpay: {
            keyId: {
                type: String,
                default: ''
            },
            keySecret: {
                type: String,
                default: ''
            },
            isEnabled: {
                type: Boolean,
                default: false
            }
        },
        stripe: {
            publishableKey: {
                type: String,
                default: ''
            },
            secretKey: {
                type: String,
                default: ''
            },
            isEnabled: {
                type: Boolean,
                default: false
            }
        },
        cod: {
            isEnabled: {
                type: Boolean,
                default: true
            }
        }
    },
    mail: {
        email: {
            type: String,
            default: ''   
        },
        password: {
            type: String,
            default: ''   
        },
        host: {
            type: String,
            default: ''   
        },
        port: {
            type: Number,
            default: 587   
        },
        isSSL: {
            type: Boolean,
            default: false   
        },
        isEnabled: {
            type: Boolean,
            default: false   
        }
    },
    gemini_ai: {
        apiKey: {
            type: String,
            default: ''
        },
        isEnabled: {
            type: Boolean,
            default: false
        }
    },
    shipping: {
        shiprocket: {
            isEnabled: {
                type: Boolean,
                default: false
            },
            email: {
                type: String,
                default: ''
            },
            password: {
                type: String,
                default: ''
            },
            mode: {
                type: String,
                enum: ['manual', 'automatic'],
                default: 'manual'
            },
            channelId: {
                type: String,
                default: ''
            }
        },
        warehouse: {
            name: {
                type: String,
                default: ''
            },
            phone: {
                type: String,
                default: ''
            },
            address: {
                type: String,
                default: ''
            },
            city: {
                type: String,
                default: ''
            },
            state: {
                type: String,
                default: ''
            },
            pincode: {
                type: String,
                default: ''
            },
            country: {
                type: String,
                default: 'India'
            }
        },
        rateCalculation: {
            type: String,
            enum: ['realtime', 'flat', 'free_threshold'],
            default: 'free_threshold'
        },
        flatRate: {
            type: Number,
            default: 50
        },
        freeShippingThreshold: {
            type: Number,
            default: 499
        },
        defaultWeight: {
            type: Number,
            default: 0.5  // in kg
        }
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists (singleton pattern)
SettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
