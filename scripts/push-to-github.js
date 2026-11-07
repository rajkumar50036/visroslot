const fs = require("fs");
const path = require("path");
const https = require("https");

const OWNER = "rajkumar50036";
const REPO = "visroslot";
const BRANCH = "main";

// Token passed via process.env.GITHUB_TOKEN or CLI arg
const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ ERROR: GitHub Personal Access Token is required.");
  console.error("Usage: node scripts/push-to-github.js <GITHUB_TOKEN>");
  process.exit(1);
}

function githubRequest(endpoint, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(
      {
        hostname: "api.github.com",
        path: endpoint,
        method,
        headers: {
          "User-Agent": "VisroSlot-Deployer",
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = { raw: body };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API ${res.statusCode} (${method} ${endpoint}): ${parsed.message || body}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getAllFiles(dir, baseDir = dir) {
  const IGNORED = [
    "node_modules",
    ".next",
    ".git",
    ".netlify",
    ".vercel",
    ".system_generated",
    "preview_*.png",
    "demo_*.png",
  ];

  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git" ||
      entry.name === ".netlify" ||
      entry.name === ".vercel" ||
      entry.name.endsWith(".log") ||
      entry.name.startsWith("preview_")
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath });
    }
  }

  return results;
}

async function main() {
  console.log(`🚀 Pushing VISROSLOT files to https://github.com/${OWNER}/${REPO}...`);
  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} project files to upload.`);

  // 1. Create blobs for each file
  console.log("\n📦 Uploading file blobs to GitHub...");
  const treeItems = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const content = fs.readFileSync(f.fullPath);
    const isBinary = content.includes(0); // crude null-byte check for binary
    const encoding = isBinary ? "base64" : "utf-8";

    process.stdout.write(`[${i + 1}/${files.length}] Uploading ${f.relPath}... `);

    try {
      const blobRes = await githubRequest(`/repos/${OWNER}/${REPO}/git/blobs`, "POST", {
        content: isBinary ? content.toString("base64") : content.toString("utf-8"),
        encoding,
      });

      treeItems.push({
        path: f.relPath,
        mode: "100644",
        type: "blob",
        sha: blobRes.sha,
      });
      console.log("✓");
    } catch (err) {
      console.log("❌", err.message);
      throw err;
    }
  }

  // 2. Create Tree
  console.log("\n🌲 Creating Git Tree with all files...");
  const treeRes = await githubRequest(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    tree: treeItems,
  });
  console.log("✓ Tree created. SHA:", treeRes.sha);

  // 3. Check for existing commit on branch
  let parentCommitSha = null;
  try {
    const refRes = await githubRequest(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    parentCommitSha = refRes.object?.sha;
  } catch (err) {
    console.log(`Branch ${BRANCH} does not have an existing commit yet. Creating initial root commit...`);
  }

  // 4. Create Commit
  console.log("\n💾 Creating Git Commit...");
  const commitData = {
    message: "feat: VISROSLOT Complete SaaS Platform with Emerald Sovereign Design & Razorpay AutoPay",
    tree: treeRes.sha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };
  const commitRes = await githubRequest(`/repos/${OWNER}/${REPO}/git/commits`, "POST", commitData);
  console.log("✓ Commit created. SHA:", commitRes.sha);

  // 5. Update or Create Ref
  console.log(`\n📌 Updating ${BRANCH} reference...`);
  if (parentCommitSha) {
    await githubRequest(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, "PATCH", {
      sha: commitRes.sha,
      force: true,
    });
  } else {
    try {
      await githubRequest(`/repos/${OWNER}/${REPO}/git/refs`, "POST", {
        ref: `refs/heads/${BRANCH}`,
        sha: commitRes.sha,
      });
    } catch (createRefErr) {
      // In case repo was initialized with a different default branch name
      await githubRequest(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, "POST", {
        ref: "refs/heads/main",
        sha: commitRes.sha,
      });
    }
  }

  console.log(`\n🎉 SUCCESS! All files have been imported into:`);
  console.log(`👉 https://github.com/${OWNER}/${REPO}`);
  console.log(`\nTo deploy on Vercel with 1 click:`);
  console.log(`🔗 https://vercel.com/new/clone?repository-url=https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error("\n❌ Push failed:", err.message);
  process.exit(1);
});
