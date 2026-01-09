'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

interface Category {
    id: string;
    name: string;
    checked: boolean;
}

interface Author {
    id: string;
    name: string;
    role: string;
    avatar: string;
}

interface ArticleData {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
    visibility: 'public' | 'private';
    publishDate: string;
    revision: number;
    author: Author;
    categories: Category[];
    tags: string;
    featuredImage: string;
    seo: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
    };
    stats: {
        words: number;
        characters: number;
        readingTime: number;
    };
    lastSaved: string;
}

// ==============================================
// SAMPLE DATA - Replace with API data
// ==============================================

const sampleArticle: ArticleData = {
    id: '1',
    title: 'Mastering Kubernetes Network Policies',
    slug: 'mastering-k8s-network-policies',
    content: `<p>Kubernetes Network Policies are crucial for securing your cluster networking. By default, pods are non-isolated; they accept traffic from any source. In this guide, we will explore how to restrict traffic effectively.</p>

<h2>Understanding the Basics</h2>

<p>A <code>NetworkPolicy</code> is a specification of how groups of pods are allowed to communicate with each other and other network endpoints.</p>

<pre><code class="language-yaml">apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 172.17.0.0/16
        except:
        - 172.17.1.0/24
    - namespaceSelector:
        matchLabels:
          project: myproject
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 6379</code></pre>

<p>The example above demonstrates a simple policy that restricts ingress traffic to pods with the label <code>role: db</code>.</p>

<h2>Best Practices</h2>

<p>Always start with a default deny policy for your namespaces. This ensures that you explicitly allow traffic only where necessary.</p>`,
    status: 'PUBLISHED',
    visibility: 'public',
    publishDate: '2023-10-24',
    revision: 12,
    author: {
        id: '1',
        name: 'Sarah L.',
        role: 'Editor in Chief',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
    },
    categories: [
        { id: '1', name: 'Kubernetes', checked: true },
        { id: '2', name: 'DevOps Culture', checked: false },
        { id: '3', name: 'Security', checked: true },
        { id: '4', name: 'CI/CD', checked: false },
        { id: '5', name: 'Cloud Native', checked: false },
    ],
    tags: 'k8s, networking, security, policies',
    featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjEysfTyZ26PBX00Mx5FFP2GgQRsdNrPg8sJsdQ22KmvBSGAM7oMMbGZnrssdVDysi-UmYHyE1mOBADvOky1iW_8XrD6CHzoOx68FhljxVlFeDkc_I4d_4tGEoDeOqcZ54UmhRLnt7ImMZa-OZ18uoN4DCzxXO2_h4RpK7MKwGXxXbHQoGTJFDmeFfvYAbOD9zLB1gizkpnQ7VSvTm016qCwhUAZ9RJpN-UlABamA0Vdjj7lvRhLIL5BmBCMbeF9Z359osv4QaMSE2',
    seo: {
        metaTitle: 'Mastering Kubernetes Network Policies | DevOps Blog',
        metaDescription: 'Learn how to secure your Kubernetes cluster networking using Network Policies. A comprehensive guide with examples and best practices.',
        keywords: ['kubernetes', 'security', 'networking'],
    },
    stats: {
        words: 142,
        characters: 980,
        readingTime: 1,
    },
    lastSaved: 'Today at 10:45 AM',
};

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function ArticleEditPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;
    const isNewArticle = articleId === 'new';

    // State
    const [article, setArticle] = useState<ArticleData>(sampleArticle);
    const [isSaving, setIsSaving] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');

    // Update article field
    const updateField = <K extends keyof ArticleData>(field: K, value: ArticleData[K]) => {
        setArticle((prev) => ({ ...prev, [field]: value }));
    };

    // Update SEO field
    const updateSeoField = <K extends keyof ArticleData['seo']>(field: K, value: ArticleData['seo'][K]) => {
        setArticle((prev) => ({
            ...prev,
            seo: { ...prev.seo, [field]: value },
        }));
    };

    // Toggle category
    const toggleCategory = (categoryId: string) => {
        setArticle((prev) => ({
            ...prev,
            categories: prev.categories.map((cat) =>
                cat.id === categoryId ? { ...cat, checked: !cat.checked } : cat
            ),
        }));
    };

    // Add keyword
    const addKeyword = () => {
        if (newKeyword.trim() && !article.seo.keywords.includes(newKeyword.trim())) {
            updateSeoField('keywords', [...article.seo.keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    // Remove keyword
    const removeKeyword = (keyword: string) => {
        updateSeoField('keywords', article.seo.keywords.filter((k) => k !== keyword));
    };

    // Generate slug from title
    const generateSlug = () => {
        const slug = article.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
        updateField('slug', slug);
    };

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        // TODO: Replace with actual API call
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-border-dark bg-[#111418] shrink-0 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-6 lg:mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/articles"
                        className="text-[#9dabb9] hover:text-white transition-colors flex items-center justify-center size-8 rounded-full hover:bg-[#283039]"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="h-6 w-px bg-border-dark mx-1" />
                    <h2 className="text-white text-lg font-bold leading-tight tracking-tight">
                        {isNewArticle ? 'New Article' : 'Edit Article'}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9dabb9] hidden sm:block mr-2">
                        Last saved: <span className="text-white">{article.lastSaved}</span>
                    </span>
                    <button className="flex items-center gap-2 h-9 px-4 bg-[#283039] hover:bg-[#3b4754] text-[#9dabb9] hover:text-white text-sm font-bold rounded-lg transition-colors border border-border-dark">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isSaving ? 'sync' : 'save'}
                        </span>
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Editor */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Title & Slug */}
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={article.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Enter article title here..."
                                className="w-full bg-transparent border-0 border-b border-border-dark focus:border-primary focus:ring-0 text-3xl font-bold text-white placeholder-[#586069] px-0 py-2 transition-colors"
                            />
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[#9dabb9] select-none">https://devops-blog.com/p/</span>
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        value={article.slug}
                                        onChange={(e) => updateField('slug', e.target.value)}
                                        className="w-full bg-[#111418] border border-border-dark rounded px-2 py-1 text-xs font-mono text-[#9dabb9] focus:text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                    <button
                                        onClick={generateSlug}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9dabb9] hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Regenerate from title"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">autorenew</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                            {/* Toolbar */}
                            <div className="bg-[#111418] border-b border-border-dark p-2 flex flex-wrap gap-1 sticky top-0 z-10">
                                <div className="flex items-center gap-1 pr-2 border-r border-[#283039] mr-1">
                                    <select className="bg-transparent text-white text-sm font-medium border-none focus:ring-0 cursor-pointer h-8 rounded hover:bg-[#283039]">
                                        <option>Normal</option>
                                        <option>Heading 1</option>
                                        <option>Heading 2</option>
                                        <option>Heading 3</option>
                                        <option>Code Block</option>
                                    </select>
                                </div>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Bold">
                                    <span className="material-symbols-outlined text-[20px]">format_bold</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Italic">
                                    <span className="material-symbols-outlined text-[20px]">format_italic</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Underline">
                                    <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                                </button>
                                <div className="w-px h-6 bg-[#283039] my-auto mx-1" />
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Link">
                                    <span className="material-symbols-outlined text-[20px]">link</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Image">
                                    <span className="material-symbols-outlined text-[20px]">image</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Code">
                                    <span className="material-symbols-outlined text-[20px]">code</span>
                                </button>
                                <div className="w-px h-6 bg-[#283039] my-auto mx-1" />
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Bullet List">
                                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Numbered List">
                                    <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                                </button>
                                <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Quote">
                                    <span className="material-symbols-outlined text-[20px]">format_quote</span>
                                </button>
                                <div className="ml-auto flex items-center gap-1">
                                    <button className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors" title="Fullscreen">
                                        <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                                    </button>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div
                                className="flex-1 p-6 lg:p-8 bg-[#1e293b] text-base outline-none custom-scrollbar editor-content"
                                contentEditable
                                suppressContentEditableWarning
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />

                            {/* Footer Stats */}
                            <div className="bg-[#111418] border-t border-border-dark px-4 py-2 flex items-center justify-between text-xs text-[#9dabb9]">
                                <span>p: HTML</span>
                                <div className="flex gap-4">
                                    <span>Words: {article.stats.words}</span>
                                    <span>Characters: {article.stats.characters}</span>
                                    <span>Reading time: {article.stats.readingTime} min</span>
                                </div>
                            </div>
                        </div>

                        {/* SEO Section */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">search</span>
                                <h3 className="text-white font-bold text-base">Search Engine Optimization</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5 uppercase">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={article.seo.metaTitle}
                                        onChange={(e) => updateSeoField('metaTitle', e.target.value)}
                                        className="w-full bg-[#111418] border border-border-dark rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069] transition-all"
                                    />
                                    <p className="text-[10px] text-[#9dabb9] mt-1 text-right">
                                        {article.seo.metaTitle.length}/60 characters
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5 uppercase">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={article.seo.metaDescription}
                                        onChange={(e) => updateSeoField('metaDescription', e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#111418] border border-border-dark rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069] transition-all resize-none"
                                    />
                                    <p className="text-[10px] text-[#9dabb9] mt-1 text-right">
                                        {article.seo.metaDescription.length}/160 characters
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5 uppercase">
                                        Keywords
                                    </label>
                                    <div className="w-full bg-[#111418] border border-border-dark rounded-lg px-2 py-2 text-sm flex flex-wrap gap-2 min-h-[42px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                                        {article.seo.keywords.map((keyword) => (
                                            <span
                                                key={keyword}
                                                className="bg-[#283039] text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                {keyword}
                                                <button
                                                    onClick={() => removeKeyword(keyword)}
                                                    className="hover:text-[#fa6238]"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                            placeholder="Add keyword..."
                                            className="bg-transparent border-none p-0 text-sm text-white focus:ring-0 placeholder-[#586069] flex-1 min-w-[100px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Publishing Options */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
                            <h3 className="text-white font-bold text-sm mb-4">Publishing</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5">Status</label>
                                    <select
                                        value={article.status}
                                        onChange={(e) => updateField('status', e.target.value as ArticleData['status'])}
                                        className="w-full bg-[#111418] border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                                    >
                                        <option value="PUBLISHED">Published</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5">Visibility</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={article.visibility === 'public'}
                                                onChange={() => updateField('visibility', 'public')}
                                                className="text-primary bg-[#111418] border-border-dark focus:ring-primary"
                                            />
                                            <span className="text-sm text-white">Public</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={article.visibility === 'private'}
                                                onChange={() => updateField('visibility', 'private')}
                                                className="text-primary bg-[#111418] border-border-dark focus:ring-primary"
                                            />
                                            <span className="text-sm text-white">Private</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#9dabb9] mb-1.5">Publish Date</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2 text-[#9dabb9] text-[18px]">
                                            calendar_today
                                        </span>
                                        <input
                                            type="date"
                                            value={article.publishDate}
                                            onChange={(e) => updateField('publishDate', e.target.value)}
                                            className="w-full bg-[#111418] border border-border-dark rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border-dark flex justify-between items-center">
                                <button className="text-red-400 text-sm hover:text-red-300 font-medium transition-colors">
                                    Move to Trash
                                </button>
                                <span className="text-xs text-[#9dabb9] italic">rev. {article.revision}</span>
                            </div>
                        </div>

                        {/* Author */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
                            <h3 className="text-white font-bold text-sm mb-4">Author</h3>
                            <div className="flex items-center gap-3 mb-3 p-2 bg-[#111418] rounded-lg border border-border-dark">
                                <div
                                    className="size-8 rounded-full bg-cover bg-center"
                                    style={{ backgroundImage: `url("${article.author.avatar}")` }}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">{article.author.name}</span>
                                    <span className="text-[10px] text-[#9dabb9]">{article.author.role}</span>
                                </div>
                                <button className="ml-auto text-[#9dabb9] hover:text-primary">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#9dabb9] text-[18px]">
                                    person_search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Assign another author..."
                                    className="w-full bg-[#111418] border border-border-dark rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069]"
                                />
                            </div>
                        </div>

                        {/* Taxonomy */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
                            <h3 className="text-white font-bold text-sm mb-4">Taxonomy</h3>
                            <div className="mb-5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-[#9dabb9]">Categories</label>
                                    <button className="text-[10px] text-primary hover:text-white font-bold uppercase">
                                        Add New
                                    </button>
                                </div>
                                <div className="bg-[#111418] border border-border-dark rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                                    {article.categories.map((category) => (
                                        <label key={category.id} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={category.checked}
                                                onChange={() => toggleCategory(category.id)}
                                                className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-sm text-white group-hover:text-primary transition-colors">
                                                {category.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9dabb9] mb-1.5">Tags</label>
                                <input
                                    type="text"
                                    value={article.tags}
                                    onChange={(e) => updateField('tags', e.target.value)}
                                    placeholder="Separate with commas..."
                                    className="w-full bg-[#111418] border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069]"
                                />
                                <p className="text-[10px] text-[#9dabb9] mt-1.5 italic">
                                    Used for search and related posts.
                                </p>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
                            <h3 className="text-white font-bold text-sm mb-4">Featured Image</h3>
                            <div className="aspect-video w-full bg-[#111418] border-2 border-dashed border-[#283039] hover:border-primary rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden">
                                {article.featuredImage && (
                                    <img
                                        src={article.featuredImage}
                                        alt="Preview"
                                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                                    />
                                )}
                                <div className="z-10 flex flex-col items-center">
                                    <span className="material-symbols-outlined text-[#9dabb9] group-hover:text-white text-3xl mb-2 transition-colors">
                                        cloud_upload
                                    </span>
                                    <span className="text-xs text-[#9dabb9] group-hover:text-white font-medium transition-colors">
                                        {article.featuredImage ? 'Replace Image' : 'Upload Image'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-[#9dabb9] mt-2 text-center">
                                Recommended size: 1200x630px
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Styles */}
            <style jsx global>{`
                .editor-content h2 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                    color: white;
                }
                .editor-content p {
                    margin-bottom: 1em;
                    line-height: 1.6;
                    color: #d1d5db;
                }
                .editor-content code {
                    background: #283039;
                    padding: 0.2em 0.4em;
                    border-radius: 0.25rem;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.9em;
                    color: #fa6238;
                }
                .editor-content pre {
                    background: #111418;
                    padding: 1em;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin-bottom: 1em;
                    border: 1px solid #283039;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #111418;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3b4754;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
