import * as program from 'commander';
import * as inquirer from 'inquirer';

interface TemplatierArguments {
  template: string | null;
  name: string | null;
}

async function run() {
  program
    .version('1.0.0')
    .option('-t, --template <template-name>', 'specify template name', null)
    .option('-n, --name <file-name>', 'specify file name', null)
    .parse(process.argv);

  let {template, name} = (program as any) as TemplatierArguments;

  if (!template) {
    const result = await inquirer.prompt([{
      type: 'input',
      name: 'template',
      message: 'Enter template name'
    }]);
    template = (result as any).template;
  }

  if (!name) {
    const result = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter file name'
    }]);
    name = (result as any).name;
  }

  console.log(name);
  console.log(template);
}

run();