import Counter from '@/models/Counter';

/**
 * Allocate the next number in a sequence. The increment and the read are one
 * atomic operation, so two simultaneous sales can never take the same serial.
 */
export async function nextSequence(key) {
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

/**
 * Invoice serial in the form PREFIX/FY/NNNN, e.g. INV/2026-27/0042.
 * India's financial year starts in April, and the sequence restarts with it.
 */
export async function nextBillNumber(prefix = 'INV', now = new Date()) {
    const year = now.getFullYear();
    const startYear = now.getMonth() >= 3 ? year : year - 1;
    const fy = `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

    const seq = await nextSequence(`bill:${fy}`);
    return `${prefix}/${fy}/${String(seq).padStart(4, '0')}`;
}
