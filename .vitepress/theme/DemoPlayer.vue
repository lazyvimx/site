<!-- Демо-запись экстры: mp4 вместо гифки — вдвое легче при том же
качестве. Палитра берётся у темы, поэтому в разметке один <video>, а не
пара скрытых друг за другом. Тейпы, у которых записан ещё и вариант без
экстры, получают табы «До | После».

Гифки никуда не делись: их показывает GitHub в README и EXTRAS.md, где
<video> не проигрывается. Здесь же — только mp4. -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

import { demoSource, demoUnreachable } from "./demo-source.js";

const props = defineProps({
	name: String,
	alt: String,
	before: Boolean,
	width: { type: Number, default: 1200 },
	height: { type: Number, default: 604 },
});

const { lang, isDark } = useData();

const labels = computed(() => (lang.value === "ru" ? ["До", "После"] : ["Before", "After"]));
const showBefore = ref(false);

const src = computed(() => {
	const before = showBefore.value ? "-before" : "";
	const theme = isDark.value ? "" : "-light";
	return `${demoSource.value}/${props.name}${before}${theme}.mp4`;
});

const video = ref(null);
const visible = ref(false);
// До первого кадра рамка пустая — без спиннера непонятно, грузится ли
// там что-то вообще. Гасим и на canplay: если автоплей отклонят,
// playing не придёт, а вечно крутящийся спиннер хуже никакого.
const loading = ref(true);
let observer;

// У <video> нет loading="lazy", так что ленивость держим сами: пока
// запись за экраном, у неё нет даже src — браузеру нечего скачивать.
// Появившийся src запускает запись сам, через autoplay; play() ниже
// нужен только чтобы вернуть её к жизни после ухода с экрана.
onMounted(() => {
	if (!video.value) return;

	observer = new IntersectionObserver(
		([entry]) => {
			visible.value = entry.isIntersecting;
			if (!entry.isIntersecting) return video.value?.pause();

			// src проставляет Vue, а он обновляет DOM отложенно: играть
			// зовём следующим тиком, иначе попадём на пустой <video>.
			nextTick(play);
		},
		{ rootMargin: "200px" },
	);

	observer.observe(video.value);
});

onBeforeUnmount(() => observer?.disconnect());

// Смена темы или таба меняет файл — <video> нужно перезарядить руками.
watch(src, () => {
	if (!visible.value || !video.value) return;
	video.value.load();
	play();
});

function play() {
	// Автоплей отклоняют по разным причинам (экономия батареи, политика
	// браузера) — это не ошибка страницы, показываем как есть.
	video.value?.play().catch(() => {});
}

// Запись не доехала — уходим на запасной вход CDN. Адрес сменится,
// watch выше перезарядит <video>. Если и там ошибка, адрес останется
// прежним и второго круга не будет — тогда и спиннер больше не нужен.
function onError() {
	const before = src.value;
	demoUnreachable();
	if (src.value === before) loading.value = false;
}
</script>

<!-- Всё внутри — строчные элементы, и корень тоже. Компонент попадает
в разметку из markdown, а тот заворачивает его в <p>: блочный тег внутри
абзаца браузер выносит наружу, разметка расходится с серверной и вся
гидрация рассыпается. На dev это не видно — там DOM строится через API,
а не разбором html. -->
<template>
	<span class="demo-player">
		<span v-if="before" class="demo-tabs-bar">
			<button :class="{ active: showBefore }" type="button" @click="showBefore = true">{{ labels[0] }}</button>
			<button :class="{ active: !showBefore }" type="button" @click="showBefore = false">{{ labels[1] }}</button>
		</span>
		<span class="demo-frame">
			<video
				ref="video"
				:src="visible ? src : undefined"
				:width="width"
				:height="height"
				:aria-label="`${alt}: ${name}`"
				:style="{ aspectRatio: `${width} / ${height}` }"
				autoplay
				muted
				loop
				playsinline
				preload="none"
				@loadstart="loading = true"
				@waiting="loading = true"
				@canplay="loading = false"
				@playing="loading = false"
				@error="onError"
			/>
			<span class="demo-loading" :class="{ active: visible && loading }" aria-hidden="true">
				<span class="demo-spinner" />
			</span>
		</span>
	</span>
</template>
