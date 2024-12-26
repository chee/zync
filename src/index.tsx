/* @refresh reload */
import {render} from "solid-js/web"
import "./index.css"
import ZyncApp from "./main.tsx"
import {RepoContext} from "automerge-repo-solid-primitives"
import repo from "./automerge.ts"

const root = document.getElementById("root")

navigator.serviceWorker.register("serviceworker.js")

const vapid = {
	publicKey:
		"BA58yQD_Lhz077jm4N4NyJSbgAUwTGMrdarZiUIQx_cXE94G377lI0DGhi-qiySNCa-Q26CLcaCiyK1aRZqjyQM",
	privateKey: "rpA42sDzSt47UtbsKdbzLtxRgVAEZ1BKKPGN69J1nxQ",
}

// Use serviceWorker.ready to ensure that you can subscribe for push
window.addEventListener(
	"click",
	() => {
		Notification.requestPermission().then(console.log)
		navigator.serviceWorker.ready.then(sw => {
			sw.pushManager
				.subscribe({
					userVisibleOnly: true,
					applicationServerKey: vapid.publicKey,
				})
				.then(
					pushSubscription => {
						console.log(pushSubscription.endpoint)
					},
					error => {
						console.error(error)
					}
				)
		})
	},
	{once: true}
)

render(
	() => (
		<RepoContext.Provider value={repo}>
			<ZyncApp />
		</RepoContext.Provider>
	),
	root!
)
