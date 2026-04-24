/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#137fec',
                'primary-dark': '#0b63c1',
                'background-light': '#f8fafc',
                'background-dark': '#101922',
                'surface-light': '#ffffff',
                'surface-dark': '#1e293b',
                'text-main': '#111418',
                'text-sub': '#617589',
                'border-dark': '#283039',
                // L6: Code block palette — extracted from hardcoded arbitrary values
                'code-bg': '#1e293b',
                'code-header': '#0f172a',
                'code-border': '#283039',
                'code-text': '#e2e8f0',
                'code-label': '#6f84a1',
                'code-muted': '#9dabb9',
                'dot-red': '#ff5f56',
                'dot-yellow': '#ffbd2e',
                'dot-green': '#27c93f',
            },
            fontFamily: {
                'display': ['var(--font-manrope)', 'Inter', 'sans-serif'],
                'body': ['var(--font-inter)', 'Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                DEFAULT: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                '2xl': '1rem',
                full: '9999px',
            },
        },
    },
    plugins: [],
};
