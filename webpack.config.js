const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'development';
}
const ENV = process.env.ENV = process.env.NODE_ENV;

const isVendorModule = (module) => {
    if (!module.context) {
        return false;
    }
    return module.context.indexOf('node_modules') !== -1;
};

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
        'process.env.NODE_ENV': JSON.stringify(ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
    }),
    new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true
    }),
];

const config = {
    target: 'node',
    devtool: ENV === 'development' ? 'eval-source-map' : 'source-map',
    node: {
        __dirname: false,
        __filename: false,
    },
    entry: {
        'bw': './src/bw.ts',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            jslib: path.join(__dirname, 'jslib/src'),
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
};

module.exports = config;
