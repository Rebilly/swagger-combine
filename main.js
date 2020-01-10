#!/usr/bin/env node

const { run } = require('./');

const argv = require('yargs').command('* <baseSpec> [specs...]', '', argv => {
  argv
    .positional('baseSpec', {
      description: 'Base spec URL',
      type: 'string',
      require: true,
    })
    .positional('specs', {
      description: 'List of spec URLs to merge',
      type: 'string',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output filename, by default stdout will be used',
    });
}).argv;

if (require.main === module) {
  run(argv);
}