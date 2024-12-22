import type {Zync} from "./types.ts"
import Action from "./action.tsx"
import "./project.css"

import {
	DragDropProvider,
	DragDropSensors,
	SortableProvider,
	DragEvent,
} from "@thisbeyond/solid-dnd"
import {ToggleGroup} from "@kobalte/core/toggle-group"
import clsx from "clsx"

import {deleteAt, DocHandle, insertAt} from "@automerge/automerge-repo"
import {
	createEffect,
	createSignal,
	For,
	getOwner,
	mapArray,
	Match,
	onCleanup,
	runWithOwner,
	Show,
	Suspense,
} from "solid-js"
import {createAction} from "./zync.ts"

import {createShortcut} from "@solid-primitives/keyboard"
import Editor from "./editor.tsx"
import {createDocumentStore, useHandle} from "automerge-repo-solid-primitives"
import {Switch} from "solid-js"

import {Collapsible} from "@kobalte/core/collapsible"

export default function Project(props: {url: Zync.ProjectId}) {
	let listItemsElement: HTMLOListElement
	const projectHandle = useHandle<Zync.Project>(() => props.url)
	const project = createDocumentStore(projectHandle)
	const actionHandles = mapArray(
		() => project()?.children,
		item => useHandle<Zync.Action>(() => item)
	)
	const logHandles = mapArray(
		() => project()?.logbook,
		item => useHandle<Zync.Action>(() => item)
	)
	const [filter, setFilter] = createSignal(null as "bird" | "rabbit" | null)
	const [logbookOpen, setLogbookOpen] = createSignal(false)
	const owner = getOwner()

	let logbookCleanup: number | undefined
	function queueLogbookCleanup() {
		clearTimeout(logbookCleanup)

		setTimeout(() => {
			for (const action of actionHandles()) {
				if (action()?.docSync()?.done instanceof Date) {
					projectHandle()?.change(project => {
						const index = Array.from(project.children).indexOf(
							action()?.url as Zync.ActionId
						)

						if (index != -1) {
							deleteAt(project.children, index)
							insertAt(project.logbook, 0, action()?.url as Zync.ActionId)
						}
					})
				}
			}
		}, 2000)
		runWithOwner(owner, () => onCleanup(() => clearTimeout(logbookCleanup)))
	}

	createEffect(() => {
		const incomplete = actionHandles().reduce(
			(n, action) => n + Number(action()?.docSync()?.done instanceof Date),
			0
		)
		navigator.setAppBadge?.(incomplete)
	})

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
		projectHandle()?.change(project => {
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
		projectHandle()?.change(project => {
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
		projectHandle()?.change(project => {
			deleteAt(project.children, current)
		})
	}

	function handleDragEnd(event: DragEvent) {
		const {draggable, droppable} = event

		if (droppable && draggable.id !== droppable.id) {
			projectHandle()?.change(project => {
				const draggedIndex = Array.from(project.children).indexOf(draggable.id)
				const droppedIndex = Array.from(project.children).indexOf(droppable.id)
				deleteAt(project.children, draggedIndex)
				insertAt(project.children, droppedIndex, draggable.id)
			})
		}
	}

	function isFiltered(handle: DocHandle<Zync.Action>) {
		if (filter() == "bird" && !handle.docSync()?.bird) {
			return true
		}
		if (filter() == "rabbit" && !handle.docSync()?.rabbit) {
			return true
		}

		return false
	}

	createEffect(() => {
		console.log(logHandles().length)
	})

	return (
		<Show when={projectHandle()}>
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
					<ToggleGroup
						class="project-filters"
						value={filter()}
						onChange={setFilter}
					>
						<button
							class="project-filters__filter project-filters__filter--all"
							aria-pressed={!filter()}
							onclick={() => setFilter(null)}
						>
							all
						</button>
						<ToggleGroup.Item
							class="project-filters__filter"
							value="bird"
							aria-label="bird"
						>
							🐦 bird
						</ToggleGroup.Item>
						<ToggleGroup.Item
							class="project-filters__filter"
							value="rabbit"
							aria-label="rabiit"
						>
							🐰 rabbit
						</ToggleGroup.Item>
					</ToggleGroup>

					<article class="project-note">
						<Suspense>
							<Editor
								handle={projectHandle()!}
								field="note"
								placeholder="Notes"
							/>
						</Suspense>
					</article>
					<SortableProvider ids={project()?.children}>
						<ol class="project-actions" ref={listItemsElement}>
							<For each={actionHandles()}>
								{actionHandle => {
									const url = () => actionHandle()?.url as Zync.ActionId
									return (
										<Suspense>
											<Show
												when={actionHandle() && !isFiltered(actionHandle()!)}
											>
												<Action
													handle={actionHandle()!}
													current={currentAction() == url()}
													expanded={expandedAction() == url()}
													select={() => {
														setCurrentAction(url())
														setExpandedAction(null)
													}}
													expand={() => {
														setExpandedAction(url())
													}}
													collapse={(action: Zync.Action) => {
														if (!action.note && !action.title) {
															trash()
														}
														setExpandedAction(null)
													}}
													queueLogbookCleanup={queueLogbookCleanup}
												/>
											</Show>
										</Suspense>
									)
								}}
							</For>
						</ol>
					</SortableProvider>
					{/* todo move to its own component*/}
					<Show when={logHandles()?.length > 0}>
						<Collapsible
							class="logbook"
							open={logbookOpen()}
							onOpenChange={open => setLogbookOpen(open)}
						>
							<Collapsible.Trigger class="logbook__trigger">
								<Switch>
									<Match when={logbookOpen()}>hide</Match>
									<Match when={!logbookOpen()}>show</Match>
								</Switch>{" "}
								{logHandles()?.length} logged item
								<Show when={logHandles()?.length > 1}>s</Show>
							</Collapsible.Trigger>
							<Collapsible.Content>
								<ol class="logbook__logs">
									<For each={logHandles()}>
										{logHandle => {
											const url = () => logHandle()?.url as Zync.ActionId
											const doc = createDocumentStore(logHandle)
											return (
												<Show when={logHandle() && !isFiltered(logHandle()!)}>
													<div class="log">
														<input
															type="checkbox"
															checked
															onchange={() => {
																logHandle()?.change(log => {
																	log.done = false
																})
																projectHandle()?.change(project => {
																	const index = Array.from(
																		project.logbook
																	).indexOf(url())

																	if (index != -1) {
																		deleteAt(project.logbook, index)
																		project.children.push(url())
																	}
																})
															}}
														/>
														<time>
															{(doc()?.done as Date)?.toLocaleDateString?.()}
														</time>

														<span>{doc()?.title}</span>
														<button
															class="log__delete"
															aria-label="delete"
															onclick={() => {
																projectHandle()?.change(project => {
																	const index = Array.from(
																		project.logbook
																	).indexOf(url())

																	if (index != -1) {
																		deleteAt(project.logbook, index)
																	}
																})
															}}
														>
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
																	d="M296 64h-80a7.91 7.91 0 0 0-8 8v24h96V72a7.91 7.91 0 0 0-8-8Z"
																></path>
																<path d="M432 96h-96V72a40 40 0 0 0-40-40h-80a40 40 0 0 0-40 40v24H80a16 16 0 0 0 0 32h17l19 304.92c1.42 26.85 22 47.08 48 47.08h184c26.13 0 46.3-19.78 48-47l19-305h17a16 16 0 0 0 0-32ZM192.57 416H192a16 16 0 0 1-16-15.43l-8-224a16 16 0 1 1 32-1.14l8 224A16 16 0 0 1 192.57 416ZM272 400a16 16 0 0 1-32 0V176a16 16 0 0 1 32 0Zm32-304h-96V72a7.91 7.91 0 0 1 8-8h80a7.91 7.91 0 0 1 8 8Zm32 304.57A16 16 0 0 1 320 416h-.58A16 16 0 0 1 304 399.43l8-224a16 16 0 1 1 32 1.14Z"></path>
															</svg>
														</button>
													</div>
												</Show>
											)
										}}
									</For>
								</ol>
							</Collapsible.Content>
						</Collapsible>
					</Show>
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
