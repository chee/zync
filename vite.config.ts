import {defineConfig} from "vite"
import solid from "vite-plugin-solid"
import wasm from "vite-plugin-wasm"
import devtools from "solid-devtools/vite"

export default defineConfig({
	build: {
		target: ["firefox133", "safari18"],
	},
	plugins: [solid(), wasm(), devtools()],
})
