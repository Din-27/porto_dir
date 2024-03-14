/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { sanitize } from 'class-sanitizer';
import sendResponse from '@knittotextile/knitto-core-backend/dist/Helpers/send-response';
import { ExpressType } from '@knittotextile/knitto-core-backend';

interface ValidateRequestParam {
	type: any
	requestType: 'body' | 'query'
	opts?: ValidatorOptions
};

function requestErrorMapper(error: ValidationError) {
	let _result = [];

	if (error.constraints !== undefined) _result = (Object as any).values(error.constraints);

	if (error.children !== undefined && error.children.length > 0) {
		_result = _result.concat(error.children.flatMap((errChild: ValidationError) => requestErrorMapper(errChild)));
	}
	return _result;
}

export default function validateRequest(param: ValidateRequestParam): ExpressType.RequestHandler {
	return (req, res, next) => {
		let dtoObj: any;

		if (param.requestType === 'query') {
			dtoObj = plainToInstance(param.type, req.query);
		} else {
			dtoObj = plainToInstance(param.type, req.body);
		}

		validate(dtoObj, { skipMissingProperties: false, ...param.opts }).then(
			(errors: ValidationError[]) => {
				if (errors.length > 0) {
					const dtoErrors = errors.map((error: ValidationError) => requestErrorMapper(error)).join(',');

					sendResponse({
						status: 400, message: dtoErrors
					}, res);
				} else {
					sanitize(dtoObj);

					if (param.requestType === 'query') { req.query = dtoObj; } else { req.body = dtoObj; }

					next();
				}
			}
		);
	};
}
