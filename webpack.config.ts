import path from 'path';
import { Configuration } from 'webpack';

// const isDev = process.env.NODE_ENV === 'development';
const isDev = true;

const option: Configuration = {
  mode: isDev ? 'development' : 'production',
  entry: `./src/renderer/index.ts`,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'tac.js',
    path: path.join(__dirname, 'dist'),
  },
  devtool: isDev ? 'inline-source-map' : undefined,
};

export default option;
