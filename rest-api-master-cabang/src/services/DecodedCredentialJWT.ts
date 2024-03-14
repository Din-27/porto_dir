import { ExpressType } from '@knittotextile/knitto-core-backend';
import jwt from 'jsonwebtoken';

const DecodedCredentialJWT = (req: ExpressType.Request): string => {
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(' ')[1] as string;
	const data = jwt.decode(token);
	if (typeof data === 'string') {
		return 'Error Service';
	}
	return JSON.stringify(data);
};

export default DecodedCredentialJWT;
