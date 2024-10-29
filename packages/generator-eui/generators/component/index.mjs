import chalk from 'chalk';
import Generator from 'yeoman-generator';
import * as utils from '../utils.mjs';

export default class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        message: 'What do you want to create?',
        name: 'fileType',
        type: 'list',
        choices: [{
          name: 'Stateless function (recommended)',
          value: 'function',
        }, {
          name: 'Component class',
          value: 'component',
        }],
        default: 'function',
      },
      {
        message: "What's the name of this component? Use snake_case, please.",
        name: 'name',
        type: 'input',
      },
      {
        message: `Where do you want to create this component's files?`,
        type: 'input',
        name: 'path',
        default: 'src/components',
        store: true,
      },
      {
        message: 'Does it need its own directory?',
        name: 'shouldMakeDirectory',
        type: 'confirm',
        default: true,
      },
    ]);

    if (!this.answers.name || !this.answers.name.trim()) {
      this.log.error(
        'Sorry, please run this generator again and provide a component name.'
      );
      process.exit(1);
    }
  }

  writing() {
    const config = this.answers;

    const writeComponent = (isStatelessFunction) => {
      const componentName = utils.makeComponentName(config.name);
      const baseName = config.name;
      const cssClassName = utils.lowerCaseFirstLetter(componentName);
      const fileName = config.name;

      const path = utils.addDirectoryToPath(
        config.path,
        fileName,
        config.shouldMakeDirectory
      );

      const vars = (config.vars = {
        baseName,
        componentName,
        cssClassName,
        fileName: fileName.replace('.ts', ''),
      });

      const componentPath = (config.componentPath = `${path}/${fileName}.tsx`);
      const testPath = (config.testPath = `${path}/${fileName}.test.tsx`);
      const stylesPath = (config.stylesPath = `${path}/${fileName}.styles.ts`);
      config.stylesImportPath = `./${fileName}.styles.ts`;

      // If it needs its own directory then it will need a root index file too.
      if (this.answers.shouldMakeDirectory) {
        this.fs.copyTpl(
          this.templatePath('index.ts'),
          this.destinationPath(`${path}/index.ts`),
          vars
        );
      }

      // Create component file.
      this.fs.copyTpl(
        isStatelessFunction
          ? this.templatePath('stateless_function.tsx')
          : this.templatePath('component.tsx'),
        this.destinationPath(componentPath),
        vars
      );

      // Create component test file.
      this.fs.copyTpl(
        this.templatePath('test.tsx'),
        this.destinationPath(testPath),
        vars
      );

      // Create component styles file.
      this.fs.copyTpl(
        this.templatePath('component.styles.ts'),
        this.destinationPath(stylesPath),
        vars
      );
    };

    switch (config.fileType) {
      case 'component':
        writeComponent();
        break;

      case 'function':
        writeComponent(true);
        break;
    }
  }

  end() {
    const showImportComponentSnippet = () => {
      const componentName = this.answers.vars.componentName;

      this.log(
        chalk.white(`\n// Export component (e.. from component's index.ts).`)
      );
      this.log(
        `${chalk.magenta('export')} {\n` +
          `  ${componentName},\n` +
          `} ${chalk.magenta('from')} ${chalk.cyan(`'./${this.answers.name}'`)};`
      );
    };

    this.log('------------------------------------------------');
    this.log(chalk.bold('Handy snippets:'));
    switch (this.fileType) {
      case 'component':
        showImportComponentSnippet();
        break;

      case 'function':
        showImportComponentSnippet();
        break;
    }
    this.log('------------------------------------------------');
  }
};
