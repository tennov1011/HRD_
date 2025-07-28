/**
 * Service untuk mengelola pembayaran kasbon - Real Directus Integration
 */

const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = 'gFQjvhqJEsYwYEY8iYnOhfr_XU29jDhf';

async function directusApi(endpoint, options = {}) {
const url = ${DIRECTUS_URL}/items/;
const config = {
headers: {
'Content-Type': 'application/json',
Authorization: Bearer 
},
...options
};

try {
console.log(' Kasbon Payment API Call:', url);
const response = await fetch(url, config);

if (!response.ok) {
throw new Error(HTTP error! status: );
}

const data = await response.json();
console.log(' Kasbon Payment Response:', data);
return data;
} catch (error) {
console.error(' Directus API Error:', error);
throw error;
}
}

export async function recordKasbonPayment(paymentData) {
try {
console.log(' Recording payment to Directus:', paymentData);

const currentKasbon = await directusApi(kasbon/);
const kasbon = currentKasbon.data;
const newPaymentAmount = Number(paymentData.amount);
const currentTotalPaid = Number(kasbon.total_paid || 0);
const newTotalPaid = currentTotalPaid + newPaymentAmount;
const totalAmount = Number(kasbon.amount || kasbon.nominal || 0);

let paymentStatus = 'pending';
if (newTotalPaid >= totalAmount) {
paymentStatus = 'completed';
} else if (newTotalPaid > 0) {
paymentStatus = 'partial';
}

const updateData = {
total_paid: newTotalPaid,
payment_status: paymentStatus,
last_payment_date: paymentData.payment_date
};

const updateResult = await directusApi(kasbon/, {
method: 'PATCH',
body: JSON.stringify(updateData)
});

return {
success: true,
data: {
payment: {
id: Date.now(),
kasbon_id: paymentData.kasbon_id,
amount: newPaymentAmount,
payment_date: paymentData.payment_date,
notes: paymentData.notes,
payment_method: paymentData.payment_method
},
kasbon: {
id: paymentData.kasbon_id,
total_paid: newTotalPaid,
payment_status: paymentStatus
}
},
message: 'Payment recorded to Directus'
};
} catch (error) {
console.error(' Error:', error);
return {
success: false,
error: error.message
};
}
}
