import * as webpush from "https://esm.sh/@jsr/negrel__webpush@0.3.0"
import {encodeBase64Url} from "https://esm.sh/@jsr/std__encoding@0.224.0/base64url"
import type {Config, Context} from "@netlify/edge-functions"

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

	const publicKey = encodeBase64Url(
		await crypto.subtle.exportKey("raw", vapidKeys.publicKey)
	)

	return new Response(JSON.stringify(publicKey), {
		headers: {
			"content-type": "application/json",
		},
	})
}

export const config: Config = {
	path: "/push/vapid",
}
