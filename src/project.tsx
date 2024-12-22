import type {Zync} from "./types.ts"
import Action from "./action.tsx"
import "./project.css"

import {
	DragDropProvider,
	DragDropSensors,
	SortableProvider,
	DragEvent,
} from "@thisbeyond/solid-dnd"
import clsx from "clsx"

import {deleteAt, insertAt} from "@automerge/automerge-repo"
import {
	createEffect,
	createSignal,
	For,
	onMount,
	Show,
	Suspense,
} from "solid-js"
import {createAction} from "./zync.ts"

import {createShortcut} from "@solid-primitives/keyboard"
import Editor from "./editor.tsx"
import {createDocumentStore, useHandle} from "automerge-repo-solid-primitives"

export default function Project(props: {url: Zync.ProjectId}) {
	let listItemsElement: HTMLOListElement
	const handle = useHandle<Zync.Project>(() => props.url)
	const project = createDocumentStore(handle)
	createEffect(() => {
		document.title = project()?.title ?? "the zync up"
		project()?.children.length
	})
	let [currentAction, setCurrentAction] = createSignal<Zync.ActionId | null>(
		null
	)
	let [expandedAction, setExpandedAction] = createSignal<Zync.ActionId | null>(
		null
	)

	const currentActionIndex = () => project()!.children.indexOf(currentAction()!)
	// const expandedActionIndex = () =>
	// props.project.children.indexOf(expandedAction()!)

	createShortcut(
		[" "],
		() => {
			if (expandedAction() == null) {
				newItem()
			}
		},
		{preventDefault: false}
	)

	createShortcut(
		["backspace"],
		() => {
			if (expandedAction() == null) {
				trash()
			}
		},
		{preventDefault: false}
	)

	createShortcut(["Control", "A"], () => {
		if (expandedAction() == null) {
			newItem()
		}
	})

	function newItem() {
		const action = createAction()
		const url = window.repo.create(action).url as Zync.ActionId
		handle()?.change(project => {
			let index = currentActionIndex()
			if (index == -1) {
				index = project.children.length - 1
			}
			insertAt(project.children, index + 1, url as Zync.ActionId)
		})
		setTimeout(() => {
			setCurrentAction(url)
			setExpandedAction(url)
		})
	}

	function select(inc: 1 | -1 = 1) {
		const current = currentActionIndex()
		const index = current == -1 ? 0 : current + inc
		const next = project()?.children[index]
		next && setCurrentAction(next)
	}

	function move(inc: 1 | -1 = 1) {
		const current = currentActionIndex()
		const index = current == -1 ? 0 : current + inc
		handle()?.change(project => {
			deleteAt(project.children, current)
			insertAt(project.children, index, currentAction())
		})
	}

	createShortcut(["arrowdown"], () => select(1))
	createShortcut(["control", "n"], () => select(1))
	createShortcut(["arrowup"], () => select(-1))
	createShortcut(["control", "p"], () => select(-1))

	createShortcut(["control", "arrowdown"], () => move(1))
	createShortcut(["meta", "arrowdown"], () => move(1))
	createShortcut(["control", "arrowup"], () => move(-1))
	createShortcut(["meta", "arrowup"], () => move(-1))

	function trash() {
		const current = currentActionIndex()
		if (current == -1) return
		select()
		handle()?.change(project => {
			deleteAt(project.children, current)
		})
	}

	function handleDragEnd(event: DragEvent) {
		const {draggable, droppable} = event

		if (droppable && draggable.id !== droppable.id) {
			handle()?.change(project => {
				const draggedIndex = Array.from(project.children).indexOf(draggable.id)
				const droppedIndex = Array.from(project.children).indexOf(droppable.id)
				deleteAt(project.children, draggedIndex)
				insertAt(project.children, droppedIndex, draggable.id)
			})
		}
	}

	return (
		<Show when={handle()}>
			<DragDropProvider onDragEnd={handleDragEnd}>
				<DragDropSensors />

				<article
					class={clsx(
						"project",
						expandedAction() && "project--with-expanded-item"
					)}
					onclick={event => {
						if (!(event.target instanceof HTMLElement)) return

						if (!event.target.closest(".project-actions")) {
							setExpandedAction(null)
						}
					}}
				>
					<h1 class="project-title">{project()?.title}</h1>
					<article class="project-note">
						<Suspense>
							<Editor handle={handle()!} field="note" placeholder="Notes" />
						</Suspense>
					</article>
					<SortableProvider ids={project()?.children}>
						<ol class="project-actions" ref={listItemsElement}>
							<For each={project()?.children}>
								{url => {
									return (
										<Suspense>
											<Action
												url={url}
												current={currentAction() == url}
												expanded={expandedAction() == url}
												select={() => {
													setCurrentAction(url)
													setExpandedAction(null)
												}}
												expand={() => {
													setExpandedAction(url)
												}}
												collapse={(action: Zync.Action) => {
													if (!action.note && !action.title) {
														trash()
													}
													setExpandedAction(null)
												}}
											/>
										</Suspense>
									)
								}}
							</For>
						</ol>
					</SortableProvider>
					<footer class="project-footer">
						<button onClick={trash}>
							-<span class="for-screenreaders">delete item</span>
						</button>

						<button onClick={() => newItem()}>
							+<span class="for-screenreaders">new item</span>
						</button>
					</footer>
				</article>
			</DragDropProvider>
		</Show>
	)
}
