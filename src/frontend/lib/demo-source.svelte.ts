import { demoBase, demoFallback } from '#frontend/lib/demo-base.ts'

// Первая же запись, которая не доехала с основного входа, переключает на запасной
// все остальные разом, иначе каждая ждала бы своей ошибки. Обратно не возвращаемся:
// не дошла одна -- не дойдут и другие.
const state = $state({ broken: false })

export const demoSource = () => (state.broken ? demoFallback : demoBase)

export function demoUnreachable() {
	state.broken = true
}
