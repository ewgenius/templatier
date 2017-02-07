"use strict";
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
function compileTemplate(basePath, config) {
    Promise.all(config.templates.map(template => {
        return Promise.all(Object.keys(template.variables || {}).map(key => {
            console.log(key);
            return inquirer.prompt([{
                    type: 'input',
                    name: key,
                    message: `Enter ${key}`
                }]);
        })).then(variables => {
            console.log(variables);
            return readFilePromise(path.resolve(basePath, template.path))
                .then(input => handlebars_1.compile(input))
                .then((compiled) => compiled({}));
        });
    }));
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        program
            .version(packjson.version)
            .option('-t, --template <template-name>', 'specify template name', null)
            .option('-p, --path <dest-path>', 'specify path', './')
            .parse(process.argv);
        let { template } = program;
        if (!template) {
            const result = yield inquirer.prompt([{
                    type: 'list',
                    name: 'template',
                    message: 'Enter template name',
                    choices: [
                        'templatier-test',
                        'templatier-react'
                    ]
                }]);
            template = result.template;
        }
        const configPath = path.resolve(__dirname, '../templates', template);
        const config = loadTemplate(configPath);
        if (config) {
            console.log(compileTemplate(configPath, config));
        }
    });
}
run();
