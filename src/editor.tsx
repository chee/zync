import {DocHandle} from "@automerge/automerge-repo"
import {Zync} from "./types"
import {drawSelection, EditorView, keymap, placeholder} from "@codemirror/view"
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands"
import {automergeSyncPlugin} from "@automerge/automerge-codemirror"
import {EditorState} from "@codemirror/state"
import {onMount} from "solid-js"
import {markdown, markdownLanguage} from "@codemirror/lang-markdown"

export default function Editor(props: {
	handle: DocHandle<Zync.Notable>
	field: "note" | "title"
	oneline?: boolean
	blur?(): void
	submit?(): void
	leave?(dir: "up" | "down"): void
	fontSize?: string
	placeholder?: string
	onMount?(view: EditorView): void
}) {
	const editor = (<div style={{width: "100%"}} />) as HTMLDivElement

	const view = new EditorView({
		parent: editor,
		doc: props.handle.docSync()?.[props.field],
		extensions: [
			markdown({
				base: markdownLanguage,
				addKeymap: true,
			}),
			history(),
			drawSelection(),
			EditorView.theme({
				"*": {
					"font-family": "var(--family-ui)",
					"font-size": props.fontSize || "14px",
				},
				"&.cm-focused": {
					outline: "none",
				},
				"&.cm-editor .cm-cursor": {
					"border-left-color": "#6C9BEE",
					"border-left-width": "2px",
				},
				"&.cm-editor": {
					width: "100%",
				},
				"&.cm-editor .cm-line": {
					padding: 0,
				},
				"&.cm-focused .cm-selectionLayer .cm-selectionBackground.cm-selectionBackground.cm-selectionBackground.cm-selectionBackground.cm-selectionBackground":
					{
						background: "#6C9BEE",
						opacity: 0.5,
					},
			}),

			EditorView.lineWrapping,
			EditorState.transactionFilter.of(tr =>
				props.oneline && tr.newDoc.lines > 1 ? [] : tr
			),
			keymap.of([
				// todo add keybinding when at start and pressing up/ctrl+p
				// todo add keybinding when at bottom and pressing down/ctrl+n
				{
					key: "Escape",
					run(view) {
						view.contentDOM.blur()
						props.blur?.()
						return true
					},
				},
				{
					key: "Enter",
					run(view) {
						if (props.oneline) {
							view.contentDOM.blur()
							props.blur?.()
							props.submit?.()
							return true
						}
						return false
					},
				},
				...defaultKeymap,
				...historyKeymap,
			]),
			automergeSyncPlugin({
				handle: props.handle,
				path: [props.field],
			}),
			placeholder(props.placeholder || ""),
		],
	})
	onMount(() => props.onMount?.(view))
	editor.addEventListener("keydown", event => event.stopImmediatePropagation())
	return editor
}
