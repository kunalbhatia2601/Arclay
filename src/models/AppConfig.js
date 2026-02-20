import mongoose from "mongoose";

const helpContactSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["email", "call", "live_chat"],
        required: true
    },
    label: { type: String, required: true },
    value: { type: String, required: true },
    isEnabled: { type: Boolean, default: true }
}, { _id: true });

const legalPolicySchema = new mongoose.Schema({
    slug: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    isEnabled: { type: Boolean, default: true }
}, { _id: true });

const faqSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: true }
}, { _id: true });

const appConfigSchema = new mongoose.Schema({
    helpContacts: [helpContactSchema],
    legalPolicies: [legalPolicySchema],
    faqs: [faqSchema]
}, { timestamps: true });

export default mongoose.models.AppConfig || mongoose.model("AppConfig", appConfigSchema);
