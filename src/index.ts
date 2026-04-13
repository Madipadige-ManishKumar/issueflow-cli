#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();

type SupportedToken = 'USDC';
type SupportedNetwork = 'testnet' | 'mainnet';

type BountyOptions = {
  issue: string;
  amount: string;
  repo: string;
  token?: string;
  network?: string;
  dryRun?: boolean;
};

type ParsedRepo = { owner: string; repo: string };

type BountyRequest = {
  repository: string;
  issueNumber: number;
  issueTitle: string;
  amount: number;
  token: SupportedToken;
  network: SupportedNetwork;
  chain: 'stellar';
  status: 'dry-run' | 'pending-contract-integration';
};

const program = new Command();
program.name('issueflow').description('CLI tool for bulk GitHub issue management with Web3 bounties').version('1.0.0');
program.command('create').description('Create issues in bulk from a markdown file').option('-f, --file <file>', 'markdown file with issues').option('-r, --repo <repo>', 'target repository (org/repo)').action((options) => {
  console.log(`Creating issues from ${options.file} to ${options.repo}`);
});
program.command('clone').description('Clone issues from one repo to another').option('--from <repo>', 'source repository (org/repo)').option('--to <repo>', 'target repository (org/repo)').action((options) => {
  console.log(`Cloning issues from ${options.from} to ${options.to}`);
});
program.command('bounty').description('Attach a Stellar USDC bounty to a GitHub issue').requiredOption('-i, --issue <number>', 'issue number').requiredOption('-a, --amount <amount>', 'bounty amount (e.g. 25 or 25.5)').requiredOption('-r, --repo <repo>', 'repository (owner/repo)').option('-t, --token <token>', 'bounty token', 'USDC').option('-n, --network <network>', 'stellar network (testnet or mainnet)', 'testnet').option('--dry-run', 'validate and print the generated bounty request without submitting').action(async (options: BountyOptions) => {
  try {
    await runBountyCommand(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exitCode = 1;
  }
});
program.parse();

async function runBountyCommand(options: BountyOptions): Promise<void> {
  const parsedRepo = parseRepo(options.repo);
  const issueNumber = parseIssueNumber(options.issue);
  const amount = parseAmount(options.amount);
  const token = parseToken(options.token);
  const network = parseNetwork(options.network);

  const spinner = ora('Fetching GitHub issue details').start();
  try {
    const octokit = createOctokit();
    const issue = await octokit.issues.get({ owner: parsedRepo.owner, repo: parsedRepo.repo, issue_number: issueNumber });
    if (!issue.data || !issue.data.title) throw new Error('Issue lookup succeeded but returned incomplete data.');
    spinner.succeed(`Found issue #${issueNumber}: ${issue.data.title}`);

    const bountyRequest = createBountyRequest({ repository: `${parsedRepo.owner}/${parsedRepo.repo}`, issueNumber, issueTitle: issue.data.title, amount, token, network, dryRun: Boolean(options.dryRun) });
    printSummary(bountyRequest);

    if (options.dryRun) {
      console.log(chalk.yellow('\nDry run only. No transaction was submitted.'));
      console.log(JSON.stringify(bountyRequest, null, 2));
      return;
    }

    const submitSpinner = ora('Preparing Stellar bounty attachment').start();
    const result = await submitBountyRequest(bountyRequest);
    submitSpinner.warn(result.message);
    console.log(JSON.stringify(result.payload, null, 2));
  } catch (error) {
    spinner.fail('Unable to prepare bounty command');
    throw error;
  }
}

function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}
function parseRepo(value: string): ParsedRepo {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(value.trim());
  if (!match) throw new Error('Repository must be in the form owner/repo.');
  return { owner: match[1], repo: match[2] };
}
function parseIssueNumber(value: string): number {
  const issueNumber = Number(value);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) throw new Error('Issue number must be a positive integer.');
  return issueNumber;
}
function parseAmount(value: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive number.');
  return amount;
}
function parseToken(value = 'USDC'): SupportedToken {
  const normalized = value.trim().toUpperCase();
  if (normalized !== 'USDC') throw new Error(`Unsupported token: ${value}. Only USDC is supported in this MVP.`);
  return normalized as SupportedToken;
}
function parseNetwork(value = 'testnet'): SupportedNetwork {
  const normalized = value.trim().toLowerCase();
  if (normalized !== 'testnet' && normalized !== 'mainnet') throw new Error(`Unsupported network: ${value}. Use testnet or mainnet.`);
  return normalized as SupportedNetwork;
}
function createBountyRequest(input: { repository: string; issueNumber: number; issueTitle: string; amount: number; token: SupportedToken; network: SupportedNetwork; dryRun: boolean; }): BountyRequest {
  return { repository: input.repository, issueNumber: input.issueNumber, issueTitle: input.issueTitle, amount: input.amount, token: input.token, network: input.network, chain: 'stellar', status: input.dryRun ? 'dry-run' : 'pending-contract-integration' };
}
function printSummary(request: BountyRequest): void {
  console.log(chalk.cyan('\nBounty request summary'));
  console.log(`  Repository : ${request.repository}`);
  console.log(`  Issue      : #${request.issueNumber} — ${request.issueTitle}`);
  console.log(`  Amount     : ${request.amount} ${request.token}`);
  console.log(`  Network    : ${request.network}`);
  console.log(`  Chain      : ${request.chain}`);
}
async function submitBountyRequest(request: BountyRequest): Promise<{ message: string; payload: BountyRequest }> {
  return { message: 'Contract submission is not wired up yet in this MVP. The command validated the issue and generated the bounty payload successfully.', payload: request };
}
