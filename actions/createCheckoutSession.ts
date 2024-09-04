'use server';

import { UserDetails } from "@/app/dashboard/upgrade/page";
import { adminDb } from "@/firebaseAdmin";
import getBaseUrl from "@/lib/getBaseUrl";
import stripe from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";

export async function createCheckoutSession(userDetails: UserDetails) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not found");
    }

    // first check if the user already has a stripeCustomerId
    let stripeCustomerId;

    const user = await adminDb.collection("users").doc(userId).get();
    stripeCustomerId = user.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
        // create a new stripe customer
        const customer = await stripe.customers.create({
            email: userDetails.email,
            name: userDetails.name,
            metadata: {
                userId, //this userId connects clerk and stripe for validating customer details!
            },
        });

        //set stripeCustomerId in Firestore
        await adminDb.collection("users").doc(userId).set({
            stripeCustomerId: customer.id,
        });

        //assign stripe customer.id to user.data().stripeCustomerId in Firestore
        //this is so next time this checkout session is triggered, stripeCustomerId will not be undefined
        stripeCustomerId = customer.id;
    }

    // either way at this point you will have a stripeCustomerId, either generated for the first time or existing

    // create a stripe session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price: "price_1PlbwuBJRFJVHxmIApEaPin2",
                quantity: 1,
            },
        ],
        mode: "subscription",
        customer: stripeCustomerId,
        success_url: `${getBaseUrl()}/dashboard?upgrade=true`,
        cancel_url: `${getBaseUrl()}/upgrade`,
    });

    return session.id;
}