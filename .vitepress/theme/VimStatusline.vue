<!-- Статуслайн в духе lualine внизу вьюпорта: режим меняется на VISUAL
при выделении текста, справа позиция прокрутки как позиция в файле. -->
<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useData, useRoute } from "vitepress";

import { version } from "./version.json";
import { vim } from "./vim-state";

const route = useRoute();
const { lang } = useData();

const release = `https://github.com/lazyvimx/nvim/releases/tag/v${version}`;

const visual = ref(false);
const percent = ref("Top");

const file = computed(() => {
	const path = route.path.replace(/^\/(ru\/)?/, "").replace(/\/$/, "");
	if (!path) return "~/lazyvimx/index.md";
	return `~/lazyvimx/${path.replace(/\.html$/, "")}.md`;
});

const command = computed(() => vim.mode === "COMMAND");
const mode = computed(() => (command.value ? "COMMAND" : visual.value ? "VISUAL" : "NORMAL"));
const credit = computed(() => (lang.value === "ru" ? "сделано с ❤️ aimuzov" : "made with ❤️ by aimuzov"));

// Эхо набранного, как showcmd: пробел лидера иначе выглядит пустотой.
const showcmd = computed(() => (vim.count + vim.pending).replace(/ /g, "␣"));

// Высоту документа держим в переменной: читать её на каждом событии
// скролла — это принудительная компоновка посреди прокрутки, браузер
// пересчитывает раскладку заново. Меняется она только от содержимого,
// за этим и следит наблюдатель.
let max = 0;
let frame = 0;
let start = 0;
let observer;

function measure() {
	max = document.documentElement.scrollHeight - window.innerHeight;
}

function update() {
	if (max <= 0) return (percent.value = "All");
	const y = window.scrollY;
	if (y <= 0) return (percent.value = "Top");
	if (y >= max - 2) return (percent.value = "Bot");
	percent.value = Math.round((y / max) * 100) + "%";
}

// Событий скролла приходит больше, чем кадров: считаем раз в кадр.
function onScroll() {
	if (frame) return;
	frame = requestAnimationFrame(() => {
		frame = 0;
		update();
	});
}

function onResize() {
	measure();
	update();
}

function onSelection() {
	visual.value = !document.getSelection()?.isCollapsed;
}

onMounted(() => {
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onResize, { passive: true });
	document.addEventListener("selectionchange", onSelection);

	// Первый замер — следующим кадром: в момент монтирования страница
	// ещё достраивается, и чтение высоты остановило бы её ради
	// пересчёта раскладки.
	start = requestAnimationFrame(() => {
		start = 0;
		observer = new ResizeObserver(onResize);
		observer.observe(document.documentElement);
		onResize();
	});
});

onUnmounted(() => {
	window.removeEventListener("scroll", onScroll);
	window.removeEventListener("resize", onResize);
	document.removeEventListener("selectionchange", onSelection);
	observer?.disconnect();
	cancelAnimationFrame(frame);
	cancelAnimationFrame(start);
});
</script>

<template>
	<div class="vim-statusline" :class="{ visual, command }">
		<!-- Глифов Nerd Font в веб-шрифте нет: точка вместо иконки режима,
		     скошенные границы секций рисует clip-path. -->
		<span class="section mode">● {{ mode }}</span>
		<a class="section version" :href="release" target="_blank" rel="noopener">● v{{ version }}</a>
		<span class="file">{{ file }}</span>
		<span class="spacer"></span>
		<span class="showcmd">{{ showcmd }}</span>
		<!-- Про клавиши иначе никто не узнает — пусть о них напоминает
		     сама полоса. -->
		<button class="help" type="button" @click="vim.sheet = !vim.sheet">?</button>
		<span class="section credit">{{ credit }}</span>
		<span class="section percent">{{ percent }}</span>
	</div>
</template>
