import { ExpressType, Helpers, logger } from '@knittotextile/knitto-core-backend';
import jwt from 'jsonwebtoken';
import configuration from '../../../../config';

function authorizeMiddlware(req: ExpressType.Request, res: ExpressType.Response, next: ExpressType.NextFunction) {
	const tokenHeader = req.headers.authorization;
	if (!tokenHeader) {
		Helpers.sendResponse({ status: 400 }, res);
		return;
	}
	const token: string[] = tokenHeader.split(' ');
	switch (true) {
		case (token === undefined):
			Helpers.sendResponse({ status: 400, result: 'Error token null' }, res);
			break;
		case (token.length < 2):
			Helpers.sendResponse({ status: 400, result: 'Error token length' }, res);
			break;
		case (token[0] !== 'Bearer'):
			Helpers.sendResponse({ status: 400, result: 'Error Token Format' }, res);
			break;
		case (!token[1]):
			Helpers.sendResponse({ status: 400, result: 'Error Token Format Body' }, res);
			break;
		default:
			jwt.verify(token[1], configuration.APP_SECRET_KEY, (err: any, decode: any) => {
				if (err) Helpers.sendResponse({ status: 401, result: 'Token Expired' }, res);
				req.params.userUuid = decode.uuid;

				if (configuration.NODE_ENV === 'development') {
					logger.info({
						name: decode.nama,
						path: req.path,
						query: req.query,
						data: req.body
					});
				}
				next();
			});
			break;
	}
}

export default authorizeMiddlware;
