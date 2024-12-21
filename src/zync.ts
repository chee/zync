import {Zync} from "./types"

// interface CreateProjectOptions {}
export function createProject(): Zync.Project {
	return {
		type: "project",
		tags: [],
		note: "",
		state: "todo",
		title: "",
		children: [],
	}
}

// interface CreateActionOptions {
// 	parent: Zync.ProjectId
// }
export function createAction(): Zync.Action {
	return {
		type: "action",
		tags: [],
		note: "",
		state: "todo",
		title: "",
	}
}
