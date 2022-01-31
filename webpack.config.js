const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/client/index.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist/public"),
    publicPath: "/",
  },
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
        use: "ts-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ], 
  },  
  plugins: [
    new HTMLWebpackPlugin({
      template: "src/client/index.html"
    }),
  ]
}