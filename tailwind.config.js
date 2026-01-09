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
            },
            fontFamily: {
                'display': ['Inter', 'sans-serif'],
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
