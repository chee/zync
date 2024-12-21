import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
import {Repo} from "@automerge/automerge-repo"

export async function startAutomerge() {
	let idb = new IndexedDBStorageAdapter("things")
	let socky = new BrowserWebSocketClientAdapter("wss://galaxy.observer")
	let network = [socky]
	let storage = idb
	let repo = new Repo({
		network,
		storage,
		enableRemoteHeadsGossiping: true,
	})
	await repo.networkSubsystem.whenReady()
	window.repo = repo
	return repo
}

declare global {
	interface Window {
		repo: Repo
	}
}

export default await startAutomerge()
