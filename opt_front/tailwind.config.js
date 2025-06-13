/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#1E1E1E",
                card: "#2D2D2D",
                secondary: "#3A3A3A",
                primary: "#3B82F6",
                text: "#FFFFFF",
                muted: "#A1A1AA",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "8px",
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#fff',
                        a: {
                            color: '#3182ce',
                            '&:hover': {
                                color: '#2c5282',
                            },
                        },
                        h1: {
                            color: '#fff',
                        },
                        h2: {
                            color: '#fff',
                        },
                        h3: {
                            color: '#fff',
                        },
                        h4: {
                            color: '#fff',
                        },
                        h5: {
                            color: '#fff',
                        },
                        h6: {
                            color: '#fff',
                        },
                        strong: {
                            color: '#fff',
                        },
                        code: {
                            color: '#fff',
                        },
                        figcaption: {
                            color: '#fff',
                        },
                        blockquote: {
                            color: '#fff',
                            borderLeftColor: '#4a5568',
                        },
                        hr: {
                            borderColor: '#4a5568',
                        },
                        ol: {
                            color: '#fff',
                        },
                        ul: {
                            color: '#fff',
                        },
                        li: {
                            color: '#fff',
                        },
                        p: {
                            color: '#fff',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
