import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server';
import { createUser } from '@/utils/actions/user.action';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('WEBHOOK_SECRET is not defined');
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (error) {
        console.error('Error verifying webhook', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { email_address, username, image_url, first_name, last_name } = evt.data;
        const user = {
            clerkId: id,
            email: email_address[0].email_address,
            username: username,
            photo: image_url,
            firstName: first_name,
            lastName: last_name,
        };
        console.log(user);
        const newUser = await createUser(user);
        if (newUser) {
            await clerkClient.users.updateUserMetadata(id, {
                publicMetadata: {
                    userId: newUser.id,
                },
            });
        }
        return NextResponse.json({ success: true }, { status: 200 });
    }

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    console.log('Webhook body', body);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
}
