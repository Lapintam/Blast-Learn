'use client'

import { db } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";

//number of docs the user is allowed to have
const PRO_LIMIT = 20;
const FREE_LIMIT = 2;

function useSubscription() {
    const [hasActiveMembership, setHasActiveMembership] = useState(null);
    const [isOverFileLimit, setIsOverFileLimit] = useState(false);
    const { user } = useUser();

    // Listen to the User document
    const [snapshot, loading, error] = useDocument(
        user && doc(db, 'users', user.id),
        {
            snapshotListenOptions: { includeMetadataChanges: true },
        }
    );

    // Listen to the users files collection
    const [filesSnapshot, filesLoading] = useCollection(
        user && collection(db, "users", user?.id, "files")
    );

    // Check if the user has an active membership
    useEffect(() => {
        if (!snapshot) return;

        const data = snapshot.data();

        if (!data) return;

        setHasActiveMembership(data.hasActiveMembership);
    }, [snapshot])

    //Check if the user is over the file limit based on membership
    useEffect(() => {
        //check to see if user exists and if hasActiveMembership has loaded in yet. Initial loading of app sets hasActiveMembership to null
        if(!filesSnapshot || hasActiveMembership === null) return;

        //number of docs the user has
        const files = filesSnapshot.docs;

        //defines document limit based on hasActiveMembership metadata, if true 20 if false 2
        const usersLimit = hasActiveMembership ? PRO_LIMIT : FREE_LIMIT;

        console.log(
            "Checking if user is over file limit",
            files.length,
            usersLimit
        );

        //sets users state to true if the user is over file limit based on membership status
        setIsOverFileLimit(files.length >= usersLimit);
    }, [filesSnapshot, hasActiveMembership]);

    return { hasActiveMembership, loading, error, isOverFileLimit, filesLoading };
}

export default useSubscription