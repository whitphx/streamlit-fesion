module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Use worker-loader with CRA.
      // Ref: https://github.com/dominique-mueller/create-react-app-typescript-web-worker-setup
      webpackConfig.module.rules.unshift({
        test: /\.worker\.ts$/,
        use: {
          loader: "worker-loader",
          options: {
            // Use directory structure & typical names of chunks produces by "react-scripts"
            filename: "static/js/[name].[contenthash:8].js",
            inline: "no-fallback", // Inline the worker script for stlite env.
          },
        },
      });

      return webpackConfig;
    },
  },
};
