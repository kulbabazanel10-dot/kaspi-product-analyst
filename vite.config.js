import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/kaspi-product-analyst/",
  plugins: [react()],
});
