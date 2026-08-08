import connectDB from "@/lib/mongodb";
import MetaFieldTemplate from "@/models/MetaFieldTemplate";
import Product from "@/models/Product";

/**
 * Facets the storefront can filter by.
 *
 * Any custom product field marked "filterable" in its template becomes a facet
 * automatically — no code change per field. Values come from the products
 * themselves so only options that would actually return results are offered.
 */
export async function GET() {
    try {
        await connectDB();

        const templates = await MetaFieldTemplate.find({ isActive: true }).lean();

        const fields = new Map();
        for (const template of templates) {
            for (const field of template.fields || []) {
                if (field.filterable && !fields.has(field.key)) fields.set(field.key, field);
            }
        }

        if (fields.size === 0) {
            return Response.json({ success: true, facets: [] });
        }

        // One aggregation covers every facet: group the flattened metaIndex by
        // key, collecting distinct values and their counts.
        const keys = [...fields.keys()];
        const rows = await Product.aggregate([
            { $match: { isActive: true } },
            { $unwind: "$metaIndex" },
            { $match: { "metaIndex.k": { $in: keys } } },
            {
                $group: {
                    _id: { k: "$metaIndex.k", v: "$metaIndex.v" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const valuesByKey = new Map();
        for (const row of rows) {
            const key = row._id.k;
            if (!valuesByKey.has(key)) valuesByKey.set(key, []);
            const list = valuesByKey.get(key);
            // Guard against a runaway facet on a free-text field.
            if (list.length < 25) list.push({ value: row._id.v, count: row.count });
        }

        const facets = keys
            .map((key) => {
                const field = fields.get(key);
                return {
                    key,
                    label: field.label,
                    type: field.type,
                    unit: field.unit || "",
                    values: valuesByKey.get(key) || [],
                };
            })
            .filter(facet => facet.values.length > 0);

        return Response.json({ success: true, facets });
    } catch (error) {
        console.error("Get facets error:", error);
        return Response.json({ success: false, facets: [] }, { status: 500 });
    }
}
