const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
    // mode: 'production',
    mode: 'development',
    entry: {
        main: './js/main.js'
    },
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, "/dist")
    },
    ///copy html
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            title: 'WechatJump'
        }),
        new CopyWebpackPlugin([{
            from: './res',
            to: './res'
        }]),
        // to 是相对于 output.path 的
        // new CopyWebpackPlugin([{
        //     from: './web/libs',
        //     to: './libs'
        // }]),
        // new CopyWebpackPlugin([{
        //     from: './web/res',
        //     to: './res'
        // }]),
        new webpack.HotModuleReplacementPlugin()
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
    }
};
