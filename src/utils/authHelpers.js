export function isAdmin(email) {
    const adminEmails = ["davidiwana@hawaiilions.org", "kobeyarai@hawaiilions.org"];
    return adminEmails.includes(email);
}

export function getDates() {
    return [{ value: '10-25-2025', text: '10/25/2025', dueDate: new Date("2025-10-17T23:59:59") }]
}

export function adminDates() {
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
    ]
}