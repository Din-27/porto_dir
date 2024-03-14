import InvalidParameterException from './exceptions/InvalidParameterException.js';
import NotAuthorizationException from './exceptions/NotAuthorizationException.js';
import NotFoundException from './exceptions/NotFoundException.js';

export default function sendResponse(res, { data, status = 200, message = 'Success' } = {}) {
  res.status(status).json({
    status,
    data,
    message,
  });
  res.end();
}

export function sendErrorResponse(res, error) {
  let status = 500;

  if (error instanceof NotFoundException) status = 404;

  if (error instanceof NotAuthorizationException) status = 403;

  if (error instanceof InvalidParameterException) status = 422;

  sendResponse(res, {
    status,
    message: error.message || error,
  });
}
