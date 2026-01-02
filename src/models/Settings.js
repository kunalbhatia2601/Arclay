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
