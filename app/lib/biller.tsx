export const BILLERS = {
    '1': {id: 'ZESA', name: 'ZESA Prepaid', prompt: 'Enter ZESA meter number', commission: 1.5},
    '2': {id: 'TELONE', name: 'Telone', prompt: 'Enter Telone account', commission: 1.5},
    '3': {id: 'CITY', name: 'CITY Council / Rates', prompt: 'Enter Council amount', commission: 1.5},
    '4': {id: 'DSTV', name: 'DSTV', prompt: 'Enter DSTV smartcard', commission: 1.5},
    '5': {id: 'RENATL', name: 'Rent Payment', prompt: 'Enter Landlord number or House ID (e.g.. Flat 4B Gandawa Estate)', commission: 1.5},
    '6': {id: 'SHOPPING', name: 'Shopping / Tuckshop Order', prompt: 'Enter Order ID or Shop Name', commission: 1.5},
    '7': {id: 'CHURCH', name: 'Church Tithe / Offering', prompt: 'Enter Church ID', commission: 1.5},
}

export function getBillerMenu(){
    return `*Tuma Bills Hub *\n\n` +
    `1. ZESA Prepaid \n` +
    `2. TelOne \n ` +
    `3. Council Rates \n` +
    `4. DSTV \n` +
    `5. RENT Payment \n` +
    `6. Shopping \n\n` +
    `7. Church \n\n` +
    `Reply with number (1-7)` 
}