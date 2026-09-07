# Session 2 Storybook

**Classroom: Agentische Entwicklung mit Claude Code, Mastra & CopilotKit, Session 2**

This is the live-coding script for session 2. Each step gives you a **Goal**, the
**Prompt** to hand Claude Code, **Teaching points** to narrate while the agent works, and
a **Verify** checklist. The steps keep counting from session 1, so today starts at step
8. Appendix A has the recipe for driving the same prompts headless with
`claude -p --model claude-opus-5` against the starter repo.

The prompts stay short and natural on purpose. You give a frontier model the outcome and
the constraints that matter, and you point it at current docs. It fills in the rest.
Session 1 worked that way, and today doesn't change it.

Not every prompt reaches its goal in every run, and that is part of the material. When
an agent falls short, the teaching point is the mechanism behind the shortfall, and the
room learns more from that than from a diff that happened to work. The one rule that
holds at the end of every step is that the tree compiles and the suite is green. A goal
that turns out to be too big for the room gets named as such and left to a real project.
The teaching points below say "expect the agent to" rather than "the agent will" for
this reason.

## Where we start

Session 1 ended with **ai-tutor** after step 7: Next.js 16, Better Auth, SQLite through
Drizzle, one Mastra agent called `tutor` behind CopilotKit over AG-UI, and a Vitest plus
Playwright harness. The tutor is Bartholomew, a British butler who keeps a to-do list in
his memory and declines everything else. That code is published as the starter for
today:

```
https://github.com/rstropek/2026-claude-classroom-2-starter
```

Everybody works in their own fork of that repository, because later steps open pull
requests and create git worktrees, and both need a repo you own.

## What we build today

By the end of the session, the tutor manages the to-do list through **typed tools**
backed by the `todos` table, a read-only sidebar shows the list, and the app carries a
project-specific **design skill** derived from heise.de. Along the way the dependencies
move to their current versions and a few developer-experience bugs get fixed.

## What we teach today

The app is still the vehicle. Session 1 taught how to drive one agent run. Today is
about **working with an agent over time**, in a repo that already exists.

1. **Working in an existing codebase.** Exploration in plan mode, small fixes, a
   dependency upgrade with a major version jump, and tests as the safety net for all
   of it.
2. **Tool calling.** Zod schemas as the contract between the model and your code, and
   identity that comes from the server session rather than from the model.
3. **Context hygiene.** What sits in the context window, what `/compact` and `/clear`
   do to it, and why a fat context costs both money and quality.
4. **Delegation.** One prompt to a strong model, which hands the pieces to cheaper
   models in parallel, one of them behind a different coding harness, and reviews what
   comes back.
5. **A custom skill.** The meta-skill and the design skill combine into a skill of your
   own.
6. **Git workflows and worktrees.** Branches and pull requests for every step, and two
   agents restyling the same app in parallel worktrees, with the merge conflict that
   follows.

---

## Step 8: recap and housekeeping

**Goal:** everybody has the starter running, remembers what it does, has seen the
protocol between the browser and the agent, and has watched Claude Code drive a second
coding agent.

### Fork, clone, run

```bash
gh repo fork rstropek/2026-claude-classroom-2-starter --clone
cd 2026-claude-classroom-2-starter
gh repo set-default            # pick your fork, so gh pr targets it, not the original
npm install
cp .env.example .env           # then fill in OPENROUTER_API_KEY and BETTER_AUTH_SECRET
npm run db:migrate
npm run dev
```

In a second terminal, install pi for the last part of this step:

```bash
npm install -g @mariozechner/pi-coding-agent
```

Sign up at <http://localhost:3000/signup>, ask Bartholomew to put something on the
list, and ask him a general-knowledge question so everyone sees him refuse.

**Teaching points**

- `gh repo set-default` is the one line people forget after forking. Without it,
  `gh pr create` offers the original repository as the base, and your pull request
  lands in somebody else's queue.
- `.env` is git-ignored and `.env.example` documents it. The starter has no database
  file either, so `db:migrate` creates a fresh one. Everything about this app is local.

### Claude Code, the refresher

Start `claude` in the repo and walk through the session basics once, because today
leans on them.

- `/status` shows the account, the model, and the permission mode. `/model` switches
  the model, and `Shift+Tab` cycles the permission modes. Plan mode is the one to
  remember, because it lets Claude read and propose without touching a file.
- `/context` shows what is in the context window right now, before you typed anything.
  AGENTS.md and the skill descriptions are already in there. Keep that picture in mind
  for step 10.
- `/doctor` checks the installation and proposes cuts for a bloated memory file.
- Ask Claude something about the repo. "How does a chat message get from the browser to
  OpenRouter?" is a fine first question, and the tool stream shows Claude reading
  `app/api/copilotkit/[...all]/route.ts` and `lib/tutor.ts` to answer.

### The system prompt is a string in a file

Open `lib/tutor.ts`. The whole personality is the `instructions` constant. Give
everyone a moment to change it: a different name, a different language, a butler
who is rude, whatever they like. Then have them chat with the result.

The change doesn't show up on hot reload, because `lib/tutor.ts` caches the agent.
Restart `npm run dev` and the new prompt is live. Prompt 9.2 fixes that, so leave the
restart in place for now.

### Watch the protocol

CopilotKit talks to our route over **AG-UI**, a stream of typed JSON events: the run
starts, text arrives in deltas, tool calls open and close, the run finishes. You can
watch it two ways.

- **Network tab.** Filter for `copilotkit`, send a message, and open the `run` request.
  It's a `text/event-stream` response, and every `data:` line is one event. Notice the
  long run of `REASONING_MESSAGE_CONTENT` events before the first
  `TEXT_MESSAGE_CONTENT`. The model thinks before it answers, and the protocol carries
  that thinking as its own event type. That is what the "Thought for a few seconds"
  line in the chat is made of.
- **The Inspector.** CopilotKit ships a debugging panel that is on by default in
  development and never loads in production. The launcher bubble sits under the header
  on the right, and the "View in Inspector" link under every reply opens a panel with
  the thread, every event, the agent's state, and counters for messages, tool calls,
  and errors. The tool-call counter reads zero today, and it stops reading zero in step
  11.

### Claude drives another agent

**Start prompt 9.1 now.** It updates every dependency and runs the whole suite until
it's green, which takes long enough to stall a live session. Run `git restore
lib/tutor.ts` so the working tree is clean, open a second terminal with its own Claude
Code session, paste prompt 9.1 from step 9, and leave it running while this section
plays out. By the time step 9 starts, the run is done or close to it, and you walk the
room through the result instead of waiting for it.

Claude Code is one harness around a model. **pi** from pi.dev is another one, a coding
agent CLI with the same shape: read, bash, edit, and write tools, sessions, skills, and
a non-interactive `-p` mode. In your Claude Code session:

> **Prompt 8.1**
>
> Run the pi coding agent (the pi command) non-interactively with the prompt "Hi!" and
> show me what it answers. Use the model openrouter/z-ai/glm-5.3-flash with thinking
> low; the OpenRouter key is in .env.

Claude sources `.env`, runs `pi -p --model openrouter/z-ai/glm-5.3-flash --thinking low
"Hi!"`, and pastes pi's greeting back. A harness is a program with a command line, so
one agent runs another the way it runs `npm test`. Expect two details in Claude's
summary. pi has no catalog entry for that model, prints a warning, and passes the id
through to OpenRouter anyway. And `--thinking low` is there because the OpenRouter
endpoint for this model refuses to run with reasoning off. Read that summary out with
the room. Claude produces summaries like this one all day, and the details buried in
them are where the learning sits.

**Teaching points**

- The agent you *drive* and the agent you *build* have the same anatomy. Claude Code
  sends messages and tool calls to Anthropic's API, and our tutor sends messages and
  tool calls to OpenRouter and forwards them to the browser as AG-UI events. If Docker
  is at hand, `claude-via-mitmproxy.sh` in the classroom repo shows Claude Code's own
  traffic in mitmweb, and the `tool_use` blocks in it look a lot like the
  `TOOL_CALL_START` events you just saw.
- Make the inspector a habit. Every later step has a moment where "what did the agent
  actually receive" decides the debugging, and the inspector answers it in one click.

**Verify:** the app runs from a fork, the changed system prompt shows after a restart,
and everyone has seen the event stream once. Then put the prompt back with
`git restore lib/tutor.ts`, so step 9 starts clean.

## Step 9: three fixes in the existing repo

**Goal:** bug fixes and small features in a repo that already exists, with real bugs.
Three prompts, one commit each, on `main`. Claude Code sometimes branches off `main`
on its own before it commits. If `git status` shows a new branch after a prompt, bring
it back with `git switch main && git merge <branch>` and move on. Step 11 makes
branches the rule anyway.

> **Prompt 9.1**
>
> Update every dependency to its latest version, majors included. Check whether this
> Next.js version supports TypeScript 7;
> if it does, move to TypeScript 7, otherwise stay on 6. Read the migration notes of
> anything that jumped a major before you touch config. Make tests, e2e, build, and
> biome green. Then check every claim in AGENTS.md against the repo and fix what has
> gone stale. Commit when everything is green.

> **Prompt 9.2**
>
> One developer-experience fix, development only, production behavior must not change:
> editing the tutor's instructions in lib/tutor.ts should take effect on hot reload
> without a dev-server restart, while the database connection stays cached. Keep the
> suite green and AGENTS.md current. Commit when everything is green.

> **Prompt 9.3**
>
> The chat renders as a white box on a black page for users who enabled dark mode in
> their operating system. Force light mode for the whole app, let the chat use the
> available width and height, keep the header. Small and tasteful, no redesign yet, that
> comes later today. Suite green, AGENTS.md current. Commit when everything is green.

**Teaching points**

- **Let the agent do the research.** Prompt 9.1 doesn't say whether TypeScript 7 works
  with this Next.js version. It says where the answer is, and the agent opens the docs
  in `node_modules` and decides. If your run stays on 6, ask the agent why and read the
  answer out.
- **The suite is the safety net.** Prompt 9.1 tells the agent to read the migration
  notes, and the suite tells it whether the reading was enough. Watch the tool stream
  alternate between an edit and a test run until everything is green. A patch bump
  that quietly needs a database migration gets caught the same way, by a failing
  startup check rather than by anyone reading a changelog.
- **Memory drifts.** AGENTS.md holds a couple of claims that were true when written and
  aren't anymore. The maintenance rule keeps the file current on every change, but
  nothing re-checks the lines a change didn't touch, so an explicit "verify every
  claim" once in a while is part of owning the file.
- **Read the summary.** Prompt 9.2 asks for two things that pull against each other,
  a prompt that reloads and a database connection that doesn't. Expect the agent to
  explain in its summary how it split the two, and read that explanation out.
- **Two sentences of intent are enough.** Prompt 9.3 describes a symptom and a
  constraint. Expect the agent to find the real cause in the stylesheets and to test
  the result with Playwright in a dark color scheme before it commits, all from the
  shortest prompt of the day.

**Verify:** `npm test`, `npm run test:e2e`, and `npm run build` are green after each
prompt. Change the instructions in `lib/tutor.ts` and the next reply reflects it
without a restart. The page is light. Three commits. Then push them:

```bash
git push
```

Skipping `git push` here gets expensive. The pull request in step 11 is diffed
against the `main` on GitHub, so unpushed commits on your local `main` show up in the
pull request as if they were part of the feature, and after the squash merge your local
`main` and the remote one have diverged and `git pull` refuses to move.

## Step 10: context hygiene

**Goal:** no code. A talk about the context window, the resource that decides both
quality and cost.

Run `/context` in the session that just did step 9. The bar is well filled: three
prompts, three diff reviews, the test output of six suite runs, and every file the
agent read along the way.

**Teaching points**

- **Everything the agent reads stays in the window.** A file read costs its size in
  tokens, a test run costs its output, and all of it rides along in every subsequent
  request. Quality degrades as the window fills, because your instructions from an hour
  ago compete with 200 KB of Vitest output. Every rule below is a way to keep that from
  happening.
- **`/compact` with instructions.** `/compact focus on the dependency changes and the
  open AGENTS.md items` replaces the history with a summary that keeps what you named.
  Auto-compaction does the same near the limit, without your steering. `Esc Esc` or
  `/rewind` offers "summarize from here" and "summarize up to here", which compact one
  stretch of the conversation and leave the rest intact.
- **`/clear` between unrelated tasks.** Step 11 has nothing to do with step 9. Starting
  it in a fresh session costs nothing, because AGENTS.md and the skills come back
  automatically, and it removes an hour of irrelevant history from every request. The
  two-corrections rule: if you have corrected the agent twice on the same point, the
  context is full of failed attempts, so `/clear` and write a better first prompt.
- **`/btw` for side questions.** An answer to "what does `--turbopack` do again" doesn't
  need to live in the history for the rest of the day.
- **Subagents are a context firewall.** In step 12 the coordinator asks three workers
  to do work that reads a lot of files. Only their summaries come back into the main
  window. Same idea for research: "use a subagent to find out how CopilotKit persists
  threads" keeps the file reads out of your context.
- **Cost follows context.** The per-request price is the whole window, so a fat
  session costs more on every turn, not once. Compacting or clearing cuts that bill on
  every remaining request of the day.

End the step with `/clear`. Step 11 starts clean.

## Step 11: tool calling, the agent manages your todos

**Goal:** the model acts instead of only answering. Through typed tools it reads and
writes the `todos` table, and the UI shows the result right away. This step also
introduces the branch-and-pull-request rhythm for the rest of the day.

```bash
git switch -c todo-tools
```

> **Prompt 11.1**
>
> Give the tutor tools to manage the signed-in student's todo list, backed by our todos
> table: listTodos, addTodo, setTodoDone. The user id comes from the server-side
> session through the agent's runtime context, never from the model or the client.
> Extend the system prompt so the tutor offers to capture action items and mark them
> done. Add a slim todos sidebar next to the chat (read-only, the agent is the write
> path) that refreshes when the agent changes something. Tests: Vitest for the tool
> executors on a temporary database (especially per-user isolation), plus one
> Playwright e2e that is NOT part of the default suite (`npm run test:e2e:llm`, it
> costs LLM calls): sign up, ask the agent to add "buy milk", assert it appears in the
> sidebar. Use the mastra skill for the current tools API. Update AGENTS.md per its
> rule.

When the suite is green and the live demo works:

> **Prompt 11.2**
>
> Commit this on the current branch and open a pull request against main with a
> description a reviewer can actually use: what changed, how the user id reaches the
> tools, how to test it.

Open the pull request in the browser, read the description, skim the diff, and merge:

```bash
gh pr merge --squash --delete-branch
git switch main && git pull
```

### Traffic on the wire

The Inspector shows what CopilotKit sends to the browser. The other half of the
picture is what Mastra sends to OpenRouter, and a reverse proxy shows it without a
certificate on your machine. mitmproxy in reverse mode takes plain HTTP from the app
and speaks HTTPS to OpenRouter:

```bash
docker run --rm -d -t --name mitm -p 8090:8090 -p 8091:8091 mitmproxy/mitmproxy \
  mitmweb --web-host 0.0.0.0 --web-port 8091 --listen-port 8090 \
  --mode reverse:https://openrouter.ai --no-web-open-browser
docker logs mitm     # prints the web UI URL with its token
```

The `-t` matters. Without it the log stays empty and you never see the token.

Then point Mastra at the proxy. `lib/tutor.ts` already reads `OPENROUTER_BASE_URL` and
passes it to the model router as the base URL, so uncomment the line in `.env`:

```bash
OPENROUTER_BASE_URL=http://localhost:8090/api/v1
```

Since prompt 9.2 the agent is rebuilt on the next request in development, so no restart
is needed. Say "I need to read chapter 3 and do exercise 5 for tomorrow" and open the
mitmweb URL from the log. One chat turn is two requests to OpenRouter:

- **The first request** carries the system prompt, the student's sentence, and
  `tools`, which is your three Zod schemas rendered as JSON Schema, `.describe()` texts
  included. Read `addTodo`'s description there. That text, and nothing else, is what
  the model knows about the tool. The response is a tool call with its arguments, and
  two todos in one sentence means two calls in one response.
- **The second request** carries those calls and one `role: "tool"` message per call
  with your executor's return value, verbatim. The response is plain text, the sentence
  Bartholomew says to the student. `tools` rides along on this request too, because
  the model may decide it needs another call.

Afterward, comment the line out again and stop the proxy with `docker rm -f mitm`. With
`OPENROUTER_BASE_URL` unset, the app talks to OpenRouter directly.

**Teaching points**

- **Tools are the contract between the model and your system.** The Zod schema plus
  the description is the API documentation the model reads, so writing them well *is*
  prompt engineering. Open one of the tool definitions and read the description aloud.
- **Identity injection.** The user id travels from the session into Mastra's request
  context and on into the tool executor. The model never sees it and never chooses it.
  Same rule as in steps 6 and 7: the model is untrusted input, and authorization lives
  in your code. Expect the executor to throw when the id is missing instead of falling
  back to a default, and expect `setTodoDone` to scope its query to the user, so a
  guessed todo id of another student matches nothing. Ask the agent how it made sure
  the browser can't smuggle in a different id. It has read the bundle and can tell you.
- **Watch the inspector during the live demo.** Say "I need to read chapter 3 and do
  exercise 5 for tomorrow" and the tutor offers to capture the todos. In the inspector,
  `TOOL_CALL_START`, `TOOL_CALL_ARGS`, and `TOOL_CALL_RESULT` events appear for each
  call, and the tool-call counter on the agent page finally moves. Say "finished the
  reading" and the checkmark in the sidebar flips.
- **LLM tests are quarantined.** They're non-deterministic and slow, and they cost real
  money on every run, so they get their own npm script and stay out of the default
  suite. How the agent draws the line varies, and any line that keeps the default suite
  free of LLM calls is fine. If the LLM e2e fails on its first run, look at the spec
  before blaming the model. The usual cause is a timing problem in how the test drives
  the chat, and a good agent fixes the spec, says so, and writes the lesson into
  AGENTS.md.
- **The pull request is the review unit.** The agent writes the description, because
  it knows what it changed, and you read it as the reviewer. `gh pr create` from the
  agent works because `gh` is authenticated on your machine, and Claude Code links the
  session to the pull request so `claude --from-pr <number>` finds it again later.
- **Same wire, two protocols.** The `tool_calls` delta in the OpenRouter stream and the
  `TOOL_CALL_ARGS` event in the Inspector are the same tool call, once in the OpenAI
  chat completions format and once in AG-UI. Mastra translates between them, and
  Claude Code's own traffic to Anthropic has the same shape with `tool_use` blocks.

**Verify:** the live demo works, the unit tests prove per-user isolation, the default
e2e suite stays free of LLM calls, and `main` carries the squashed merge.

## Step 12: quality pass by delegation

**Goal:** leave the repo the way every session should end, with a README that matches
it and demo data for a fresh clone, and get all of it done by cheaper models under one
prompt. The coordinator you're typing at picks the tier for each job, and one of the
workers isn't Claude at all.

```bash
git switch -c quality-pass
```

> **Prompt 12.1**
>
> Quality pass. Delegate in parallel, each job to the cheapest model that can do it, and
> tell me afterward which model did what and why. A Sonnet agent writes a concise README
> (what the app is, stack, setup incl. env vars, scripts, short architecture overview,
> current state only). The pi coding agent, run non-interactively in this repo with
> openrouter/z-ai/glm-5.3-flash and thinking low, writes scripts/seed.ts: a demo student
> with a dozen realistic todos, so a fresh clone has something to show; pi touches
> nothing but that file, you wire the npm script. pi hangs when its stdin stays open, so
> start it with stdin closed (< /dev/null). A Haiku agent checks that every command and
> file path mentioned in AGENTS.md and the new README exists and runs. Then
> review what came back as if a junior had written it, fix what needs fixing, full suite
> green, AGENTS.md current. Wait for every worker to finish before you report.

Then prompt 11.2 again, word for word, and merge the pull request the same way. Run
`npm run db:seed`, sign in as the demo student, and the list is full.

**Teaching points**

- **Three tiers under one prompt.** The session you type into runs on the strongest
  model, holds the whole history, and makes the judgment calls, which makes it the
  expensive part. Each subagent starts with a fresh context and its own model, so the
  coordinator matches the tier to the job: Sonnet for a README that needs reading and
  judgment, Haiku for a checklist that needs neither, and a flash model for a
  self-contained script. Ask the coordinator to justify its choices at the end, and the
  prompt does, because it asked for the reasoning.
- **A harness is just another worker.** The pi run is the step 8 demo doing real work.
  Claude Code writes pi a task, runs `pi -p` in the repo, and reads the file that comes
  back, the same way it reads a subagent's summary. Nothing in the coordinator's loop
  cares that the worker is a different program talking to a different vendor.
- **The brief is the work.** Open the Bash call that starts pi and read the prompt Claude
  wrote for it. Expect a page: which files to read first, the quirks of this repo that
  a standalone script has to respect, how to create the demo user through the auth
  library instead of writing the table by hand, the house style, and a list of things
  pi must not touch. A flash model with
  that brief writes a seed script that runs on the first try. The same model with the
  one-line task from prompt 12.1 wouldn't. The strong model's contribution is the
  brief, and that is what you pay it for.
- **Cheap output is input.** The coordinator reviews the seed script the way it would
  review a junior's pull request and runs it against a copy of the database. Expect
  findings of the kind a junior produces, a language feature the build setup doesn't
  allow or a formatting slip. Expect one finding about the workflow
  itself, too. pi may rewrite its file after the coordinator has already patched it,
  because the coordinator started reviewing when the file appeared instead of when the
  process exited. A worker is done when its process is done. And expect the Haiku audit
  to return a finding the coordinator rejects as over-literal, which is the right call
  and worth pointing at: the cheap model reports, the expensive one decides.
- **A worker that never answers.** Prompt 12.1 tells the coordinator to close pi's
  stdin. Without that sentence, pi started from a background shell waits on the open
  stdin forever, the coordinator waits on pi, and the room waits on both. Every harness
  has a detail like this, and a coordinator that can't see the worker's output can't
  diagnose it. Leave the sentence out if you want to show the hang, and have
  `pkill -f "pi -p"` ready.
- **Subagents are a context firewall too.** The Haiku agent reads every file that
  AGENTS.md and the README point at. None of that lands in your window, only its list
  of findings does. Same idea as `/clear` in step 10, applied sideways.
- **Disjoint write areas.** Sonnet writes the README, pi writes `scripts/seed.ts`,
  Haiku writes nothing. Parallel workers that share a file produce the same conflicts as
  parallel people, so the prompt hands each one its own.
- The README is for humans arriving at the repo, and AGENTS.md is operating
  instructions for agents. Both hold current state only.

**Verify:** the coordinator's summary names a model per job with a reason, the seed
script runs on a fresh database, the README reads well, the full suite is green, and
`main` carries the merge.

## Step 13: a design skill, built and applied in two worktrees

**Goal:** two things at once. The skill kinds from session 1 combine into a skill of our
own, and two agents restyle the same app in parallel without touching each other's
files. Then git shows what parallel work costs.

### Prepare the worktrees

A worktree is a second checkout of the same repository in its own directory, on its
own branch. Claude Code creates them under `.claude/worktrees/<name>/`, which the
starter git-ignores. Git-ignored files don't come along into a fresh checkout, so the
starter's `.worktreeinclude` names the one that has to: `.env`. Claude Code copies
whatever that file lists into every new worktree.

Open two terminals in the repo root.

### Terminal one, the heise skill

```bash
claude --worktree heise
```

> **Prompt 13.1**
>
> This is a fresh worktree, so run npm install and npm run db:migrate first. Then study
> heise.de: colors, typography, the overall design language. Use the skill-creator and
> frontend-design skills to distill a project-specific design skill for this app, named
> ai-tutor-design. One thing the skill must make clear: unlike heise.de, this app is not
> a news page but a chat bot with data-heavy pages, and the design has to reflect that.
> Say what carries over from the brand and what doesn't. Just create the skill, don't
> restyle anything yet.

> **Prompt 13.2**
>
> Apply the ai-tutor-design skill to the existing UI. Make the full suite green
> afterwards and keep AGENTS.md current.

### Terminal two, the comic style

```bash
claude --worktree comic
```

> **Prompt 13.3**
>
> This is a fresh worktree, so run npm install and npm run db:migrate first. Then use
> the frontend-design skill to give the app a colorful 1980s comic-book look, limited to
> the color palette, the fonts, and the buttons: loud primary colors, dramatic display
> type, bold outlines. Nothing else changes. Every feature keeps working, the full suite
> stays green, AGENTS.md stays current. Another agent is running the e2e suite in a
> sibling worktree on port 3100, so run yours with E2E_PORT=3101.

While both agents work, talk through the worktree mechanics below. When they finish,
run each app on its own port and put them side by side:

```bash
(cd .claude/worktrees/heise && PORT=3001 npm run dev)
(cd .claude/worktrees/comic && PORT=3002 npm run dev)
```

Each worktree has its own `data/app.db`, so sign up again in each.

### Merge one, rebase the other

The heise version is the one we keep, because the skill is reusable and the comic
palette is a one-off. In terminal one:

> **Prompt 13.4**
>
> Commit and open a pull request against main. Describe the skill, what it decided
> about the brand, and how to verify the restyle.

Merge it the usual way. Then, in terminal two, the comic branch is behind `main` and
touches the same files, `app/globals.css`, `components/ui/button.tsx`, and AGENTS.md
among them:

> **Prompt 13.5**
>
> Commit the restyle on this branch, then rebase it onto main and resolve the
> conflicts. Where the two styles collide, the comic style wins in this branch. Suite
> green afterwards.

Watch the agent read both sides of each conflict. Then decide as a team whether the
result is worth keeping. It usually isn't, and that's fine:

```bash
# from the repo root, after exiting both worktree sessions
git worktree remove --force .claude/worktrees/comic
git worktree remove --force .claude/worktrees/heise
git branch -D worktree-comic
git worktree list
git branch
```

Claude Code locks a worktree while a session runs in it. If git refuses with "cannot
remove a locked working tree", the session is still open or didn't exit cleanly, and
`git worktree unlock <path>` before the remove clears it.

The agent may have committed on a branch of its own naming rather than on
`worktree-<name>`, so read the output of `git branch` and delete what's left over,
except `main`.

### If time permits: fold the skill's bugs back

Applying the ai-tutor-design skill is the first real test of it. If the restyle agent
worked around something the skill got wrong, and it says so in its summary or in
AGENTS.md, fold the fix back. This part is optional; the lesson is the same without the
run, and the prompt is here for a day with room for it:

> **Prompt 13.6**
>
> The restyle uncovered problems in the recipe the ai-tutor-design skill ships. AGENTS.md
> records them, but the skill still gets them wrong. Fold the fixes back into the skill.
> Don't change the app. Commit on main.

**Teaching points**

- **Skills compose.** `skill-creator` supplies the form and `frontend-design` supplies
  the taste. What is true for this project comes from the agent's own research on
  heise.de. The output is a new skill in `.claude/skills/ai-tutor-design/` that came
  from no registry. It's your own design system in a directory, and every future "add a
  settings page" picks it up, because the skill's `description` tells the agent when to
  fire.
- **The agent measures instead of guessing.** Expect it to pull heise.de's actual
  stylesheets and write down what it found in a `references/` file inside the skill:
  the brand blue, the page gray, the one font family, how corners and shadows are
  handled. Anyone can check a claim in the skill against that file. Same discipline as
  llms.txt, pointed at a brand instead of an API.
- **Translation, not copy.** The constraint in prompt 13.1 does real work. A news site
  and a chat app share a palette and a typographic voice, and nothing else. The skill
  has to say which is which, or the restyle produces a teaser grid with a chat box in
  it.
- **Tests don't see CSS.** Expect the heise restyle to hit a wall: the chat widget
  ships its own stylesheet, a plain override loses on load order, and the chat stays
  default white on top of the new page. The unit tests, the e2e suite, and the build
  all stay green while that happens. Expect the agent to catch it from a screenshot of
  the running app, to fix it, and to write the rule into AGENTS.md. Ask it how it
  noticed. The answer, a browser and a pixel check, is the verification step the suite
  can't supply.
- **Worktrees share the network.** Ports are per machine, and the Playwright config
  starts its dev server on port 3100 with `reuseExistingServer` on. Two worktrees
  running e2e at the same time means the second agent adopts the first agent's server
  and tests the other worktree's code, and the failure looks like a styling regression
  that isn't there. That's why prompt 13.3 names a port. Leave that sentence out if you
  want the room to watch the collision happen. The agent does work out that the server
  isn't its own, and it writes the rule into AGENTS.md, but it spends a while chasing a
  regression that doesn't exist first.
- **Worktrees isolate files, and only files.** Both agents share the repository
  history and the remote, and each one gets its own directory, its own branch named
  `worktree-<name>`, its own `node_modules`, and its own database. That is why both
  prompts start with `npm install`. While a session runs in a worktree, Claude Code
  refuses edits and git commands that would reach the main checkout, and it tells the
  agent how to rewrite a refused command. When you exit the session, Claude Code asks
  whether to keep or remove a worktree that still holds work, and `git worktree list`
  shows what's left.
- **The conflict was predictable.** Two branches that both change the palette and the
  buttons both edit `globals.css` and `components/ui/button.tsx`, and both edit
  AGENTS.md because the maintenance rule says so. Parallel work is cheap while it runs and
  expensive when it lands. The agent resolves conflicts the way it does everything
  else, by reading both sides and choosing, and its choice in prompt 13.5 is only as
  good as the rule you gave it, "the comic style wins". Without that rule you get a
  blend nobody asked for.
- **A skill is code, so its first application is its first test.** Prompt 13.6 folds
  what the restyle uncovered back into `.claude/skills/ai-tutor-design/`, where the next
  agent picks it up instead of rediscovering the workaround.

**Verify:** the skill exists with its `references/` directory, `main` is restyled and
visibly not default Tailwind, the comic worktree is gone, `git worktree list` shows
only the main checkout, and the full suite is green.

## Wrap-up

Close the day with `git log --oneline` on `main`. Since the starter: three fixes, the
tools with their pull request, the quality pass with its README and seed script, the
design skill. Every one of them reviewed and tested. Open AGENTS.md once more and check it
against its own rule; it grew today, and everything in it should still be a pointer or
a one-sentence gotcha.

Session 3 opens with something nobody looked at today. The chat route checks for a
session and hands everything else to CopilotKit, and CopilotKit serves more endpoints
than the browser calls. From there: what an agent may reach, how MCP servers plug into
both Claude Code and our tutor, and how to keep untrusted input from steering either
one.

---

## Appendix A: running this storybook headless

To rehearse the day without the terminal UI, run every prompt non-interactively against
a fresh fork of the starter, one step per invocation, with a fresh context each time:

```bash
gh repo fork rstropek/2026-claude-classroom-2-starter --clone
cd 2026-claude-classroom-2-starter && npm install && cp .env.example .env
claude --model claude-opus-5 --dangerously-skip-permissions -p "<prompt>"
```

Add `--worktree heise` and `--worktree comic` for the two worktree prompts of step 13.
Non-interactive runs skip the exit prompt, so those worktrees stay on disk until you
remove them.

In the live session, use the interactive TUI instead. Tool calls, doc fetches, diffs,
and test runs scrolling past are what the audience learns from, far more than the
finished diff.

## Appendix B: live-demo insurance

- **Pre-create the worktrees the evening before.** `claude --worktree heise` with a
  name that already exists reopens the existing worktree, so run `npm install` in both
  worktrees ahead of time and step 13 skips both installs.
- **Keep result branches at hand.** One branch per step from your own dry run lets you
  show what the step produces when a live run falls short. Show the shortfall first, and
  explain it, because that is the lesson. The result branch is for moving on afterward,
  since every later step builds on the one before.
- **Prompt 9.1 depends on whatever shipped this week.** Latest versions change weekly.
  If a fresh major lands the night before, pin it in the prompt to the version that
  worked for you. Versions that worked: TypeScript 7.0.2, Vitest 5.0.0, Better Auth
  1.7.3, Biome 2.5.12, `@types/node` 26, `@libsql/client` 0.18.0.
- **If the LLM e2e flakes live, say so and move on.** That flakiness is exactly why step
  11 keeps it out of the default suite.
