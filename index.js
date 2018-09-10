const fetch = require('node-fetch');
const fs = require('fs');
const assert = require('assert').strict;

async function loadSpecs(specs) {
  try {
    return await Promise.all(
      specs.map(async specUrl => {
        console.error(`Loading "${specUrl}"`)
        return (await fetch(specUrl)).json()
      })
    );
  } catch (e) {
    console.error('Failed to load specs:', e.message);
    process.exit(1);
  }
}

function mergeStrictEqual(dest, src, type, srcName) {
  for (let name of Object.keys(src)) {
    if (dest[name]) {
      try {
        assert.deepStrictEqual(src[name], dest[name]);
      } catch (e) {
        console.error(
          e.message.replace(
            'Input A expected to strictly deep-equal input B:',
            `${type} "${name}" from <${srcName}> expected to strictly deep-equal already existing ${type.toLowerCase()}`
          )
        );
        console.error();
      }
    } else {
      dest[name] = src[name];
    }
  }
}

function mergeSpecs(specs, urls) {
  const res = specs[0];

  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];
    const specUrl = urls[i];
    mergeStrictEqual(res.paths, spec.paths, 'Path', specUrl);
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

  return res;
}

async function run(argv) {
  const urls = [argv.baseSpec, ...(argv.specs || [])];
  const specs = await loadSpecs(urls);
  console.error('Start merging...\n');
  const merged = mergeSpecs(specs, urls);
  if (argv.output) {
    fs.writeFileSync(argv.output, JSON.stringify(merged, null, 2))
    console.error(`Merged successfully to "${argv.output}"`);
  } else {
    console.error(JSON.stringify(merged, null, 2));
    console.error('Merged succesfully to STDOUT');
  }

}

const argv = require('yargs')
  .command('* <baseSpec> [specs...]', '', argv => {
    argv.positional('baseSpec', {
      description: 'Base spec URL',
      type: 'string',
      require: true
    })
    .positional('specs', {
      description: 'List of spec URLs to merge',
      type: 'string'
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output filename, by default stdout will be used'
    })
  })

  .argv

run(argv);