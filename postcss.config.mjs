const config = {
  plugins: [
    "@tailwindcss/postcss",
    // Plugins pour optimisation CSS en production
    ...(process.env.NODE_ENV === "production" ? [] : []),
  ],
};

export default config;
