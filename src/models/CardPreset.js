import mongoose from 'mongoose';

/**
 * A named product-card style.
 *
 * The card shows up in every product block, so its look is stored once here
 * and referenced by blocks. One preset is flagged default and is used wherever
 * a block does not name a specific one.
 */
const CardPresetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Preset name is required'],
        trim: true,
        maxlength: 80,
    },
    isDefault: { type: Boolean, default: false },
    // Values for the options declared in CARD_SCHEMA. Missing keys fall back to
    // the schema defaults, so adding an option needs no migration.
    settings: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

CardPresetSchema.index({ isDefault: 1 });

// Exactly one preset may be default: promoting one demotes the rest.
CardPresetSchema.pre('save', async function () {
    if (this.isDefault && this.isModified('isDefault')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
});

export default mongoose.models.CardPreset || mongoose.model('CardPreset', CardPresetSchema);
