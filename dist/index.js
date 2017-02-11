"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require("path");
const fs_1 = require("fs");
const program = require("commander");
const inquirer = require("inquirer");
const handlebars_1 = require("handlebars");
const packjson = require('../package.json');
function loadTemplate(path) {
    try {
        const config = require(`${path}/templatier.json`);
        return config;
    }
    catch (error) {
        return null;
    }
}
function writeFilePromise(path, content) {
    return new Promise((resolve, reject) => {
        fs_1.writeFile(path, content, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}
function readFilePromise(filename) {
    return new Promise((resolve, reject) => {
        fs_1.readFile(filename, 'utf8', (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}
// chaining promises array in one promise, which resolve array of results
function reducePromises(promises) {
    return promises.reduce((reducer, promise) => {
        return reducer.then(reduced => promise()
            .then(result => {
            return [...reduced, result];
        }));
    }, Promise.resolve([]));
}
function compileTemplate(basePath, config, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
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
                            resolve(result.name);
                        });
                    }
                    else {
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
                            return __assign({}, map, variable);
                        }, {});
                        return readFilePromise(path.resolve(basePath, template.path))
                            .then(input => handlebars_1.compile(input))
                            .then((compiled) => compiled(templateVariables))
                            .then(output => {
                            const p = path.resolve(__dirname, destinationPath, destinationName);
                            return writeFilePromise(p, output);
                        });
                    });
                });
            };
        }));
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        program
            .version(packjson.version)
            .option('-t, --template <template-name>', 'specify template name', null)
            .option('-p, --path <dest-path>', 'specify path', null)
            .parse(process.argv);
        const templatierArguments = program;
        let { template } = templatierArguments;
        let destinationPath = templatierArguments.path;
        if (!template) {
            const result = yield inquirer.prompt([{
                    type: 'list',
                    name: 'template',
                    message: 'Enter template name',
                    choices: [
                        'templatier-react-component'
                    ]
                }]);
            template = result.template;
        }
        if (!destinationPath) {
            const result = yield inquirer.prompt([{
                    type: 'input',
                    name: 'path',
                    message: 'Enter destination path',
                    default: './'
                }]);
            destinationPath = result.path;
        }
        const configPath = path.resolve(__dirname, '../templates', template);
        const config = loadTemplate(configPath);
        if (config) {
            compileTemplate(configPath, config, destinationPath);
        }
    });
}
run();
