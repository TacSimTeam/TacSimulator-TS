const path = require("path");

// 開発中はisDev = trueとする
// 開発者モードからエラー箇所が特定しやすくなる
// const isDev = true;
const isDev = false;

module.exports = {
    mode: isDev ? 'development' : 'production',
    entry: `./src/renderer/index.ts`,
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: [
            '.ts', '.js'
        ]
    },
    output: {
        filename: "tac.js",
        path: path.join(__dirname, "dist"),
    },
    watch: isDev,
    devtool: isDev ? 'inline-source-map' : undefined,
};
