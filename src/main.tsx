import {
	useRepo,
	createDocumentStore,
	useHandle,
} from "automerge-repo-solid-primitives"
import "./style.css"
import {AutomergeUrl} from "@automerge/automerge-repo"
import {Zync} from "./types"
import Project from "./project"
import {createEffect, Match, Suspense, Switch} from "solid-js"

const defaultProjectURL =
	"automerge:23k3mS8464t636dGjLC79NsnT44Z" as AutomergeUrl

export default function App() {
	const projectHandle = useHandle<Zync.Project>(() => defaultProjectURL)
	const project = createDocumentStore(projectHandle)
	createEffect(() => {
		document.title = project()?.title ?? "the zync up"
	})

	return (
		<Switch>
			<Match when={project()}>
				<Suspense fallback={"what"}>
					<Project
						url={projectHandle()?.url as Zync.ProjectId}
						project={project()!}
						change={projectHandle()!.change.bind(projectHandle())}
					/>
				</Suspense>
			</Match>
		</Switch>
	)
}
