const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'development';
}
const ENV = process.env.ENV = process.env.NODE_ENV;

const moduleRules = [
    {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'tslint-loader',
    },
    {
        test: /\.ts$/,
        loaders: ['ts-loader'],
        exclude: path.resolve(__dirname, 'node_modules'),
    },
];

const plugins = [
    new CleanWebpackPlugin([
        path.resolve(__dirname, 'build/*'),
    ]),
    new CopyWebpackPlugin([
        { from: './src/locales', to: 'locales' },
    ]),
    new webpack.DefinePlugin({
        'process.env.BWCLI_ENV': JSON.stringify(ENV),
    }),
    new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true
    }),
    new webpack.IgnorePlugin(/^encoding$/, /node-fetch/),
];

const config = {
    mode: ENV,
    target: 'node',
    devtool: ENV === 'development' ? 'eval-source-map' : 'source-map',
    node: {
        __dirname: false,
        __filename: false,
    },
    entry: {
        'bw': './src/bw.ts',
    },
    optimization: {
        minimize: false,
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            jslib: path.join(__dirname, 'jslib/src'),
            // ref: https://github.com/bitinn/node-fetch/issues/493
            'node-fetch$': 'node-fetch/lib/index.js',
        },
        symlinks: false,
        modules: [path.resolve('node_modules')],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
    },
    module: { rules: moduleRules },
    plugins: plugins,
    externals: [nodeExternals()],
};

module.exports = config;
