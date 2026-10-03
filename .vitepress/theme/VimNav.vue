<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import { getScrollOffset, useData, useRoute, useRouter, withBase } from "vitepress";
import { useLangs } from "vitepress/dist/client/theme-default/composables/langs.js";

import { isEditingContent, isTouchOnly, keyCandidates } from "./vim-keys";
import { clearMessage, setMessage, startTutor, stopTutor, track, vim } from "./vim-state";
import VimHints from "./VimHints.vue";
import VimWhichKey from "./VimWhichKey.vue";

const route = useRoute();
const router = useRouter();
const { isDark, lang, theme } = useData();
const { currentLang, localeLinks } = useLangs({ correspondingLink: true });
const toggleAppearance = inject("toggle-appearance", () => (isDark.value = !isDark.value));

const ru = computed(() => lang.value === "ru");

// ——— скролл ———————————————————————————————————————————————————————

// Строка сетки — 28px; за нажатие проходим две, иначе j ощущается вязко.
const STEP = 56;

// Плавность своя, а не behavior: "smooth": на автоповторе браузер рвёт
// очередь анимаций и страница дёргается.
let wanted = null;
let frame = 0;

const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const halfPage = () => Math.round(window.innerHeight / 2);
const from = () => wanted ?? window.scrollY;

function scrollTo(y) {
	wanted = Math.max(0, Math.min(maxScroll(), y));

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return settle();
	if (!frame) frame = requestAnimationFrame(glide);
}

function scrollBy(delta) {
	scrollTo(from() + delta);
}

function glide() {
	const rest = wanted - window.scrollY;
	if (Math.abs(rest) < 1) return settle();

	window.scrollTo(0, window.scrollY + rest * 0.3);
	frame = requestAnimationFrame(glide);
}

function settle() {
	if (frame) cancelAnimationFrame(frame);
	if (wanted !== null) window.scrollTo(0, wanted);

	frame = 0;
	wanted = null;
}

// Колесо и палец забирают скролл себе — анимацию бросаем на месте.
function drop() {
	if (frame) cancelAnimationFrame(frame);

	frame = 0;
	wanted = null;
}

// ——— заголовки ————————————————————————————————————————————————————

function headingTops() {
	const offset = getScrollOffset() + 8;

	// Заголовок страницы пропускаем: до него доводит gg, а как остановка
	// для «}» он съедал бы первое нажатие.
	return [...document.querySelectorAll(".VPDoc :where(h2,h3)")]
		.filter((el) => el.id)
		.map((el) => Math.round(window.scrollY + el.getBoundingClientRect().top - offset));
}

function jumpHeading(step) {
	const tops = headingTops();
	if (!tops.length) return;

	if (step > 0) {
		const ahead = tops.filter((top) => top > from() + 1);
		return scrollTo(ahead.length ? ahead[Math.min(step, ahead.length) - 1] : maxScroll());
	}

	const behind = tops.filter((top) => top < from() - 1);
	scrollTo(behind.length ? behind[Math.max(0, behind.length + step)] : 0);
}

function gotoHeading(n) {
	const tops = headingTops();
	if (!tops.length) return setMessage("E486: Pattern not found");

	scrollTo(tops[Math.min(n, tops.length) - 1]);
}

// ——— страницы —————————————————————————————————————————————————————

// Соседние страницы берём из того же сайдбара, что рисует меню, — так
// порядок один и на лендинге, где пейджера внизу нет.
function pages() {
	const groups = theme.value.sidebar;
	if (!Array.isArray(groups)) return [];

	return groups.flatMap((group) => group.items ?? []);
}

const slug = (link) => link.replace(/\/$/, "").split("/").pop() || "index";

function isHere(link) {
	const trim = (path) => path.replace(/\.html$/, "").replace(/\/$/, "");

	return trim(withBase(link)) === trim(route.path);
}

function toPage(delta) {
	const list = pages();
	const next = list[list.findIndex((item) => isHere(item.link)) + delta];

	if (!next) {
		return setMessage(delta > 0 ? "E87: Cannot go beyond last buffer" : "E88: Cannot go before first buffer");
	}

	router.go(withBase(next.link));
}

function editPage(name) {
	if (!name) return setMessage("E32: No file name");

	const match = pages().find((item) => slug(item.link).startsWith(name.toLowerCase()));
	if (!match) return setMessage(`E447: Can't find file "${name}" in path`);

	router.go(withBase(match.link));
}

// ——— поиск ————————————————————————————————————————————————————————

const searchOpen = () => !!document.querySelector(".VPLocalSearchBox");

// Ручки у модалки нет, свой хоткей VitePress вешает на event.key —
// остаётся нажать кнопку в шапке за пользователя.
function openSearch() {
	const button = document.querySelector("#local-search button");
	if (button) return button.click();

	window.dispatchEvent(Object.assign(new Event("keydown"), { key: "k", metaKey: true }));
}

// ——— прочие действия ——————————————————————————————————————————————

function focusFirst(selector) {
	const el = document.querySelector(selector);
	if (!el) return setMessage("E444: Cannot close last window");

	el.focus();
	el.scrollIntoView({ block: "nearest" });
}

function switchLang() {
	const to = localeLinks.value[0];
	if (to) router.go(withBase(to.link));
}

function openRepo() {
	const link = theme.value.socialLinks?.[0]?.link;
	if (link) window.open(link, "_blank", "noopener");
}

// ——— раскладка ————————————————————————————————————————————————————

// Точку и запятую не занимаем: в кириллице они лежат на Slash, и биндинг
// на них перехватил бы «/» раньше, чем тот дойдёт до поиска.
const KEYS = [
	{ seq: "j", group: "motion", en: "line down", ru: "строка вниз", run: (n) => scrollBy(STEP * n) },
	{ seq: "k", group: "motion", en: "line up", ru: "строка вверх", run: (n) => scrollBy(-STEP * n) },
	{ seq: "d", group: "motion", en: "half page down", ru: "полстраницы вниз", run: (n) => scrollBy(halfPage() * n) },
	{ seq: "u", group: "motion", en: "half page up", ru: "полстраницы вверх", run: (n) => scrollBy(-halfPage() * n) },
	{ seq: "gg", group: "motion", en: "to the top", ru: "в начало", run: () => scrollTo(0) },
	{ seq: "G", group: "motion", en: "to the bottom", ru: "в конец", run: () => scrollTo(maxScroll()) },
	{ seq: "}", group: "motion", en: "next heading", ru: "следующий заголовок", run: (n) => jumpHeading(n) },
	{ seq: "{", group: "motion", en: "previous heading", ru: "предыдущий заголовок", run: (n) => jumpHeading(-n) },
	{ seq: "]]", group: "motion", en: "next heading", ru: "следующий заголовок", run: (n) => jumpHeading(n) },
	{ seq: "[[", group: "motion", en: "previous heading", ru: "предыдущий заголовок", run: (n) => jumpHeading(-n) },

	{ seq: "L", group: "buffer", en: "next page", ru: "следующая страница", run: () => toPage(1) },
	{ seq: "H", group: "buffer", en: "previous page", ru: "предыдущая страница", run: () => toPage(-1) },
	{ seq: "]b", group: "buffer", en: "next page", ru: "следующая страница", run: () => toPage(1) },
	{ seq: "[b", group: "buffer", en: "previous page", ru: "предыдущая страница", run: () => toPage(-1) },
	{ seq: "]h", group: "buffer", en: "forward in history", ru: "вперёд по истории", run: () => window.history.forward() },
	{ seq: "[h", group: "buffer", en: "back in history", ru: "назад по истории", run: () => window.history.back() },
	{ seq: "gh", group: "buffer", en: "home page", ru: "на главную", run: () => router.go(withBase(currentLang.value.link)) },

	{ seq: "/", group: "find", en: "search the site", ru: "поиск по сайту", run: openSearch },
	{ seq: "f", group: "find", en: "label the links", ru: "метки на ссылках", run: () => startHints(false) },
	{ seq: "F", group: "find", en: "labels, new tab", ru: "метки, в новой вкладке", run: () => startHints(true) },
	{ seq: ":", group: "find", en: "command line", ru: "командная строка", run: () => openCmdline() },
	{ seq: "?", group: "find", en: "all the keys", ru: "все клавиши", run: () => (vim.sheet = true) },

	{ seq: "  ", group: "leader", en: "search the site", ru: "поиск по сайту", run: openSearch },
	{ seq: " e", group: "leader", en: "file tree", ru: "дерево файлов", run: () => focusFirst(".VPSidebar a.link") },
	{ seq: " o", group: "leader", en: "outline", ru: "оглавление", run: () => focusFirst(".VPDocAsideOutline .outline-link") },
	{ seq: " l", group: "leader", en: "language", ru: "язык", run: switchLang },
	{ seq: " ut", group: "leader", en: "theme", ru: "тема", run: () => toggleAppearance() },
	{ seq: " gg", group: "leader", en: "repository", ru: "репозиторий", run: openRepo },
	{ seq: " ?", group: "leader", en: "all the keys", ru: "все клавиши", run: () => (vim.sheet = true) },
];

const BY_SEQ = new Map(KEYS.map((key) => [key.seq, key]));

const PREFIXES = new Set();
for (const { seq } of KEYS) {
	for (let i = 1; i < seq.length; i++) PREFIXES.add(seq.slice(0, i));
}

// ——— подсказки ————————————————————————————————————————————————————

const whichKey = ref(false);
let whichKeyTimer = 0;

const GROUPS = {
	motion: { en: "Motions", ru: "Движение" },
	buffer: { en: "Buffers", ru: "Буферы" },
	find: { en: "Find", ru: "Поиск" },
	leader: { en: "Leader", ru: "Лидер" },
};

const pretty = (seq) => seq.replace(/ /g, "<space>").replace(/^<space>/, "<leader>");

const panel = computed(() => {
	const label = (key) => ({ seq: pretty(key.seq), text: ru.value ? key.ru : key.en });

	if (vim.sheet) {
		return {
			title: ru.value ? "Клавиши" : "Keys",
			groups: Object.entries(GROUPS).map(([name, title]) => ({
				title: ru.value ? title.ru : title.en,
				items: KEYS.filter((key) => key.group === name).map(label),
			})),
		};
	}

	if (!whichKey.value || !vim.pending) return null;

	return {
		title: pretty(vim.pending),
		groups: [{ items: KEYS.filter((key) => key.seq.startsWith(vim.pending)).map(label) }],
	};
});

// ——— метки на ссылках —————————————————————————————————————————————

const HINT_KEYS = "asdfghjkl";
const hints = ref(null);

// Метки одной длины: иначе короткая была бы началом длинной и переход
// срабатывал бы раньше, чем человек дотянет ярлык.
function makeLabels(count) {
	let labels = [...HINT_KEYS];
	while (labels.length < count) labels = labels.flatMap((prefix) => [...HINT_KEYS].map((ch) => prefix + ch));

	return labels;
}

function startHints(newTab) {
	const height = window.innerHeight;
	const width = window.innerWidth;

	const items = [...document.querySelectorAll("a[href]")]
		.map((el) => ({ el, rect: el.getBoundingClientRect() }))
		.filter(({ el, rect }) => {
			if (!rect.width || !rect.height) return false;
			if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return false;

			return getComputedStyle(el).visibility !== "hidden";
		});

	if (!items.length) return setMessage("E349: No identifier under cursor");

	const labels = makeLabels(items.length);
	hints.value = { newTab, typed: "", items: items.map((item, i) => ({ ...item, label: labels[i] })) };

	window.addEventListener("scroll", closeHints, { passive: true });
	window.addEventListener("resize", closeHints);
}

function closeHints() {
	hints.value = null;

	window.removeEventListener("scroll", closeHints);
	window.removeEventListener("resize", closeHints);
}

function feedHint(event) {
	event.preventDefault();

	if (event.key === "Escape") return closeHints();

	const ch = keyCandidates(event).find((candidate) => HINT_KEYS.includes(candidate.toLowerCase()));
	if (!ch) return closeHints();

	const typed = hints.value.typed + ch.toLowerCase();
	const match = hints.value.items.filter((item) => item.label.startsWith(typed));

	if (!match.length) return closeHints();
	if (match.length > 1) return (hints.value.typed = typed);

	const { el } = match[0];
	const newTab = hints.value.newTab;
	closeHints();

	if (newTab || el.target === "_blank") return window.open(el.href, "_blank", "noopener");
	el.click();
}

// ——— командная строка —————————————————————————————————————————————

const cmd = ref(null);
const cmdInput = ref(null);
const typed = [];
let typedAt = -1;

// Пока Tab листает меню, оно строится от набранного руками, а не от
// подставленного кандидата — иначе список схлопнулся бы до одного пункта.
const anchor = ref(null);
const selected = ref(-1);

const COMMANDS = [
	{ word: "edit", en: "open a page", ru: "открыть страницу" },
	{ word: "help", en: "key bindings", ru: "клавиши" },
	{ word: "set", en: "set an option", ru: "задать опцию" },
	{ word: "lang", en: "switch language", ru: "сменить язык" },
	{ word: "LazyExtras", en: "list of extras", ru: "список экстр" },
	{ word: "Tutor", en: "interactive tutorial", ru: "интерактивный туториал" },
	{ word: "q", en: "go back", ru: "назад" },
];

function argsFor(name) {
	switch (name) {
		case "e":
		case "edit":
			return pages().map((item) => ({ word: slug(item.link), desc: item.text }));
		case "set":
			return [
				{ word: "bg=dark", desc: ru.value ? "тёмная тема" : "dark theme" },
				{ word: "bg=light", desc: ru.value ? "светлая тема" : "light theme" },
			];
		case "lang":
			return [
				{ word: "en", desc: "English" },
				{ word: "ru", desc: "Русский" },
			];
	}

	return [];
}

// Голова строки — команда, хвост — аргумент; дополняется то, что под курсором.
function parseLine(line) {
	const text = line.trimStart();
	const space = text.search(/\s/);

	if (space < 0) return { name: null, arg: text };

	return { name: text.slice(0, space), arg: text.slice(space).trimStart() };
}

const menu = computed(() => {
	if (cmd.value === null) return [];

	const { name, arg } = parseLine(anchor.value ?? cmd.value);
	const needle = arg.toLowerCase();

	const items =
		name === null
			? COMMANDS.map((item) => ({ word: item.word, desc: ru.value ? item.ru : item.en }))
			: argsFor(name);

	return items.filter((item) => item.word.toLowerCase().startsWith(needle));
});

function fill(item, { space = false } = {}) {
	const { name } = parseLine(anchor.value ?? cmd.value);
	const line = name === null ? item.word : `${name} ${item.word}`;

	cmd.value = space && name === null ? `${line} ` : line;
}

function cycle(delta) {
	if (!menu.value.length) return;
	if (anchor.value === null) anchor.value = cmd.value;

	const next = selected.value + delta;
	selected.value = next < 0 ? menu.value.length - 1 : next % menu.value.length;

	fill(menu.value[selected.value]);
}

// Клик по команде сразу ставит пробел — следом откроется меню аргументов.
function pick(index) {
	fill(menu.value[index], { space: true });
	dropMenu();
}

function dropMenu() {
	anchor.value = null;
	selected.value = -1;
}

function openCmdline() {
	reset();
	clearMessage();

	vim.mode = "COMMAND";
	cmd.value = "";
	typedAt = -1;
	dropMenu();

	nextTick(() => cmdInput.value?.focus());
}

function closeCmdline() {
	cmd.value = null;
	vim.mode = "NORMAL";
	dropMenu();
}

function onCmdKey(event) {
	if (event.key === "Escape" || (event.key === "Backspace" && !cmd.value)) {
		event.preventDefault();
		return closeCmdline();
	}

	if (event.key === "Enter") {
		event.preventDefault();

		const line = cmd.value;
		closeCmdline();

		return runCommand(line);
	}

	if (event.key === "Tab" || (event.ctrlKey && (event.key === "n" || event.key === "p"))) {
		event.preventDefault();
		return cycle(event.shiftKey || event.key === "p" ? -1 : 1);
	}

	if (event.key === "ArrowUp" || event.key === "ArrowDown") {
		event.preventDefault();
		return recall(event.key === "ArrowUp" ? 1 : -1);
	}
}

function recall(delta) {
	typedAt = Math.max(-1, Math.min(typed.length - 1, typedAt + delta));
	cmd.value = typed[typedAt] ?? "";
	dropMenu();
}

function runCommand(raw) {
	const line = raw.trim();
	if (!line) return;

	typed.unshift(line);

	const [name, ...rest] = line.split(/\s+/);
	const arg = rest.join(" ");

	if (/^\d+$/.test(name)) return gotoHeading(Number(name));

	track({ cmd: name, arg });

	switch (name) {
		case "q":
		case "q!":
		case "qa":
			return window.history.back();
		case "e":
		case "edit":
			return editPage(arg);
		case "h":
		case "help":
			return (vim.sheet = true);
		case "set":
			return setOption(arg);
		case "lang":
			return setLang(arg);
		case "LazyExtras":
			return editPage("extras");
		case "Tutor":
			return startTutor();
		case "w":
		case "wq":
		case "x":
			return setMessage("E45: 'readonly' option is set (add ! to override)");
	}

	setMessage(`E492: Not an editor command: ${line}`);
}

function setOption(arg) {
	const parsed = arg.match(/^(?:bg|background)=(dark|light)$/);
	if (!parsed) return setMessage(`E518: Unknown option: ${arg}`);

	if (isDark.value !== (parsed[1] === "dark")) toggleAppearance();
}

function setLang(arg) {
	if (arg !== "ru" && arg !== "en") return setMessage(`E474: Invalid argument: ${arg}`);
	if (arg !== lang.value) switchLang();
}

// ——— разбор нажатий ———————————————————————————————————————————————

function reset() {
	clearTimeout(whichKeyTimer);

	vim.pending = "";
	vim.count = "";
	whichKey.value = false;
	vim.sheet = false;

	if (hints.value) closeHints();
	if (cmd.value !== null) closeCmdline();
}

function apply(seq) {
	const binding = BY_SEQ.get(seq);

	if (!binding) {
		vim.pending = seq;
		clearTimeout(whichKeyTimer);
		whichKeyTimer = setTimeout(() => {
			whichKey.value = true;
			track({ whichkey: seq });
		}, 250);

		return;
	}

	const count = Number(vim.count) || 1;
	reset();
	binding.run(count);
	track({ seq });
}

// Cmd/Ctrl-K VitePress тоже ловит по event.key — в кириллице туда
// приходит «л», и поиск молчит.
function searchShortcut(event) {
	if (!event.metaKey && !event.ctrlKey) return false;
	if (event.altKey || event.key === "k" || searchOpen() || isEditingContent(event)) return false;
	if (!keyCandidates(event).includes("k")) return false;

	event.preventDefault();
	openSearch();

	return true;
}

function onCtrl(event) {
	const keys = keyCandidates(event);
	const hit = (ch) => keys.includes(ch);

	// Внутри модалки Ctrl-j/k ходят по результатам: VPLocalSearchBox
	// слушает стрелки на window — стрелку и отдаём.
	if (searchOpen()) {
		if (!hit("j") && !hit("k")) return;

		event.preventDefault();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: hit("j") ? "ArrowDown" : "ArrowUp" }));

		return;
	}

	if (isEditingContent(event)) return;

	// Ctrl-f и Ctrl-o оставлены браузеру: там поиск по странице и диалог
	// открытия файла, ломать их ради полстраницы не стоит.
	if (!hit("d") && !hit("u")) return;

	event.preventDefault();
	scrollBy(hit("d") ? halfPage() : -halfPage());
}

function onKeydown(event) {
	if (searchShortcut(event)) return;
	if (event.metaKey || event.altKey) return;
	if (event.ctrlKey) return onCtrl(event);
	if (hints.value) return feedHint(event);

	if (event.key === "Escape") return reset();
	if (isEditingContent(event) || searchOpen()) return;

	const keys = keyCandidates(event);

	// Пока идёт туториал и поверх ничего не открыто, q и n — его клавиши:
	// в раскладке они свободны.
	if (vim.tutor !== null && !vim.overlay && !vim.pending && !vim.count) {
		if (keys.includes("q")) {
			event.preventDefault();
			return stopTutor();
		}

		if (keys.includes("n")) {
			event.preventDefault();
			return track({ tutor: "skip" });
		}
	}

	// Счётчик набирается до последовательности: 3j, 5}
	if (!vim.pending) {
		const digit = keys.find((ch) => ch >= "0" && ch <= "9");

		if (digit && (vim.count || digit !== "0")) {
			event.preventDefault();
			vim.count += digit;

			return;
		}
	}

	// Оборвавшуюся последовательность начинаем заново с той же клавиши.
	const tries = keys.map((ch) => vim.pending + ch);
	if (vim.pending) tries.push(...keys);

	const seq = tries.find((candidate) => BY_SEQ.has(candidate) || PREFIXES.has(candidate));
	if (!seq) return reset();

	event.preventDefault();
	apply(seq);
}

// ——— жизненный цикл ———————————————————————————————————————————————

// Командная строка ложится поверх статуслайна, как view = "cmdline" в noice.
const barOpen = computed(() => cmd.value !== null || !!vim.message);

// Туториал прячет карточку, пока поверх страницы что-то открыто.
watchEffect(() => (vim.overlay = cmd.value !== null || !!hints.value || !!panel.value));

watch(selected, (index) => {
	if (index < 0) return;

	nextTick(() => document.querySelector(".vim-cmdmenu .selected")?.scrollIntoView({ block: "nearest" }));
});

watch(() => route.path, reset);

onMounted(() => {
	if (isTouchOnly()) return;

	window.addEventListener("keydown", onKeydown);
	window.addEventListener("wheel", drop, { passive: true });
	window.addEventListener("touchmove", drop, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener("keydown", onKeydown);
	window.removeEventListener("wheel", drop);
	window.removeEventListener("touchmove", drop);

	closeHints();
});
</script>

<template>
	<VimHints v-if="hints" :items="hints.items" :typed="hints.typed" />
	<VimWhichKey v-if="panel" :panel="panel" />

	<div v-if="barOpen" class="vim-cmdline">
		<ul v-if="cmd !== null && menu.length" class="vim-cmdmenu">
			<li
				v-for="(item, index) in menu"
				:key="item.word"
				:class="{ selected: index === selected }"
				@mousedown.prevent="pick(index)"
			>
				<span class="word">{{ item.word }}</span>
				<span class="desc">{{ item.desc }}</span>
			</li>
		</ul>

		<template v-if="cmd !== null">
			<span class="prompt">:</span>
			<input
				ref="cmdInput"
				v-model="cmd"
				class="input"
				type="text"
				autocomplete="off"
				spellcheck="false"
				@blur="closeCmdline"
				@input="dropMenu"
				@keydown="onCmdKey"
			/>
		</template>
		<span v-else class="message">{{ vim.message }}</span>
	</div>
</template>
