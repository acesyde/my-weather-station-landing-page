import type { NextConfig } from "next";
import { validateEnvironmentVariables } from "./src/lib/env-validation";

// Validate environment variables at startup
validateEnvironmentVariables();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
