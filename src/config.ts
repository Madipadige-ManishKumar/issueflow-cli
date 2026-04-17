import fs from "fs";

export interface IssueFlowConfig {
  githubToken?: string;
  defaultRepo?: string;
  stellarWallet?: string;
}

export function loadConfig(): IssueFlowConfig {
  if (!fs.existsSync(".issueflow")) {
    return {};
  }

  try {
    const data = fs.readFileSync(".issueflow", "utf-8");
    return JSON.parse(data);
  } catch {
    console.error("Failed to parse .issueflow file");
    return {};
  }
}