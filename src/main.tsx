import {
	useRepo,
	createDocumentStore,
	useHandle,
} from "automerge-repo-solid-primitives"
import "./style.css"
import {Zync} from "./types"
import Project from "./project"
import {Suspense} from "solid-js"

const defaultProjectURL =
	"automerge:23k3mS8464t636dGjLC79NsnT44Z" as Zync.ProjectId

export default function App() {
	return (
		<Suspense fallback={"..."}>
			<Project url={defaultProjectURL} />
		</Suspense>
	)
}
