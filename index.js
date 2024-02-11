const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const archiver = require("archiver");
const axios = require("axios");

const context = github.context;
const { owner, repo } = context.repo;

if (context.payload.pull_request) {
    number = context.payload.pull_request.number;
} else if (context.payload.issue) {
    number = context.payload.issue.number;
} else {
    core.setFailed("No pull request or issue found in the payload.");
    return;
}

async function postComment(message) {
    try {
        const token = core.getInput('github-token');
        const octokit = github.getOctokit(token);

        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: number,
            body: message
        });
    } catch (error) {
        core.setFailed(`Failed to post comment: ${error.message}`);
    }
}

function createZip(sourceDir) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(`file.zip`);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive
            .directory(sourceDir, false)
            .pipe(output)
            .on('close', () => resolve())
            .on('error', reject);

        archive.finalize();
    });
}

async function sendZipToExternalAPI() {
    const url = "https://app.pushpreview.com/api/previews/";
    const secretToken = core.getInput("pushpreview-token");
    const file = fs.createReadStream("file.zip");

    try {
        const response = await axios.post(url, {
            pr_identifier: number,
            organization: owner,
            repository_name: repo,
            origin_source: 'GitHub',
            file
        }, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Api-Key ${secretToken}`
            }
        });

        return response.data.previewUrl;
    } catch (error) {
        
        let errorMessage;
        switch (error.response.status) {
            case 401:
                errorMessage = "🚨 Error: Invalid API key or team not found. Please verify your credentials.";
                break;
            case 402:
                errorMessage = "🚨 Error: Preview limit reached. Upgrade your plan at pushpreview.com for additional previews and features.";
                break;
            case 403:
                errorMessage = "🚨 Error: Invalid API key or team not found. Please verify your credentials.";
                break;
            case 413:
                errorMessage = "🚨 Error: The preview exceeds the MB limit. Upgrade your plan at pushpreview.com for higher limits and additional features.";
                break;
            default:
                errorMessage = "🚨 Error: Internal server error. Please try again later.";
                break;
        }
        await postComment(errorMessage);
        core.setFailed(errorMessage);
        return null;
    }
}

async function main() {
    const sourceDir = core.getInput("source-directory");
    console.log(sourceDir);

    if (!fs.existsSync(sourceDir)) {
        const errorMessage = `The source directory "${sourceDir}" does not exist.`;
        await postComment(`Workflow failed with the following error: ${errorMessage}`);
        core.setFailed(errorMessage);
        return;
    }

    try {
        await createZip(sourceDir);
        const previewUrl = await sendZipToExternalAPI();
        if (previewUrl) {
            await postComment(`🎉 Success! Your live preview is now available. Check it out here: ${previewUrl}`);
        }
    } catch (error) {
        await postComment(`Workflow failed with the following error: ${error.message}`);
        core.setFailed(error.message);
    }
}

main();
