import axios from 'axios';

export const API = async ({ url, body }: { url: string, body: string[] }): Promise<void> => {
	try {
		const getToken = await axios.post(String(new URL('/login', process.env.KNITTO_API)), {
			'username': process.env.KNITTO_USER,
			'password': process.env.KNITTO_PASS
		});
		const token = getToken.data.result.token;
		axios.defaults.headers.common.Authorization = `Bearer ${token}`;
		await axios.post(String(new URL(url, process.env.KNITTO_API)), body);
	} catch (error) {
		console.log(error);
	}
};
