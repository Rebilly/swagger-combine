#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');
const assert = require('assert');

const { jsonDiff } = require('./diff');

const OPENAPI3_COMPONENTS = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'headers',
  'requestBodies',
  'links',
  'callbacks',
  'securitySchemes'
];

async function loadSpecs(specs) {
  try {
    return await Promise.all(
      specs.map(async specUrl => {
        console.error(`Loading "${specUrl}"`);
        return (await fetch(specUrl)).json();
      })
    );
  } catch (e) {
    console.error('Failed to load specs:', e.message);
    process.exit(1);
  }
}

function mergeStrictEqual(dest, src, type, srcName) {
  for (let name of Object.keys(src || {})) {
    if (dest[name]) {
      try {
        assert.deepStrictEqual(src[name], dest[name]);
      } catch (e) {
        console.error(
          jsonDiff(
            src[name],
            dest[name],
            `${type} "${name}" from <${srcName}> expected to strictly deep-equal already existing ${type.toLowerCase()}`
          )
        );
        console.error('');
      }
    } else {
      dest[name] = src[name];
    }
  }
}

/**
 * Shallow merge specs toghether
 * @param urls string[] - list of spec URLs
 */
async function combineSpecs(urls) {
  const specs = await loadSpecs(urls);
  const res = specs[0];
  const oasVersion = getSpecVersion(specs[0]);

  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];
    const specUrl = urls[i];
    if (getSpecVersion(specs[i]) !== oasVersion) {
      console.error(
        'Specs has different versions: ' + oasVersion + ' and ' + getSpecVersion(specs[i])
      );
    }

    mergeStrictEqual(res.paths, spec.paths, 'Path', specUrl);

    if (oasVersion.startsWith('3.')) {
      if (!spec.components) {
        continue;
      }
      if (!res.components) {
        res.components = {};
      }
  
      for (let componentName of OPENAPI3_COMPONENTS) {
        if (!spec.components[componentName]) continue;
        if (!res.components[componentName]) {
          res.components[componentName] = {};
        }
        mergeStrictEqual(
          res.components[componentName],
          spec.components[componentName],
          componentName,
          specUrl
        );
      }
    } else {
      mergeStrictEqual(res.definitions, spec.definitions, 'Definition', specUrl);
      mergeStrictEqual(res.responses, spec.responses, 'Response', specUrl);
      mergeStrictEqual(res.parameters, spec.parameters, 'Parameter', specUrl);
      mergeStrictEqual(
        res.securityDefinitions,
        spec.securityDefinitions,
        'Security Definition',
        specUrl
      );
    }
  }

  return res;
}

function getSpecVersion(spec) {
  return (spec.openapi || spec.swagger || '').toString() || undefined;
}

async function run(argv) {
  const urls = [argv.baseSpec, ...(argv.specs || [])];
  const merged = await combineSpecs(urls);
  if (argv.output) {
    fs.writeFileSync(argv.output, JSON.stringify(merged, null, 2));
    console.error(`Merged successfully to "${argv.output}"`);
  } else {
    console.log(JSON.stringify(merged, null, 2));
    console.error('Merged succesfully to STDOUT');
  }
}

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

module.combineSpecs = combineSpecs;
