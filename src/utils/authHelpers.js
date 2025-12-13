import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";

let configCache = {
    adminEmails: null,
    dates: null,
    adminDates: null
};

async function fetchAdminEmails() {
    if (configCache.adminEmails) {
        return configCache.adminEmails;
    }

    try {
        const docRef = doc(firestore, "config", "adminEmails");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            configCache.adminEmails = docSnap.data().emails || [];
            return configCache.adminEmails;
        }
    } catch (error) {
        console.error("Error fetching admin emails:", error);
    }
    
    // Fallback to default values if Firestore fetch fails
    return ["kobeyarai@hawaiilions.org"];
}

export async function isAdmin(email) {
    const adminEmails = await fetchAdminEmails();
    return adminEmails.includes(email);
}

/**
 * Fetch user-facing dates from Firestore
 */
export async function getDates() {
    // Return cached value if available
    if (configCache.dates) {
        return configCache.dates;
    }

    try {
        const docRef = doc(firestore, "config", "dates");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const dates = docSnap.data().dates || [];
            // Convert ISO string back to Date object for dueDate
            configCache.dates = dates.map(date => ({
                ...date,
                dueDate: date.dueDate ? new Date(date.dueDate) : undefined
            }));
            return configCache.dates;
        }
    } catch (error) {
        console.error("Error fetching dates:", error);
    }
    
    // Fallback to default value if Firestore fetch fails
    return [];
}

/**
 * Fetch all admin dates from Firestore
 */
export async function adminDates() {
    // Return cached value if available
    if (configCache.adminDates) {
        return configCache.adminDates;
    }

    try {
        const docRef = doc(firestore, "config", "adminDates");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            configCache.adminDates = docSnap.data().dates || [];
            return configCache.adminDates;
        }
    } catch (error) {
        console.error("Error fetching admin dates:", error);
    }
    
    // Fallback to default values if Firestore fetch fails
    return [
        { value: '01-28-2023', text: '1/28/2023' },
        { value: '04-27-2023', text: '4/27/2023' },
        { value: '08-26-2023', text: '8/26/2023' },
        { value: '11-18-2023', text: '11/18/2023' },
        { value: '01-27-2024', text: '1/27/2024' },
        { value: '04-26-2024', text: '4/26/2024' },
        { value: '07-20-2024', text: '7/20/2024' },
        { value: '10-19-2024', text: '10/19/2024' },
        { value: '01-25-2025', text: '1/25/2025' },
        { value: '05-01-2025', text: '5/1/2025' },
        { value: '08-09-2025', text: '8/9/2025' },
        { value: '10-25-2025', text: '10/25/2025' },
        { value: '01-31-2026', text: '1/31/2026' },
    ];
}

/**
 * Clear the config cache (useful for forcing a refresh after updates)
 */
export function clearConfigCache() {
    configCache = {
        adminEmails: null,
        dates: null,
        adminDates: null
    };
}