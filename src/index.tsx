/* @refresh reload */
import {render} from "solid-js/web"
import "./index.css"
import ZyncApp from "./main.tsx"
import {RepoContext} from "automerge-repo-solid-primitives"
import repo from "./automerge.ts"

const root = document.getElementById("root")

render(
	() => (
		<RepoContext.Provider value={repo}>
			<ZyncApp />
		</RepoContext.Provider>
	),
	root!
)
