const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

async function verifyChallenges() {
    console.log('--- Verifying Challenge Management ---');

    try {
        // 1. Login as Admin
        console.log('1. Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: 'admin',
            password: 'admin'
        });
        token = loginRes.data.token;
        console.log('   Admin logged in.');

        // 2. Get All Challenges
        console.log('2. Fetching all challenges...');
        const getRes = await axios.get(`${API_URL}/challenges`);
        console.log(`   Found ${getRes.data.length} challenges.`);

        // 3. Create a Challenge
        console.log('3. Creating a new challenge...');
        const createRes = await axios.post(`${API_URL}/challenges`, {
            title: 'Test Verification Challenge',
            description: 'This is a test challenge created by script.',
            reward: '999 XP',
            isActive: true
        }, { headers: { 'x-auth-token': token } });
        const newId = createRes.data._id;
        console.log(`   Challenge created with ID: ${newId}`);

        // 4. Update the Challenge
        console.log('4. Updating the challenge...');
        await axios.put(`${API_URL}/challenges/${newId}`, {
            title: 'Updated Challenge Title',
            isActive: false
        }, { headers: { 'x-auth-token': token } });
        console.log('   Challenge updated.');

        // 5. Delete the Challenge
        console.log('5. Deleting the challenge...');
        await axios.delete(`${API_URL}/challenges/${newId}`, {
            headers: { 'x-auth-token': token }
        });
        console.log('   Challenge deleted.');

        console.log('\n✅ ALL CHALLENGE VERIFICATION TESTS PASSED');
    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error(err.response?.data || err.message);
        process.exit(1);
    }
}

verifyChallenges();
