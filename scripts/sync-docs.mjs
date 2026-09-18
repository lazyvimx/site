// Тянет документацию из репозитория lazyvimx и раскладывает по страницам
// сайта. Источник истины — md-файлы там; здесь только адаптация: другие
// имена файлов, ссылки на код уходят на GitHub, языковые подсказки
// выпиливаются — их заменяет переключатель локали.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const github = "https://github.com/lazyvimx/nvim";

// Локальная рабочая копия удобнее для разработки; в CI её нет — клонируем.
function findSource() {
	const local = process.env.LAZYVIMX_DIR || resolve(root, "../nvim");

	if (existsSync(join(local, "docs/EXTRAS.md"))) return local;

	const cache = join(root, ".cache/lazyvimx");
	rmSync(cache, { recursive: true, force: true });
	mkdirSync(dirname(cache), { recursive: true });
	// Актуальные доки живут в develop: main отстаёт до ближайшего релиза.
	execFileSync("git", ["clone", "--depth", "1", "--branch", "develop", `${github}.git`, cache], { stdio: "inherit" });

	return cache;
}

// [источник, страница EN, страница RU]
const pages = [
	["README", "getting-started.md", "ru/getting-started.md"],
	["docs/EXTRAS", "extras.md", "ru/extras.md"],
	["docs/CONFIGURATION", "configuration.md", "ru/configuration.md"],
	["docs/KEYBINDINGS", "keybindings.md", "ru/keybindings.md"],
	["docs/FAQ", "faq.md", "ru/faq.md"],
	["docs/TROUBLESHOOTING", "troubleshooting.md", "ru/troubleshooting.md"],
	["docs/ARCHITECTURE", "architecture.md", "ru/architecture.md"],
	["docs/API", "api.md", "ru/api.md"],
];

// Экстры, у которых записан «до»-вариант гифки. Список повторяет
// docs/demo/tapes-before в lazyvimx — при дозаписи пополнять оба места.
const withBefore = new Set([
	"buf-tab-scope",
	"coding-comments",
	"git-conflicts",
	"motions-better-cursor-move",
	"motions-better-move-between-words",
	"motions-langmapper",
	"motions-sibling-move",
	"motions-sibling-swap",
	"motions-splitting-joining-blocks",
	"ui-better-colorcolumn",
	"ui-better-cursorline",
	"ui-better-diagnostic",
	"ui-better-float",
	"ui-better-insert-mode",
	"ui-better-linenumbers",
	"ui-better-live-rename",
	"ui-better-reference-highlight",
	"ui-better-whitespace",
	"ui-bolder-separators",
	"ui-diff-view",
	"ui-highlighted-ansi-escape",
	"ui-highlighted-colors",
	"ui-peek-preview",
	"ui-scrollbar",
	"ui-simple-mode",
	"ui-symbol-usage",
	"ui-winbar",
]);

const nameMap = {
	EXTRAS: "extras",
	CONFIGURATION: "configuration",
	KEYBINDINGS: "keybindings",
	FAQ: "faq",
	TROUBLESHOOTING: "troubleshooting",
	ARCHITECTURE: "architecture",
	API: "api",
	README: "getting-started",
};

// Размер записи задан в её тейпе; тейпы приезжают вместе с доками.
// Второй набор экстр снят выше — отсюда два разных размера.
function tapeSize(name) {
	const tape = join(src, "docs/demo/tapes", `${name}.tape`);
	if (!existsSync(tape)) return { width: 1200, height: 604 };

	const text = readFileSync(tape, "utf8");
	return {
		width: Number(text.match(/^Set Width (\d+)$/m)?.[1] ?? 1200),
		height: Number(text.match(/^Set Height (\d+)$/m)?.[1] ?? 604),
	};
}

function transform(text) {
	// Блок «Русская версия/English version» — на сайте есть переключатель.
	text = text.replace(/> \[!TIP\]\n> \*\*🇷🇺[^\n]*\n\n/g, "");
	text = text.replace(/> \[!TIP\]\n> \*\*🇬🇧[^\n]*\n\n/g, "");

	// Хвосты вида «([🇬🇧](docs/X.md))» в списках ссылок.
	text = text.replace(/ \(\[🇷🇺\]\([^)]*\)\)/g, "");
	text = text.replace(/ \(\[🇬🇧\]\([^)]*\)\)/g, "");

	// Баннер и бейджи из шапки README дублируют hero лендинга.
	text = text.replace(/^!\[[^\]]*\]\([^)]*banner[^)]*\)\n\n/, "");
	text = text.replace(/<div align="center">[\s\S]*?<\/div>\n\n/, "");

	// Взаимные ссылки доков — на страницы сайта (в своей локали).
	for (const [upper, lower] of Object.entries(nameMap)) {
		for (const prefix of ["docs/", "./", ""]) {
			text = text.replaceAll(`(${prefix}${upper}.ru.md`, `(./${lower}.md`);
			text = text.replaceAll(`(${prefix}${upper}.md`, `(./${lower}.md`);
		}
	}
	text = text.replaceAll("(../README.ru.md", "(./getting-started.md");
	text = text.replaceAll("(../README.md", "(./getting-started.md");

	// GitHub кладёт эмодзи заголовка в слаг, VitePress выбрасывает; явный
	// якорь без эмодзи делает ссылки одинаковыми там и тут.
	text = text.replace(/^## (\p{Extended_Pictographic}️?) (.+)$/gmu, (_, emo, name) => {
		const slug = name.toLowerCase().replaceAll(".", "").replace(/\s+/g, "-");
		return `## ${emo} ${name} {#${slug}}`;
	});
	text = text.replace(/\]\(#\p{Extended_Pictographic}️?-/gu, "](#");
	text = text.replace(/\]\((\.\/[a-z-]+\.md)#\p{Extended_Pictographic}️?-/gu, "]($1#");

	// В доках гифка — она нужна GitHub. Сайту отдаём mp4 той же записи:
	// вдвое легче и грузится только когда доскроллили (DemoPlayer.vue).
	// Размер берём из тейпа — иначе место под запись не зарезервировать.
	text = text.replace(
		/!\[([^\]]*)\]\(https:\/\/raw\.githubusercontent\.com\/lazyvimx\/nvim\/assets\/demo\/([a-z0-9-]+)\.gif\)/g,
		(_, alt, name) => {
			const { width, height } = tapeSize(name);
			const before = withBefore.has(name) ? " before" : "";
			return `<DemoPlayer name="${name}" alt="${alt}" :width="${width}" :height="${height}"${before} />`;
		},
	);

	// Всё, что живёт только в репозитории, — на GitHub.
	text = text.replaceAll("(../lua/", `(${github}/blob/main/lua/`);
	text = text.replaceAll("(./lua/", `(${github}/blob/main/lua/`);
	text = text.replaceAll("(lua/", `(${github}/blob/main/lua/`);
	text = text.replaceAll("(../examples/", `(${github}/tree/main/examples/`);
	text = text.replaceAll("(examples/", `(${github}/tree/main/examples/`);
	text = text.replaceAll("(../CONTRIBUTING", `(${github}/blob/main/CONTRIBUTING`);
	text = text.replaceAll("(CONTRIBUTING", `(${github}/blob/main/CONTRIBUTING`);
	text = text.replaceAll("(../CHANGELOG.md", `(${github}/blob/main/CHANGELOG.md`);
	text = text.replaceAll("(CHANGELOG.md", `(${github}/blob/main/CHANGELOG.md`);
	text = text.replaceAll("(./)", `(${github}/tree/main/docs)`);

	return text;
}

const src = findSource();
mkdirSync(join(root, "ru"), { recursive: true });

// Заголовок страницы VitePress берёт из первого h1. В README его нет —
// там шапку держат баннер и бейджи, а они на сайт не едут.
function withTitle(text) {
	return text.startsWith("# ") ? text : `# lazyvimx\n\n${text}`;
}

for (const [source, en, ruPage] of pages) {
	const enText = readFileSync(join(src, `${source}.md`), "utf8");
	const ruText = readFileSync(join(src, `${source}.ru.md`), "utf8");

	writeFileSync(join(root, en), withTitle(transform(enText)));
	writeFileSync(join(root, ruPage), withTitle(transform(ruText)));
	console.log(`synced: ${en}, ${ruPage}`);
}

// Версию сайт показывает в статуслайне. Теги сюда не доезжают — клон в CI
// неглубокий, — а package.json release-it бампит вместе с тегом.
const { version } = JSON.parse(readFileSync(join(src, "package.json"), "utf8"));
writeFileSync(join(root, ".vitepress/theme/version.json"), JSON.stringify({ version }) + "\n");
console.log(`version: ${version}`);
