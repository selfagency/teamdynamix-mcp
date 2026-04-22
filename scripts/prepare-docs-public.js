import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const repoRoot = resolve(__dirname, '..');
  const sourceSkillDir = resolve(repoRoot, 'skills', 'teamdynamix');
  const publicAgentSkillsDir = resolve(repoRoot, 'docs', 'public', '.well-known', 'agent-skills');
  const targetSkillDir = resolve(publicAgentSkillsDir, 'teamdynamix');
  const sourceSkillPath = resolve(sourceSkillDir, 'SKILL.md');
  const targetSkillPath = resolve(targetSkillDir, 'SKILL.md');
  const indexPath = resolve(publicAgentSkillsDir, 'index.json');

  await mkdir(publicAgentSkillsDir, { recursive: true });
  await rm(targetSkillDir, { recursive: true, force: true });
  await cp(sourceSkillDir, targetSkillDir, { recursive: true });

  const skillContents = await readFile(sourceSkillPath);
  const digest = createHash('sha256').update(skillContents).digest('hex');

  const indexDocument = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'teamdynamix',
        type: 'skill-md',
        description:
          'Use this skill when the user needs TeamDynamix ITSM operations through MCP with safe ID-first workflows.',
        url: '/.well-known/agent-skills/teamdynamix/SKILL.md',
        digest: `sha256:${digest}`,
      },
    ],
  };

  await writeFile(indexPath, `${JSON.stringify(indexDocument, null, 2)}\n`, 'utf8');

  console.log(`Copied skill from ${sourceSkillDir} to ${targetSkillDir}`);
  console.log(`Wrote ${indexPath}`);
  console.log(`Generated digest for ${targetSkillPath}: sha256:${digest}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
