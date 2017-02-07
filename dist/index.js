"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const program = require("commander");
const inquirer = require("inquirer");
const packjson = require('../package.json');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        program
            .version(packjson.version)
            .option('-t, --template <template-name>', 'specify template name', null)
            .option('-n, --name <file-name>', 'specify file name', null)
            .parse(process.argv);
        let { template, name } = program;
        if (!template) {
            const result = yield inquirer.prompt([{
                    type: 'input',
                    name: 'template',
                    message: 'Enter template name'
                }]);
            template = result.template;
        }
        if (!name) {
            const result = yield inquirer.prompt([{
                    type: 'input',
                    name: 'name',
                    message: 'Enter file name'
                }]);
            name = result.name;
        }
        console.log(name);
        console.log(template);
    });
}
run();
