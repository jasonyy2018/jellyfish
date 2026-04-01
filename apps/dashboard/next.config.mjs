/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@jellyfish/ui", "@jellyfish/types"],
};

export default nextConfig;
