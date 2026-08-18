import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    // Null = top-level category. Set to another category for a one-level subcategory.
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

CategorySchema.index({ parent: 1, name: 1 });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
