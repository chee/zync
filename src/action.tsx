import type {Zync} from "./types.ts"
import "./action.css"
import clsx from "clsx"
import Modmask from "./modmask"

import {createSortable, transformStyle} from "@thisbeyond/solid-dnd"
import {ChangeFn} from "@automerge/automerge-repo"
import {createDocumentStore, useHandle} from "automerge-repo-solid-primitives"

import {Match, onMount, Switch, untrack} from "solid-js"
import {createShortcut} from "@solid-primitives/keyboard"

// import {Note} from "./note"

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
	collapse: () => void
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
			props.collapse()
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
				<header class="action-header">
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
					<h2
						onClick={() => {
							props.current || props.select()
						}}
						onDblClick={() => {
							if (!props.expanded) {
								props.expand()
							}
						}}
						id={`${props.url}-title`}
						class="action-title"
					>
						<Switch>
							<Match when={props.expanded}>
								<input
									placeholder="New action"
									autocomplete="off"
									class="action-input input"
									name="title"
									value={untrack(action)?.title}
									autofocus
									ref={input => {
										onMount(() => {
											input.focus()
											input.selectionStart = input.selectionEnd =
												input.value.length
										})
									}}
									onKeyDown={event => {
										let modmask = new Modmask(event)
										if (event.key == "Enter" && modmask.none) {
											event.stopImmediatePropagation()
											event.stopPropagation()
											event.preventDefault()
											handle()!.change(action => {
												if (!is.input(event.target)) return
												action.title = event.target.value
											})
											props.collapse()
										}
										event.key == "Escape" && modmask.none && props.collapse()
									}}
								/>
							</Match>
							<Match when={!props.expanded}>{action()?.title}</Match>
						</Switch>
					</h2>
				</header>
				<div class="action-editor">
					<main
						class="action-note"
						onKeyDown={event => {
							let modmask = new Modmask(event)

							event.key == "Escape" && modmask.none && props.collapse()
						}}
					>
						{/*props.expanded && <Note id={item.value.noteId} />*/}
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
