import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://kaybrian.github.io/contact-qr/
export default defineConfig({
  base: "/contact-qr/",
  plugins: [react()],
});
