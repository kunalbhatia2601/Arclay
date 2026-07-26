import mongoose from 'mongoose';

/**
 * Atomic sequence generator, used for invoice numbers. A tax invoice needs a
 * gapless, non-reusable serial, so the number is allocated with a single
 * findOneAndUpdate rather than counting existing documents.
 */
const CounterSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

export default mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
