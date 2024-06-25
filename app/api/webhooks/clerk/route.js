import { Webhook } from "svix";
import createUser from "@/utils/actions/user.action";

export async function POST(req) {
    const webhook = new Webhook(process.env.SVIX_SECRET_KEY);
    const event = await webhook.verify(req.body, req.headers);
    if (event.type === 'user.created') {
        const user = event.data.object;
        await createUser(user);
    }
}