const { Octokit } = require('@octokit/rest');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const palisaDoesReadmeData = require('./Palisadoes/readmeData');
const cncfJaegerReadmeData = require('./CNCF - JaegerTracing/readmeData');
const asyncapiReadmeData = require('./AsyncAPI/readmeData');

// Input variables from the workflow
const token = process.env.GITHUB_TOKEN;
const author = 'anshgoyalevil';
const outputDirs = [
    {
        dirname: 'Palisadoes',
        readmeData: palisaDoesReadmeData,
        repository: 'PalisadoesFoundation/talawa-api',
    },
    {
        dirname: 'CNCF - JaegerTracing',
        readmeData: cncfJaegerReadmeData,
        repository: 'jaegertracing/jaeger-ui',
    },
    {
        dirname: 'AsyncAPI',
        readmeData: asyncapiReadmeData,
        repository: 'asyncapi/website',
    }
];

const octokit = new Octokit({
    auth: token,
    request: {
        fetch: fetch,
    },
});

async function generateMarkdownTable() {
    try {

        for (let i = 0; i < outputDirs.length; i++) {

            const [owner, repo] = outputDirs[i].repository.split('/');

            // Fetch merged PRs by the author
            const allPRs = [];
            let page = 1;

            while (true) {
                const { data: prs } = await octokit.pulls.list({
                    owner,
                    repo,
                    state: 'closed',
                    sort: 'updated',
                    direction: 'asc',
                    per_page: 100,
                    page: page++,
                });
                if (prs.length === 0) break;
                allPRs.push(...prs);
            }

            // Filter PRs by the author
            const authorPRs = allPRs.filter((pr) => pr.user.login === author);

            // Generate markdown table
            const markdownTable = `
${outputDirs[i].readmeData}

| Date | Pull Request Title | Link to PR |
| --- | --- | --- |
${authorPRs.map((pr) =>
                `| ${new Date(pr.merged_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', })} | ${pr.title} | [Link to PR](${pr.html_url}) |`).join('\n')}`;

            fs.writeFileSync(`${outputDirs[i].dirname}/README.md`, markdownTable);

        }

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

generateMarkdownTable();