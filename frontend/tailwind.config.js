/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "surface-container-high": "#262a33",
        "on-tertiary-fixed": "#410004",
        "on-surface": "#dfe2ee",
        "on-primary-fixed-variant": "#004f53",
        "error-container": "#93000a",
        "surface-tint": "#00dce6",
        "tertiary-fixed-dim": "#ffb3ae",
        "surface-bright": "#353942",
        "on-tertiary-fixed-variant": "#930014",
        "primary-fixed": "#6ff6ff",
        "secondary-fixed": "#f0dbff",
        "primary": "#e0fdff",
        "on-primary": "#00373a",
        "on-surface-variant": "#b9cacb",
        "inverse-on-surface": "#2c3039",
        "primary-container": "#00f2fe",
        "on-secondary-fixed-variant": "#6900b3",
        "surface-container-low": "#181c24",
        "inverse-primary": "#00696f",
        "on-tertiary-container": "#bc1925",
        "surface-container-highest": "#31353e",
        "tertiary-fixed": "#ffdad7",
        "surface": "#0f131c",
        "inverse-surface": "#dfe2ee",
        "tertiary": "#fff5f4",
        "on-background": "#dfe2ee",
        "on-tertiary": "#68000b",
        "tertiary-container": "#ffd0cc",
        "on-primary-fixed": "#002022",
        "on-primary-container": "#006a70",
        "on-secondary-container": "#d6a9ff",
        "surface-variant": "#31353e",
        "outline-variant": "#3a494b",
        "on-secondary-fixed": "#2c0051",
        "background": "#0f131c",
        "error": "#ffb4ab",
        "primary-fixed-dim": "#00dce6",
        "surface-container-lowest": "#0a0e16",
        "surface-container": "#1c2028",
        "on-error-container": "#ffdad6",
        "secondary-fixed-dim": "#ddb7ff",
        "surface-dim": "#0f131c",
        "secondary-container": "#6f00be",
        "on-secondary": "#490080",
        "outline": "#849495",
        "on-error": "#690005",
        "secondary": "#ddb7ff"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "gutter": "0.75rem",
        "space-xs": "0.25rem",
        "space-xl": "2rem",
        "margin": "1rem",
        "margin-desktop": "1.5rem",
        "space-sm": "0.5rem",
        "gutter-desktop": "1rem",
        "space-md": "0.75rem",
        "space-lg": "1.25rem"
      },
      "fontFamily": {
        "body-md": [
          "Inter"
        ],
        "mono-data": [
          "JetBrains Mono"
        ],
        "headline-lg": [
          "Inter"
        ],
        "label-caps": [
          "JetBrains Mono"
        ],
        "body-lg": [
          "Inter"
        ],
        "headline-xl": [
          "Inter"
        ],
        "mono-metric": [
          "JetBrains Mono"
        ],
        "headline-md": [
          "Inter"
        ],
        "mono-display": [
          "JetBrains Mono"
        ],
        "body-sm": [
          "Inter"
        ],
        "headline-xl-mobile": [
          "Inter"
        ],
        "label-badge": [
          "JetBrains Mono"
        ]
      },
      "fontSize": {
        "body-md": [
          "0.8125rem",
          {
            "lineHeight": "1.25rem",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "mono-data": [
          "0.8125rem",
          {
            "lineHeight": "1.125rem",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
          }
        ],
        "headline-lg": [
          "1.5rem",
          {
            "lineHeight": "2rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "label-caps": [
          "0.6875rem",
          {
            "lineHeight": "0.875rem",
            "letterSpacing": "0.08em",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "0.9375rem",
          {
            "lineHeight": "1.375rem",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "headline-xl": [
          "2.25rem",
          {
            "lineHeight": "2.75rem",
            "letterSpacing": "-0.025em",
            "fontWeight": "600"
          }
        ],
        "mono-metric": [
          "1.125rem",
          {
            "lineHeight": "1.375rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ],
        "headline-md": [
          "1.125rem",
          {
            "lineHeight": "1.5rem",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "mono-display": [
          "1.5rem",
          {
            "lineHeight": "1.75rem",
            "letterSpacing": "-0.03em",
            "fontWeight": "500"
          }
        ],
        "body-sm": [
          "0.75rem",
          {
            "lineHeight": "1rem",
            "letterSpacing": "0.01em",
            "fontWeight": "400"
          }
        ],
        "headline-xl-mobile": [
          "1.75rem",
          {
            "lineHeight": "2.25rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "label-badge": [
          "0.625rem",
          {
            "lineHeight": "0.75rem",
            "letterSpacing": "0.04em",
            "fontWeight": "500"
          }
        ]
      }
    },
  },
  plugins: [],
}
