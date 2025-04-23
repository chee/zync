import type {AutomergeUrl} from "@automerge/automerge-repo"

export namespace Zync {
	export type AnyType = "area" | "project" | "tag" | "action" | "person"
	export type AnyThing = Area | Project | Action
	export type AreaId = AutomergeUrl & {area: true}
	export type ProjectId = AutomergeUrl & {project: true}
	export type ActionId = AutomergeUrl & {action: true}
	export type TagId = AutomergeUrl & {tag: true}
	export type PersonId = AutomergeUrl & {person: true}

	export interface Knowable {
		title: string
		type: string
	}

	export interface Notable extends Knowable {
		note: string
	}

	export interface Person extends Notable {
		picture?: string
	}

	export interface Area extends Knowable {
		type: "area"
		children: (ProjectId | ActionId)[]
	}

	export interface Doable {
		done?: false | Date
		priority?: "!!!" | "!!" | "!"
		// e.g. 2001-11-09 OR "someday"
		when?: string
		// e.g. 2001-11-09
		due?: string
		// zoozoo says you don't need reminders because you should always be
		// opening the app, and if something should happen on a certain day then
		// you should put it in your calendar
		// reminder?: number
		period?: "morning" | "afternoon" | "evening"
		jake: boolean
		kj: boolean
	}

	export interface Project extends Notable, Doable {
		type: "project"
		tags: TagId[]
		children: /*Heading|*/ ActionId[]
		logbook: ActionId[]
		// parent?: AreaId
	}

	export interface Tag extends Knowable {
		type: "tag"
	}

	export interface Context extends Knowable {
		type: "context"
	}

	export interface Action extends Notable, Doable {
		type: "action"
		tags: TagId[]
		// parent: AreaId | ProjectId | "inbox"
	}

	type Heading = {
		title: string
	}
}
