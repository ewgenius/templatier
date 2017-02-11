import * as path from 'path';
import { readFile } from 'fs';
import * as program from 'commander';
import * as inquirer from 'inquirer';
import { compile, parse } from 'handlebars';
const packjson = require('../package.json');

interface TemplatierArguments {
  template: string | null;
  path: string | null;
}

interface TemplatierTemplate {
  name: string;
  extension: string;
  path: string;
  variables: string[];
}

interface TemplatierConfig {
  files: TemplatierTemplate[];
}

function loadTemplate(path: string): TemplatierConfig | null {
  try {
    const config: TemplatierConfig = require(`${path}/templatier.json`);
    return config;
  } catch (error) {
    return null;
  }
}

function readFilePromise(filename: string) {
  return new Promise((resolve, reject) => {
    readFile(filename, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// chaining promises array in one promise, which resolve array of results
function reducePromises(promises: (() => Promise<any>)[]) {
  return promises.reduce((reducer, promise) => {
    return reducer.then(reduced => promise()
      .then(result => {
        return [...reduced, result];
      }));
  }, Promise.resolve([]));
}

async function compileTemplate(basePath: string, config: TemplatierConfig) {
  // for all templates
  return reducePromises(config.files.map(template => {
    // for all variables in template prompt value
    return () => reducePromises((template.variables || []).map(key => {
      return () => inquirer.prompt([{
        type: 'input',
        name: key,
        message: `Enter ${key}`
      }]);
    })).then(variables => {
      const templateVariables = variables.reduce((map, variable) => {
        return {
          ...map,
          ...variable
        };
      }, {});
      return readFilePromise(path.resolve(basePath, template.path))
        .then(input => compile(input))
        .then((compiled: any) => compiled(templateVariables))
        .then(output => console.log(output));
    });
  }));
}

async function run() {
  program
    .version(packjson.version)
    .option('-t, --template <template-name>', 'specify template name', null)
    .option('-p, --path <dest-path>', 'specify path', null)
    .parse(process.argv);

  const templatierArguments = (program as any) as TemplatierArguments;
  let {template} = templatierArguments;
  let destinationPath = templatierArguments.path;

  if (!template) {
    const result = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: 'Enter template name',
      choices: [
        'templatier-react-component'
      ]
    }]);
    template = (result as any).template;
  }

  if (!destinationPath) {
    const result = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Enter destination path',
      default: './'
    }]);
    destinationPath = (result as any).path;
  }

  const configPath = path.resolve(__dirname, '../templates', template);
  const config = loadTemplate(configPath);
  if (config) {
    compileTemplate(configPath, config);
  }
}

run();