import chalk from 'chalk';
import ora from 'ora';

let spinner = null;

export function startSpinner(text) {
  spinner = ora(text).start();
  return spinner;
}

export function succeedSpinner(text) {
  if (spinner) spinner.succeed(text);
}

export function failSpinner(text) {
  if (spinner) spinner.fail(text);
}

export function info(msg) {
  console.log(chalk.cyan('ℹ'), msg);
}

export function warn(msg) {
  console.warn(chalk.yellow('⚠'), msg);
}

export function error(msg) {
  console.error(chalk.red('✖'), msg);
}

export function success(msg) {
  console.log(chalk.green('✔'), msg);
}
