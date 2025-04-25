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
	const subscription = await request.json()

	const store = getStore("push-subs")
	await store.setJSON(
		subscription.user + "/" + subscription.sub.endpoint,
		subscription.sub
	)
	const appServer = await webpush.ApplicationServer.new({
		contactInformation: "mailto:" + adminEmail,
		vapidKeys,
	})
	const subscriber = appServer.subscribe(subscription.sub)

	// Send notification.
	await subscriber.pushTextMessage(
		JSON.stringify({title: "notifications are enabled!", body: "hehe"}),
		{}
	)
	return new Response(null, {status: 201})
}

export const config: Config = {
	path: "/push/sub",
}
