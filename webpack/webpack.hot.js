const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const devServerConfig = require('./dev-config')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isDev = process.env.NODE_ENV == 'development'
const isProd = !isDev

const plugins = [
	new HtmlWebpackPlugin({
		template: path.join(__dirname, '../index.html')
	})
]

if (isProd) {
	plugins.push(
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		})
	)
}

module.exports = {
	mode: isDev ? 'development' : 'production',
	devtool: 'inline-source-map',
	target: 'electron-renderer',
	entry: path.join(__dirname, '../src/browser/main.tsx'),
	output: {
		path: path.join(__dirname, '../dist/browser'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: [ '.ts', '.tsx', '.js' ],
		plugins: [ new TsconfigPathsPlugin({ configFile: path.join(__dirname, '../tsconfig.json') }) ]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							babelrc: true,
							plugins: [ 'react-hot-loader/babel' ]
						}
					},
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true
						}
					}
				]
			},
			{
				test: /\.s?css$/,
				use: [
					{
						loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader
					},
					{
						loader: 'css-loader' // translates CSS into CommonJS
					},
					{
						loader: 'sass-loader' // compiles Sass to CSS
					}
				]
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 200,
							outputPath: 'assets',
							publicPath:'assets'
						}
					}
				]
			}
		]
	},
	
	devServer: isDev ? devServerConfig : {},

	plugins: plugins
}
