import mongoose from 'mongoose';

/**
 * Navbar, mobile bottom bar and footer content. Singleton, keyed like the
 * other storefront config so concurrent writers converge on one document.
 */
const NavigationSchema = new mongoose.Schema({
    key: { type: String, default: 'default', unique: true },
    navbar: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    mobileBar: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    footer: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

NavigationSchema.statics.getNavigation = async function () {
    return this.findOneAndUpdate(
        { key: 'default' },
        { $setOnInsert: { key: 'default' } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

export default mongoose.models.Navigation || mongoose.model('Navigation', NavigationSchema);
