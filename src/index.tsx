/* @refresh reload */
import {render} from "solid-js/web"
import "./index.css"
import ZyncApp from "./main.tsx"
import {RepoContext} from "automerge-repo-solid-primitives"
import repo from "./automerge.ts"

const root = document.getElementById("root")

function urlBase64ToUint8Array(b64) {
	const padding = "=".repeat((4 - (b64.length % 4)) % 4)
	const base64 = (b64 + padding).replace(/\-/g, "+").replace(/_/g, "/")

	const rawData = globalThis.atob(base64)
	const outputArray = new Uint8Array(rawData.length)

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}

	return outputArray
}

async function subscribe() {
	if (!("serviceWorker" in navigator)) {
		throw new Error("service worker not supported.")
	}
	const vapidKey = await fetch("/push/vapid").then(r => r.json())
	console.debug("subscribe with vapid key", vapidKey)

	const register = await navigator.serviceWorker.register(
		"./serviceworker.js",
		{
			scope: "/",
			type: "module",
		}
	)

	return new Promise(resolve => {
		const onServiceWorkerActive = async () => {
			// Create a push subscription.
			const subscription = await register.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapidKey),
			})

			// Return it.
			resolve(subscription)
		}

		// Call onServiceWorkerActive when service worker become active.
		const sw = register.active ?? register.waiting ?? register.installing
		if (sw?.state === "activated") {
			onServiceWorkerActive()
		} else if (sw != null) {
			sw.onstatechange = () => {
				if (sw.state == "activated") {
					onServiceWorkerActive()
				}
			}
		}
	})
}

let user = localStorage.getItem("user")
while (!user) {
	const answer = prompt(
		"are you bird or rabbit? type 'bird' or 'rabbit'"
	)?.trim()
	if (["bird", "rabbit"].includes(answer ?? "")) user = answer!
	else alert("please type 'bird' or 'rabbit'")
}
localStorage.setItem("user", user)

// Use serviceWorker.ready to ensure that you can subscribe for push
globalThis.addEventListener(
	"click",
	async () => {
		const sub = await subscribe()
		await fetch("/push/sub", {
			method: "POST",
			body: JSON.stringify({
				user,
				sub,
			}),
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
