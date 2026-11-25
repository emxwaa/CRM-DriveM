import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@drivem/config", "@drivem/db", "@drivem/domain", "@drivem/ui"],
};

export default config;
