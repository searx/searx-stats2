/* eslint-disable */
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	context: __dirname,
	entry: './index',
	output: {
		publicPath: '/'
	},
	resolve: {
		extensions: ['.js']
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				options: {
					sourceMap: true,
					presets: [
						[
							require.resolve('@babel/preset-env'),
							{
								targets: {
									browsers: ['last 2 versions', 'IE >= 9']
								},
								modules: false,
								loose: true
							}
						],
						[require.resolve('@babel/preset-react')]
					],
					plugins: [
						[require.resolve('@babel/plugin-transform-react-jsx-source')],
						[
							require.resolve('@babel/plugin-transform-react-jsx'),
							{ pragma: 'createElement', pragmaFrag: 'Fragment' }
						],
						[require.resolve('@babel/plugin-proposal-class-properties')],
						[
							require.resolve('@babel/plugin-transform-react-constant-elements')
						],
						[require.resolve('@babel/plugin-syntax-dynamic-import')]
					]
				}
			},
			{
				test: /\.s?css$/,
				use: ['style-loader', 'css-loader', 'sass-loader']
			}
		]
	},
	devtool: 'inline-source-map',
	node: {
		process: 'mock',
		Buffer: false,
		setImmediate: false
	},
	devServer: {
		historyApiFallback: true
	},
	plugins: [new HtmlWebpackPlugin()]
};
