> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Agents

> An agent is a reusable configuration that defines what an AI agent can do.

export const CatalogGallery = ({items: itemsProp = null, kind = "agent", baseUrl = "https://agp.eu.hcompany.ai"}) => {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState({});
  const [expanded, setExpanded] = useState({});
  const [fetched, setFetched] = useState(null);
  const [status, setStatus] = useState(itemsProp ? "ready" : "loading");
  const idOf = it => it.name || it.id || "";
  useEffect(() => {
    if (itemsProp) return;
    const resource = ({
      agent: "agents",
      skill: "skills",
      environment: "environments"
    })[kind] || "agents";
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const all = [];
        for (let page = 1; ; page += 1) {
          const resp = await fetch(`${baseUrl}/api/v2/${resource}?name=h/&size=100&page=${page}`, {
            headers: {
              Accept: "application/json"
            }
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const payload = await resp.json();
          const batch = payload.items || [];
          all.push(...batch);
          const total = payload.total ?? all.length;
          if (!batch.length || all.length >= total) break;
        }
        all.sort((a, b) => (a.name || a.id || "").localeCompare(b.name || b.id || ""));
        if (!cancelled) {
          setFetched(all);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemsProp, kind, baseUrl]);
  const items = itemsProp || fetched || [];
  const slug = s => String(s).replace(/[^\w.-]+/g, "-");
  const crc32 = bytes => {
    let c = ~0;
    for (let i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (let j = 0; j < 8; j++) c = c >>> 1 ^ 0xedb88320 & -(c & 1);
    }
    return ~c >>> 0;
  };
  const downloadSkill = it => {
    const enc = new TextEncoder();
    const safe = slug(idOf(it) || "skill");
    const fm = ["---", `name: ${JSON.stringify(idOf(it))}`];
    if (it.description) fm.push(`description: ${JSON.stringify(it.description)}`);
    if (it.source) fm.push(`source: ${JSON.stringify(it.source)}`);
    if (it.url_pattern) fm.push(`url_pattern: ${JSON.stringify(it.url_pattern)}`);
    fm.push("---", "", it.body || "", "");
    const data = enc.encode(fm.join("\n"));
    const name = enc.encode(`${safe}/SKILL.md`);
    const crc = crc32(data);
    const u16 = n => new Uint8Array([n & 255, n >>> 8 & 255]);
    const u32 = n => new Uint8Array([n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24 & 255]);
    const local = [u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data];
    const localSize = local.reduce((s, c) => s + c.length, 0);
    const central = [u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0), name];
    const centralSize = central.reduce((s, c) => s + c.length, 0);
    const eocd = [u32(0x06054b50), u16(0), u16(0), u16(1), u16(1), u32(centralSize), u32(localSize), u16(0)];
    const parts = [...local, ...central, ...eocd];
    const out = new Uint8Array(parts.reduce((s, c) => s + c.length, 0));
    let off = 0;
    for (const c of parts) {
      out.set(c, off);
      off += c.length;
    }
    const url = URL.createObjectURL(new Blob([out], {
      type: "application/zip"
    }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = (key, text) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {}
    setCopied(s => ({
      ...s,
      [key]: true
    }));
    setTimeout(() => setCopied(s => ({
      ...s,
      [key]: false
    })), 1500);
  };
  const copyIcon = on => on ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg> : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>;
  const CopyChip = ({k, text, label, className = ""}) => <button type="button" onClick={() => copy(k, text)} aria-label={label} title={label} className={`shrink-0 rounded-md p-1.5 transition ${copied[k] ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"} ${className}`}>
      {copyIcon(copied[k])}
    </button>;
  const ExpandChip = ({k}) => <button type="button" onClick={() => setExpanded(s => ({
    ...s,
    [k]: !s[k]
  }))} aria-label={expanded[k] ? "Hide body" : "Show body"} title={expanded[k] ? "Hide body" : "Show body"} className="shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
      <svg className={`h-4 w-4 transition-transform ${expanded[k] ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>;
  const DownloadChip = ({it}) => <button type="button" onClick={() => downloadSkill(it)} aria-label="Download SKILL.md" title="Download SKILL.md" className="shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="M7 12l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>;
  const glyphs = {
    environment: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M3 9h18" />
        <path d="M7 6.5h.01M10 6.5h.01" />
      </svg>
  };
  const envKindGlyphs = {
    web: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z" />
      </svg>,
    desktop: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>,
    code: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M7.5 9l3 3-3 3" />
        <path d="M13 15h4" />
      </svg>,
    mcp: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v6" />
        <path d="M15 2v6" />
        <path d="M6 8h12v2.5a6 6 0 0 1-12 0z" />
        <path d="M12 16.5V22" />
      </svg>,
    memory: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
  };
  const ClampedText = ({text, lines = 5}) => {
    const ref = useRef(null);
    const [open, setOpen] = useState(false);
    const [overflows, setOverflows] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (el) setOverflows(el.scrollHeight - el.clientHeight > 1);
    }, [text]);
    return <div className="min-w-0">
        <div ref={ref} className="whitespace-pre-wrap break-words" style={open ? undefined : {
      display: "-webkit-box",
      WebkitLineClamp: lines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }}>
          {text}
        </div>
        {overflows || open ? <button type="button" onClick={() => setOpen(o => !o)} className="mt-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            {open ? "Show less" : "Show more"}
          </button> : null}
      </div>;
  };
  const KINDS = {
    agent: {
      noun: "agents",
      rows: it => {
        const out = [["model", it.model || "default"]];
        if (Array.isArray(it.environments) && it.environments.length) out.push(["environment", it.environments.join(", ")]);
        if (it.instructions) out.push(["instructions", <ClampedText text={it.instructions} />]);
        if (Array.isArray(it.subagents) && it.subagents.length) out.push(["subagents", it.subagents.map(s => typeof s === "string" ? s : s.name || "").join(", ")]);
        if (Array.isArray(it.skills) && it.skills.length) out.push(["skills", <div className="flex flex-wrap gap-1.5">
              {it.skills.map(s => <a key={s} href={`/computer-use-agents/skills/overview#${slug(s)}`} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 no-underline transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                  {s}
                </a>)}
            </div>]);
        return out;
      }
    },
    environment: {
      noun: "environments",
      rows: it => {
        const out = [["kind", it.kind || "?"]];
        const mode = it.mode;
        if (mode && typeof mode === "object") {
          out.push(["mode", mode.type || "?"]);
          if (mode.type === "visual") {
            if (mode.width && mode.height) out.push(["viewport", `${mode.width} x ${mode.height}`]);
            if (mode.markdown) out.push(["markdown", "on"]);
          } else if (mode.type === "text" && mode.chunk_size) {
            out.push(["chunk size", `${mode.chunk_size} chars`]);
          }
        } else if (typeof mode === "string") {
          out.push(["mode", mode]);
          if (it.width && it.height) out.push(["viewport", `${it.width} x ${it.height}`]);
        }
        if (it.start_url) out.push(["start url", it.start_url.replace(/^https?:\/\//, "")]);
        if (it.network && it.network.proxy_url) out.push(["proxy", "configured"]);
        if (it.instructions) out.push(["instructions", <ClampedText text={it.instructions} />]);
        return out;
      }
    },
    skill: {
      noun: "skills",
      rows: it => {
        const out = [];
        if (it.source) out.push(["source", it.source]);
        if (it.url_pattern) out.push(["url pattern", it.url_pattern]);
        return out;
      },
      headerAction: it => <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          <DownloadChip it={it} />
          {it.body ? <ExpandChip k={`${idOf(it)}:body`} /> : null}
        </div>,
      extra: it => it.body && expanded[`${idOf(it)}:body`] ? <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/70">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
{it.body}
            </div>
          </div> : null
    }
  };
  const cfg = KINDS[kind] || KINDS.agent;
  const q = query.trim().toLowerCase();
  const matches = items.filter(it => !q ? true : [idOf(it), it.description, it.model, it.kind, it.start_url].filter(Boolean).join(" ").toLowerCase().includes(q));
  return <div className="not-prose">
      <div className="relative mb-6">
        <svg className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${matches.length} ${matches.length === 1 ? cfg.noun.replace(/s$/, "") : cfg.noun}`} className="w-full border-0 border-b border-zinc-200 bg-transparent py-2 pl-7 pr-3 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-900 focus:outline-none focus:ring-0 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-100" />
      </div>

      {status === "loading" ? <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">Loading {cfg.noun}.</div> : status === "error" ? <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Could not load {cfg.noun} right now. Please try again later.
        </div> : matches.length === 0 ? <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          {items.length === 0 ? `No built-in ${cfg.noun} are published yet. This list updates automatically as they ship.` : `No ${cfg.noun} match "${query}".`}
        </div> : <div className="space-y-3">
          {matches.map(it => {
    const id = idOf(it);
    const list = cfg.rows(it);
    const icon = kind === "environment" ? envKindGlyphs[it.kind] || glyphs.environment : glyphs[kind];
    return <div key={id} id={slug(id)} className="min-w-0 scroll-mt-24 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {icon ? <span className="shrink-0 text-zinc-900 dark:text-zinc-100">{icon}</span> : null}
                    <button type="button" onClick={() => copy(`${id}:name`, id)} title="Copy name" className="group flex min-w-0 items-center gap-1.5 text-left">
                      <span className="min-w-0 break-words font-mono text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{id}</span>
                      <span className={`shrink-0 transition ${copied[`${id}:name`] ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-300 opacity-0 group-hover:opacity-100 dark:text-zinc-600"}`}>
                        {copyIcon(copied[`${id}:name`])}
                      </span>
                    </button>
                  </div>
                  {cfg.headerAction ? cfg.headerAction(it) : <CopyChip k={id} text={JSON.stringify(it, null, 2)} label="Copy JSON" className="-mr-1" />}
                </div>

                {it.description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{it.description}</p> : null}

                {list.length ? <dl className="mt-5 space-y-2">
                    {list.map(([k, v]) => <div key={k} className="flex gap-4 text-sm">
                        <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{k}</dt>
                        <dd className={`min-w-0 break-words text-zinc-700 dark:text-zinc-300 ${k === "instructions" || typeof v !== "string" ? "" : "font-mono"}`}>{v}</dd>
                      </div>)}
                  </dl> : null}

                {cfg.extra ? cfg.extra(it) : null}
              </div>;
  })}
        </div>}
    </div>;
};

An `agent` holds the configuration a run needs: the environment it acts in, the model that drives it, and optional skills and instructions. Start with a [pre-built agent](#pre-built-agents) from H, or create your own.

Names are scoped to your organization: the agents, skills, and environments you create are visible only within it. H's pre-built agents and environments live under the reserved `h/` namespace (for example `h/web-surfer-flash` and `h/browser`); they are available to every organization and read-only, so modifying one returns `403`. Agents you create have no prefix.

## Configure an agent

| Field           | Required    | Description                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | Yes         | Identifies the agent in your catalog and is the value you pass as `agent` when creating a session.                                                                                                                                                                                                                                          |
| `environments`  | Conditional | The surfaces it acts on, like a [browser](/computer-use-agents/browser/configuration). Required unless the agent is a pure [manager](/computer-use-agents/multi-agent) that only delegates to `subagents`.                                                                                                                                  |
| `description`   | Yes         | A one-line summary of what the agent does. Also used for delegation: a parent agent reads it to decide whether to hand off a task.                                                                                                                                                                                                          |
| `model`         | No          | The Holo model that runs the agent. Defaults to `holo3-122b-a10b`; pass any Holo model id from the [Models API](/models), for example `holo3-1-35b-a3b` for the faster Holo3.1.                                                                                                                                                             |
| `instructions`  | No          | Appended to the system prompt to steer behavior.                                                                                                                                                                                                                                                                                            |
| `skills`        | No          | Reusable [instruction fragments](/computer-use-agents/skills/overview) the agent loads on demand.                                                                                                                                                                                                                                           |
| `tools`         | No          | Extra tools the agent can call from your own code. See [Custom tools](/computer-use-agents/custom-tools).                                                                                                                                                                                                                                   |
| `subagents`     | No          | Specialist agents this one can delegate to. Each runs as its own child session, in parallel, and returns a single answer the manager folds into its own. See [Multi-agent](/computer-use-agents/multi-agent).                                                                                                                               |
| `answer_format` | No          | A [JSON Schema](https://json-schema.org/) the final answer must conform to. When set, the agent returns [structured output](/computer-use-agents/structured-output) matching the schema instead of free-form text. Leave it unset for free-form text; override it per run with session [`overrides`](/computer-use-agents/sessions/create). |

Each `environments`, `skills`, or `subagents` entry is either a string catalog id or an inline object. A reference keeps the definition central and reusable; an inline object is handy for one-offs. For exact field constraints, see [Create an agent](/computer-use-agents/agents/create).

## Create your own

Create an agent once, then reference it by `name` in every session:

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "web-price-finder",
      "description": "Finds and reports prices for products, flights, or services on the public web.",
      "instructions": "When the user asks for a price, return a single concise line with the amount, currency, and key context (vendor or airline, date, link). Prefer the cheapest matching option. If the price is not visible without login or payment, say so explicitly rather than guessing.",
      "model": "holo3-122b-a10b",
      "environments": [
        {
          "id": "price-browser",
          "kind": "web",
          "mode": {"type": "visual", "width": 1280, "height": 800},
          "start_url": "https://www.google.com/travel/flights"
        }
      ],
      "skills": ["extract-data"]
    }'
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  client.agents.create_agent(
      name="web-price-finder",
      description="Finds and reports prices for products, flights, or services on the public web.",
      instructions=(
          "When the user asks for a price, return a single concise line with the amount, "
          "currency, and key context (vendor or airline, date, link). Prefer the cheapest "
          "matching option. If the price is not visible without login or payment, say so "
          "explicitly rather than guessing."
      ),
      model="holo3-122b-a10b",
      environments=[
          {
              "id": "price-browser",
              "kind": "web",
              "mode": {"type": "visual", "width": 1280, "height": 800},
              "start_url": "https://www.google.com/travel/flights",
          }
      ],
      skills=["extract-data"],
  )
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  await client.agents.createAgent({
    name: "web-price-finder",
    description: "Finds and reports prices for products, flights, or services on the public web.",
    instructions:
      "When the user asks for a price, return a single concise line with the amount, " +
      "currency, and key context (vendor or airline, date, link). Prefer the cheapest " +
      "matching option. If the price is not visible without login or payment, say so " +
      "explicitly rather than guessing.",
    model: "holo3-122b-a10b",
    environments: [
      {
        id: "price-browser",
        kind: "web",
        mode: { type: "visual", width: 1280, height: 800 },
        startUrl: "https://www.google.com/travel/flights",
      },
    ],
    skills: ["extract-data"],
  });
  ```
</CodeGroup>

## Pre-built agents

H maintains a catalog of configured agents under the `h/` namespace. You can run them as-is, with no setup.

Catalog agents that delegate to subagents (such as `h/deep-search-pro`) build on [Multi-agent](/computer-use-agents/multi-agent).

<CatalogGallery kind="agent" />

List them anytime with [`GET /api/v2/agents`](/computer-use-agents/agents/list):

<CodeGroup>
  ```bash cURL theme={null}
  curl "https://agp.eu.hcompany.ai/api/v2/agents" \
    -H "Authorization: Bearer $HAI_API_KEY"
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  agents = client.agents.list_agents()
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const agents = await client.agents.listAgents();
  ```
</CodeGroup>

Reference one by name when you create a [session](/computer-use-agents/sessions/overview), and the platform supplies its full configuration:

<CodeGroup>
  ```bash CLI theme={null}
  hai run "Top 3 stories on Hacker News right now?" \
    --agent h/web-surfer-flash
  ```

  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [{"type": "user_message", "message": "Top 3 stories on Hacker News right now?"}]
    }'
  ```

  ```python Python theme={null}
  client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages=[{"type": "user_message", "message": "Top 3 stories on Hacker News right now?"}],
  )
  ```

  ```typescript TypeScript theme={null}
  await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      messages: [{ type: "user_message", message: "Top 3 stories on Hacker News right now?" }],
    },
  });
  ```
</CodeGroup>

## Endpoints

| Method   | Path                    | Description                                               |
| -------- | ----------------------- | --------------------------------------------------------- |
| `POST`   | `/api/v2/agents`        | [Create an agent](/computer-use-agents/agents/create)     |
| `GET`    | `/api/v2/agents`        | [List agents](/computer-use-agents/agents/list)           |
| `GET`    | `/api/v2/agents/{name}` | [Retrieve an agent](/computer-use-agents/agents/retrieve) |
| `PUT`    | `/api/v2/agents/{name}` | [Update an agent](/computer-use-agents/agents/update)     |
| `PATCH`  | `/api/v2/agents/{name}` | [Patch an agent](/computer-use-agents/agents/patch)       |
| `DELETE` | `/api/v2/agents/{name}` | [Delete an agent](/computer-use-agents/agents/delete)     |

The list is paginated (`page`, `size`) and returns an `items` / `page` / `total` envelope; sort it with `sort=created_at` or `sort=agent_name`, prefixed with `-` for descending.
