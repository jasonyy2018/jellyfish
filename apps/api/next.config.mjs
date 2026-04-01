/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@jellyfish/db", "@jellyfish/types"],
};

export default nextConfig;
