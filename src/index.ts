import * as path from 'path';
import { readFile, writeFile } from 'fs';
import * as program from 'commander';
import * as inquirer from 'inquirer';
import { compile, parse } from 'handlebars';
const packjson = require('../package.json');

interface TemplatierArguments {
  template: string | null;
  path: string | null;
}

interface TemplatierTemplate {
  askForName?: boolean;
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

function writeFilPromise(path: string, content: string) {
  return new Promise((resolve, reject) => {
    writeFile(path, content, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
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

async function compileTemplate(basePath: string, config: TemplatierConfig, destinationPath: string) {
  // for all templates
  return reducePromises(config.files.map(template => {
    return () => {
      // ask for template destination name if required
      return new Promise(resolve => {
        if (template.askForName) {
          inquirer.prompt([{
            type: 'input',
            name: 'name',
            message: 'Enter destination name',
            default: template.name + template.extension || ''
          }]).then(result => {
            resolve((result as any).name);
          });
        } else {
          let destinationName = template.name + template.extension;
          resolve(destinationName);
        }
      }).then(destinationName => {
        return reducePromises((template.variables || []).map(key => {
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
            .then(output => {
              const p = path.resolve(__dirname, destinationPath, destinationName);
              console.log(p);
            });
        });
      });
    };
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
    compileTemplate(configPath, config, destinationPath);
  }
}

run();