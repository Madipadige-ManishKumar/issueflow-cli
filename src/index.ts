#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig } from './config';
const program = new Command();
const config = loadConfig();
const token=config.githubToken || process.env.GITHUB_TOKEN;//example usage of config value

program
  .name('issueflow')
  .description('CLI tool for bulk GitHub issue management with Web3 bounties')
  .version('1.0.0');

program
  .command('create')
  .description('Create issues in bulk from a markdown file')
  .option('-f, --file <file>', 'markdown file with issues')
  .option('-r, --repo <repo>', 'target repository (org/repo)')
  .action((options) => {
    console.log(`Creating issues from ${options.file} to ${options.repo}`);
  });

program
  .command('clone')
  .description('Clone issues from one repo to another')
  .option('--from <repo>', 'source repository (org/repo)')
  .option('--to <repo>', 'target repository (org/repo)')
  .action((options) => {
    console.log(`Cloning issues from ${options.from} to ${options.to}`);
  });

program
  .command('bounty')
  .description('Attach ETH/USDC bounty to a GitHub issue')
  .option('-i, --issue <number>', 'issue number')
  .option('-a, --amount <amount>', 'bounty amount (e.g. 0.1eth)')
  .option('-r, --repo <repo>', 'repository (org/repo)')
  .action((options) => {
    console.log(`Attaching ${options.amount} bounty to issue #${options.issue} in ${options.repo}`);
  });

program.parse();