# @rebilly/swagger-combine

Opinionated tool to shallow-merge two or more swagger 2.0 specs into one.

## Install

Using npm:

     npm install @rebilly/swagger-combine

or yarn:

    yarn add @rebilly/swagger-combine

## Usage

```js
const { combineSpecs } = require('@rebilly/swagger-combine');

const merged = combineSpecs([
  'https://rebilly.github.io/RebillyAPI/swagger.json',
  'https://rebilly.github.io/RebillyUserAPI/swagger.json',
  'https://rebilly.github.io/RebillyReportsAPI/swagger.json',
]);
```

## Usage as a CLI tool

Install globally:

    npm install -g @rebilly/swagger-combine

or

    yarn global add @rebilly/swagger-combine

or use [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b)

```
swagger-combine <baseSpec> [specs...]

Positionals:
  baseSpec  Base spec URL                                               [string]
  specs     List of spec URLs to merge                                  [string]

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  --output, -o  Output filename, by default stdout will be used         [string]

Examples:
  [combine 3 specs]
    
    swagger-combine -o merged.json https://rebilly.github.io/RebillyAPI/swagger.json https://rebilly.github.io/RebillyUserAPI/swagger.json https://rebilly.github.io/RebillyReportsAPI/swagger.json
```