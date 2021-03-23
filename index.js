const fs = require("fs");
const program = require("commander");
const download = require("download-git-repo");
const handlebars = require("handlebars");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const symbols = require("log-symbols");
const exec = require("child_process").exec;
const path = require("path");

const TEMPLATEFILES = [
  // Here you can list all the file directories that need to be replaced
  'package.json'
]

function startCommand() {
  return new Promise((resolve) => {
    program
      .version(
        require(path.resolve(__dirname, "./package")).version,
        "-v --version"
      )
      .command("init <name>")
      .action((name) => {
        if (!fs.existsSync(name)) {
          inquirer
            .prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Please input project name'
              },
              {
                type: 'input',
                name: 'author',
                message: 'Please input project author'
              },
              {
                type: 'list',
                name: 'description',
                choices: ['This project is for learn cli',
                          'How about do a amazing job?'],
                default: 0,
                message: 'Please input project description'
              }
            ])
            .then((answers) => {
              resolve({
                name,
                answers,
              });
            });
      } else {
        console.log(symbols.error, chalk.red("Project already exists!"));
      }
    });
    program.parse(process.argv);
    if (!program.args.length) {
      program.help();
    }
  });
}

function downloadProject(name) {
  return new Promise((resolve) => {
    const spinner = ora("Downloading template...");
    spinner.start();
    download(
      "https://github.com:Derrys/testing-case#cli-template",
      name,
      { clone: true },
      (err) => {
        if (err) {
          spinner.fail();
          console.log(symbols.error, chalk.red(err));
        } else {
          spinner.succeed();
          resolve();
        }
      }
    );
  });
}

function setTemplate(fileName, meta) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(fileName)) {
      const content = fs.readFileSync(fileName).toString();
      const result = handlebars.compile(content)(meta);
      fs.writeFileSync(fileName, result);
      resolve();
    } else {
      reject();
    }
  });
}

function doShellJob(shell, tips) {
  return new Promise((resolve, reject) => {
    const spinner = ora(tips);
    spinner.start();
    exec(shell, (error, stdout, stderr) => {
      if (error) {
        spinner.fail();
        console.log(symbols.error, chalk.red(err));
        reject();
        process.exit();
      }
      spinner.succeed();
      resolve();
    });
  });
}

!(async function () {
  const { name, answers } = await startCommand();
  await downloadProject(name);
  const spinner = ora("Set template files...");
  spinner.start();
  await Promise.all(TEMPLATEFILES.map((i) => setTemplate(path.join(__dirname, name, i), answers))).then(() => {
    spinner.succeed();
  }).catch(e => {
    console.log(symbols.error, chalk.red(e));
    spinner.fail();
  })
  await doShellJob(`cd ${name} && git init`, "Git initializing...");
  console.log(symbols.info, chalk.cyan(`cd ${name} && npm install \n`))
  // await doShellJob(`cd ${name} && npm install`, "Downloading node modules...");

  console.log(
    symbols.success,
    chalk.green("Project initialization completed, enjoy you coding now!")
  );
  process.exit();
})();
