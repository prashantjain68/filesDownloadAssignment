module.exports = {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    bracketSpacing: false,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    overrides: [
        {
            files: '*.json',
            options: {
                printWidth: 80,
            },
        },
    ],
};
