import type {Zync} from "./types.ts"
import "./action.css"
import clsx from "clsx"

import {createSortable, transformStyle} from "@thisbeyond/solid-dnd"
import {createDocumentStore, useHandle} from "automerge-repo-solid-primitives"

import {Match, Show, Switch} from "solid-js"
import {createShortcut} from "@solid-primitives/keyboard"
import Editor from "./editor.tsx"

let is = {
	input(el: any): el is HTMLInputElement {
		return el instanceof HTMLInputElement
	},
}

export default function Action(props: {
	url: Zync.ActionId
	current: boolean
	expanded: boolean
	select: () => void
	expand: () => void
	collapse: (action: Zync.Action) => void
}) {
	const handle = useHandle<Zync.Action>(() => props.url)
	const action = createDocumentStore(handle)

	const sortable = createSortable(props.url)

	createShortcut(
		["enter"],
		event => {
			// event?.preventDefault()
			if (props.current && !props.expanded) {
				props.expand()
			} else if (props.current && props.expanded) {
			}
		},
		{preventDefault: false}
	)

	createShortcut(
		["escape"],
		() => {
			props.collapse(action()!)
		},
		{preventDefault: false}
	)

	function toggle() {
		if (!props.current) return
		handle()!.change(item => {
			item.state = item.state == "todo" ? "done" : "todo"
		})
	}

	createShortcut(["Meta", "k"], toggle)
	createShortcut(["control", "k"], toggle)

	// const {onpointerdown, ...activators} = sortable.dragActivators
	const activeActivators = () => (props.expanded ? {} : sortable.dragActivators)

	const done = () => action()?.state == "done"

	return (
		<li
			ref={sortable.ref}
			style={{
				opacity: sortable.isActiveDraggable ? 0.25 : 100,
				// transition: dnd.active.draggable ? "transform 0.5s linear" : "",
				...transformStyle(sortable.transform),
			}}
			{...activeActivators()}
			onpointerdown={event => {
				props.current || props.select()
				let doc = document.documentElement
				doc.style.touchAction = "none"
				props.expanded || sortable.dragActivators.onpointerdown?.(event)
			}}
			onpointerout={() => {
				let doc = document.documentElement
				doc.style.touchAction = "auto"
			}}
			ontouchstart={event => {
				event.target.ontouchmove = event => {
					event.preventDefault()
					event.stopPropagation()
					return false
				}
			}}
			onTouchEnd={event => delete event.target.ontouchmove}
			tabindex={0}
		>
			<article
				class={clsx(
					"action",
					props.current && "action--current",
					props.expanded && "action--expanded",
					"action--" + action()?.state
				)}
				aria-current={props.current}
				aria-expanded={props.expanded}
				tabindex={0}
				id={props.url}
			>
				<header
					class="action-header"
					onClick={() => {
						props.current || props.select()
					}}
					onDblClick={() => {
						if (!props.expanded) {
							props.expand()
						}
					}}
				>
					<input
						type="checkbox"
						aria-describedby={`${props.url}-title`}
						checked={done()}
						onChange={event => {
							if (!is.input(event.target)) return
							event.stopPropagation()
							event.stopImmediatePropagation()
							toggle()
						}}
					/>
					<h2 id={`${props.url}-title`} class="action-title">
						<Switch>
							<Match when={props.expanded}>
								<Editor
									oneline
									placeholder="New action"
									handle={handle()!}
									field="title"
									blur={() => props.collapse(action()!)}
									onMount={view => {
										view.focus()
										view.dispatch({
											selection: {
												head: view.state.doc.length,
												anchor: view.state.doc.length,
											},
										})
									}}
								/>
							</Match>
							<Match when={!props.expanded}>{action()?.title}</Match>
						</Switch>
					</h2>
					{/* todo extract indicators to its own component */}
					<Show when={!props.expanded}>
						<div class="action-indicators">
							<Show when={action()?.note}>
								<svg
									fill="currentColor"
									stroke-width="0"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 512 512"
									style="overflow: visible; color: currentcolor;"
									height="1em"
									width="1em"
								>
									<path
										fill="none"
										stroke="currentColor"
										stroke-linejoin="round"
										stroke-width="32"
										d="M416 221.25V416a48 48 0 0 1-48 48H144a48 48 0 0 1-48-48V96a48 48 0 0 1 48-48h98.75a32 32 0 0 1 22.62 9.37l141.26 141.26a32 32 0 0 1 9.37 22.62Z"
									></path>
									<path
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="32"
										d="M256 56v120a32 32 0 0 0 32 32h120"
									></path>
								</svg>
							</Show>
						</div>
					</Show>
				</header>
				<div class="action-editor">
					<main class="action-note">
						<Show when={props.expanded}>
							<Editor
								handle={handle()!}
								field="note"
								placeholder="Notes"
								blur={() => props.collapse(action()!)}
								onMount={view => view.contentDOM.scrollIntoView()}
							/>
						</Show>
					</main>
					<footer class="action-footer">
						<div class="action-footer__info">
							<ul class="action-tags"></ul>
							<button class="action-when action-button">Today</button>
							<button class="action-due action-button">Due</button>
						</div>
						<div class="action-footer__buttons">
							<button class="action-tags-button">add tags</button>
							<button class="action-when-button action-button">say when</button>
							<button class="action-due-button action-button">
								set deadline
							</button>
						</div>
					</footer>
				</div>
			</article>
		</li>
	)
}
