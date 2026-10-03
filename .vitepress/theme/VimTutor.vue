<!-- Туториал в духе vimtutor: карточка над статуслайном, шаг засчитывается
только по настоящему действию. Запускает его сам человек — кнопкой на
лендинге, секцией в статуслайне или :Tutor. -->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useData } from "vitepress";

import { isTouchOnly } from "./vim-keys";
import { stopTutor, vim } from "./vim-state";

const { lang } = useData();
const ru = computed(() => lang.value === "ru");

// Тексты статичные, поэтому v-html: так клавиши остаются <kbd>.
const STEPS = [
	{
		en: "<kbd>j</kbd> / <kbd>k</kbd> scroll a line down / up.",
		ru: "<kbd>j</kbd> / <kbd>k</kbd> — строка вниз / вверх.",
		done: (e) => e.seq === "j" || e.seq === "k",
	},
	{
		en: "<kbd>d</kbd> / <kbd>u</kbd> scroll half a page. Counts work too: <kbd>3j</kbd>.",
		ru: "<kbd>d</kbd> / <kbd>u</kbd> — полстраницы. Счётчик тоже работает: <kbd>3j</kbd>.",
		done: (e) => e.seq === "d" || e.seq === "u",
	},
	{
		en: "<kbd>G</kbd> jumps to the bottom, then <kbd>gg</kbd> back to the top.",
		ru: "<kbd>G</kbd> — в конец, затем <kbd>gg</kbd> — обратно в начало.",
		done: (e, seen) => {
			if (e.seq === "G") seen.bottom = true;
			return !!seen.bottom && e.seq === "gg";
		},
	},
	{
		en: "<kbd>}</kbd> / <kbd>{</kbd> jump between headings; <kbd>L</kbd> / <kbd>H</kbd> flip pages.",
		ru: "<kbd>}</kbd> / <kbd>{</kbd> — по заголовкам; <kbd>L</kbd> / <kbd>H</kbd> листают страницы.",
		done: (e) => ["}", "{", "]]", "[["].includes(e.seq),
	},
	{
		en: "<kbd>f</kbd> labels every link: type a label to follow it or <kbd>Esc</kbd> to cancel.",
		ru: "<kbd>f</kbd> — метки на ссылках: набери метку, чтобы перейти, или <kbd>Esc</kbd>.",
		done: (e) => e.seq === "f" || e.seq === "F",
	},
	{
		en: "<kbd>/</kbd> searches the whole site.",
		ru: "<kbd>/</kbd> — поиск по всему сайту.",
		done: (e) => e.seq === "/" || e.seq === "  ",
	},
	{
		en: "<kbd>:</kbd> opens the command line, <kbd>Tab</kbd> cycles completions. Run <kbd>:set bg=dark</kbd>.",
		ru: "<kbd>:</kbd> — командная строка, <kbd>Tab</kbd> листает варианты. Выполни <kbd>:set bg=dark</kbd>.",
		done: (e) => e.cmd === "set" && /^(?:bg|background)=(?:dark|light)$/.test(e.arg),
	},
	{
		en: "Press <kbd>Space</kbd> and wait: which-key lists the leader commands.",
		ru: "Нажми <kbd>Space</kbd> и подожди: which-key покажет leader-команды.",
		done: (e) => e.whichkey === " ",
	},
	{
		en: "<kbd>?</kbd> shows every key at once.",
		ru: "<kbd>?</kbd> — все клавиши разом.",
		done: (e) => !!e.sheet,
	},
];

const DONE = {
	en: "That's all. <kbd>?</kbd> always shows every key.",
	ru: "Вот и всё. <kbd>?</kbd> всегда покажет все клавиши.",
};

const KEY_STEP = "vim-tutor-step";
const KEY_DONE = "vim-tutor-done";

// В приватном окне или с заблокированными данными storage бросает —
// туториал тогда просто работает без памяти.
function read(storage, key) {
	try {
		return window[storage].getItem(key);
	} catch {
		return null;
	}
}

function write(storage, key, value) {
	try {
		if (value === null) window[storage].removeItem(key);
		else window[storage].setItem(key, value);
	} catch {}
}

const enabled = ref(false);
const searching = ref(false);
const passed = ref(false);
const finished = ref(false);

let seen = {};
let flashTimer = 0;
let finishTimer = 0;
let observer;

const step = computed(() => (vim.tutor === null ? null : STEPS[vim.tutor]));
const hidden = computed(() => vim.overlay || searching.value);
const visible = computed(() => enabled.value && !hidden.value && (!!step.value || finished.value));

const title = computed(() => (finished.value ? "Tutor ✓" : `Tutor ${vim.tutor + 1}/${STEPS.length}`));
const text = computed(() => {
	const source = finished.value ? DONE : step.value;
	return ru.value ? source.ru : source.en;
});

function next() {
	seen = {};
	passed.value = false;

	if (vim.tutor + 1 < STEPS.length) {
		vim.tutor += 1;
		return;
	}

	stopTutor();
	vim.tutorDone = true;
	write("localStorage", KEY_DONE, "1");
	finished.value = true;
}

// Галочка висит чуть-чуть, чтобы засчитанный шаг было видно.
function pass() {
	passed.value = true;
	clearTimeout(flashTimer);
	flashTimer = setTimeout(() => vim.tutor !== null && next(), 600);
}

function check(event) {
	if (!event || vim.tutor === null || passed.value) return;
	if (event.tutor === "skip") return next();
	if (STEPS[vim.tutor].done(event, seen)) pass();
}

function close() {
	if (finished.value) finished.value = false;
	else stopTutor();
}

function onClick(event) {
	const link = event.target.closest?.('a[href$="#tutor"]');
	if (!link) return;

	event.preventDefault();
	event.stopPropagation();
	finished.value = false;
	vim.tutor = 0;
}

watch(() => vim.last, check);
watch(
	() => vim.sheet,
	(open) => open && check({ sheet: true }),
);

watch(
	() => vim.tutor,
	(index) => {
		seen = {};
		write("sessionStorage", KEY_STEP, index === null ? null : String(index));
		if (index !== null) finished.value = false;
	},
);

// Финальная карточка гаснет сама, но отсчёт идёт, только пока её видно.
watch([finished, hidden], ([done, covered]) => {
	clearTimeout(finishTimer);
	if (done && !covered) finishTimer = setTimeout(() => (finished.value = false), 8000);
});

onMounted(() => {
	if (isTouchOnly()) return;
	enabled.value = true;

	vim.tutorDone = read("localStorage", KEY_DONE) === "1";

	const saved = read("sessionStorage", KEY_STEP);
	if (saved !== null && Number(saved) < STEPS.length) vim.tutor = Number(saved);

	document.addEventListener("click", onClick, true);

	// Модалку поиска VitePress телепортирует в body — смотрим за ним.
	observer = new MutationObserver(() => (searching.value = !!document.querySelector(".VPLocalSearchBox")));
	observer.observe(document.body, { childList: true });
});

onUnmounted(() => {
	document.removeEventListener("click", onClick, true);
	observer?.disconnect();
	clearTimeout(flashTimer);
	clearTimeout(finishTimer);
});
</script>

<template>
	<div v-if="visible" class="vim-tutor" role="status">
		<div class="head">
			<span>{{ title }}</span>
			<button class="close" type="button" :aria-label="ru ? 'Закрыть' : 'Close'" @click="close">×</button>
		</div>
		<p class="text" v-html="text" />
		<div v-if="!finished" class="keys">
			{{ passed ? "✓" : ru ? "q — выйти · n — пропустить" : "q — quit · n — skip" }}
		</div>
	</div>
</template>
