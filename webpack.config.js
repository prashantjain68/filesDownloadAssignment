const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.tsx',

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
            chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
            clean: true,
            publicPath: '/',
        },

        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@pages': path.resolve(__dirname, 'src/pages'),
                '@hooks': path.resolve(__dirname, 'src/hooks'),
                '@utils': path.resolve(__dirname, 'src/utils'),
                '@types': path.resolve(__dirname, 'src/types'),
                '@assets': path.resolve(__dirname, 'src/assets'),
            },
        },

        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: true,
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.(js|jsx)$/,
                    use: 'babel-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
            ],
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: './public/index.html',
            }),
        ],

        devServer: {
            static: {
                directory: path.join(__dirname, 'public'),
            },
            port: 3000,
            hot: true,
            historyApiFallback: true,
            compress: true,
        },

        optimization: isProduction
            ? {
                  splitChunks: {
                      chunks: 'all',
                      cacheGroups: {
                          vendor: {
                              test: /[\\/]node_modules[\\/]/,
                              name: 'vendors',
                              chunks: 'all',
                          },
                      },
                  },
              }
            : {},

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        stats: {
            errorDetails: true,
        },
    };
};
