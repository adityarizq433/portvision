import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                primary: {
                    50:  '#eff4ff',
                    100: '#dbe8ff',
                    200: '#bed4ff',
                    300: '#90b5fd',
                    400: '#5b8ef9',
                    500: '#1E55F0',
                    600: '#1a47d4',
                    700: '#1537ab',
                    800: '#152f8a',
                    900: '#172d6e',
                    950: '#111d47',
                },
                navy: {
                    50:  '#f0f4f9',
                    100: '#dce6f1',
                    200: '#c0d2e6',
                    300: '#94b4d4',
                    400: '#6391bd',
                    500: '#4374a7',
                    600: '#345d8d',
                    700: '#2b4c73',
                    800: '#27415f',
                    900: '#1E2D4F',
                    950: '#141e35',
                },
                surface: {
                    page:   '#EEEFEF',
                    card:   '#FFFFFF',
                    border: '#E5E7EB',
                    hover:  '#F3F4F6',
                },
            },
            borderRadius: {
                card: '14px',
            },
            boxShadow: {
                card: '0 1px 4px 0 rgba(30,45,79,0.07), 0 4px 16px 0 rgba(30,45,79,0.05)',
                'card-hover': '0 4px 16px 0 rgba(30,85,240,0.10), 0 1px 4px 0 rgba(30,45,79,0.07)',
                sidebar: '2px 0 16px 0 rgba(30,45,79,0.06)',
                topbar: '0 1px 0 0 #E5E7EB',
            },
        },
    },

    plugins: [forms],
};
