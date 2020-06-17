const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
    // mode: 'production',
    mode: 'development',
    entry: {
        style: './js/style.js',
        main: './js/main.js',
        vendor: ['three', 'three-obj-mtl-loader']
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, "/dist")
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    name: 'vendor',
                    test: /three/,
                    chunks: 'all',
                }
            }
        },
        runtimeChunk: false
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            title: 'WechatJump'
        }),
        new CopyWebpackPlugin([{
            from: './res',
            to: './res'
        }]),
        new webpack.HotModuleReplacementPlugin(),
        new BundleAnalyzerPlugin()
    ],
    devServer: {
        contentBase: path.join(__dirname, "/dist"),
        overlay: true,
        stats: 'errors-only',
        inline: true,
        hot: true,
        host: 'localhost',
        port: 6300,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            },
            {
                test: /\.less$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "less-loader" // compiles Less to CSS
                }]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|otf)$/,
                use: 'url-loader'
            },
        ],
    },
    externals: {
        createjs: 'createjs'
    },
};