import * as path from 'path';
import { readFile } from 'fs';
import * as program from 'commander';
import * as inquirer from 'inquirer';
import { compile, parse } from 'handlebars';
const packjson = require('../package.json');

interface TemplatierArguments {
  template: string | null;
}

interface TemplatierTemplate {
  name: string;
  extension: string;
  path: string;
  variables: string[];
}

interface TemplatierConfig {
  templates: TemplatierTemplate[];
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

function compileTemplate(basePath: string, config: TemplatierConfig) {
  Promise.all(config.templates.map(template => {
    return Promise.all(Object.keys(template.variables || {}).map(key => {
      return inquirer.prompt([{
        type: 'input',
        name: key,
        message: `Enter ${key}`
      }]);
    })).then(variables => {
      console.log(variables);
      return readFilePromise(path.resolve(basePath, template.path))
        .then(input => compile(input))
        .then((compiled: any) => compiled({}));
    });
  }));
}

async function run() {
  program
    .version(packjson.version)
    .option('-t, --template <template-name>', 'specify template name', null)
    .option('-p, --path <dest-path>', 'specify path', './')
    .parse(process.argv);

  let {template} = (program as any) as TemplatierArguments;

  if (!template) {
    const result = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: 'Enter template name',
      choices: [
        'templatier-test',
        'templatier-react'
      ]
    }]);
    template = (result as any).template;
  }

  const configPath = path.resolve(__dirname, '../templates', template);
  const config = loadTemplate(configPath);
  if (config) {
    console.log(compileTemplate(configPath, config));
  }
}

run();