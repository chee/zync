import * as webpush from "https://esm.sh/@jsr/negrel__webpush"
import type {Config, Context} from "@netlify/edge-functions"
import {getStore} from "@netlify/blobs"

const adminEmail = "push@galaxy.observer"

export default async (request: Request, context: Context) => {
	const vapidKeys = await webpush.importVapidKeys(
		{
			publicKey: {
				kty: "EC",
				crv: "P-256",
				alg: "ES256",
				x: Netlify.env.get("VAPID_PUBLIC_X"),
				y: Netlify.env.get("VAPID_PUBLIC_Y"),
				key_ops: ["verify"],
				ext: true,
			},
			privateKey: {
				kty: "EC",
				crv: "P-256",
				alg: "ES256",
				x: Netlify.env.get("VAPID_PRIVATE_X"),
				y: Netlify.env.get("VAPID_PRIVATE_Y"),
				d: Netlify.env.get("VAPID_PRIVATE_D"),
				key_ops: ["sign"],
				ext: true,
			},
		},
		{
			extractable: false,
		}
	)
	const {user, target, what} = await request.json()

	const store = getStore("push-subs")
	const targetSubs = await store.list({prefix: target})
	const appServer = await webpush.ApplicationServer.new({
		contactInformation: "mailto:" + adminEmail,
		vapidKeys,
	})
	console.log({target, what})

	for (const targetSub of targetSubs.blobs) {
		const sub = await store.get(targetSub.key, {type: "json"})
		const subscriber = appServer.subscribe(sub)
		await subscriber.pushTextMessage(
			JSON.stringify({title: what, body: `from ${user}`}),
			{}
		)
	}

	return new Response(null, {status: 200})
}

export const config: Config = {
	path: "/push/tell",
}
