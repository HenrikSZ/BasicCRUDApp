import path from "path"
import HTMLWebpackPlugin from "html-webpack-plugin"
import webpack from "webpack"

export default {
  mode: "development",
  entry: {
    main: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/client/index.tsx'],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve("dist/public"),
    publicPath: "/",
  },
  target: "web",
  module: {
    rules:[
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.html$/,
        use: "html-loader"
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /server/,
        use: [{
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.webpack.json"
          }
        }]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ], 
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: "src/client/index.html"
    }),
    new webpack.HotModuleReplacementPlugin(),
  ]
}