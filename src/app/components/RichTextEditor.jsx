"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-64 bg-muted rounded-xl animate-pulse" />
});

/**
 * RichTextEditor component
 * @param {Object} props
 * @param {string} props.value - HTML content
 * @param {function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 */
export default function RichTextEditor({ 
    value, 
    onChange, 
    label = "Content",
    placeholder = "Write your content here..."
}) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list',
        'align',
        'link'
    ];

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <div className="rich-text-editor">
                <ReactQuill
                    theme="snow"
                    value={value || ''}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                />
            </div>
            <style jsx global>{`
                .rich-text-editor .ql-container {
                    min-height: 200px;
                    border-radius: 0 0 0.75rem 0.75rem;
                    border-color: hsl(var(--border));
                    font-size: 0.875rem;
                }
                .rich-text-editor .ql-toolbar {
                    border-radius: 0.75rem 0.75rem 0 0;
                    border-color: hsl(var(--border));
                    background: hsl(var(--muted));
                }
                .rich-text-editor .ql-editor {
                    min-height: 180px;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: hsl(var(--muted-foreground));
                    font-style: normal;
                }
            `}</style>
        </div>
    );
}
