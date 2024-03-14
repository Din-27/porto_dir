import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../config/app.js';

/* eslint-disable consistent-return */
export default function authJwtChecker(req, res, next) {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader && authorizationHeader.split(' ')[1];

  if (!token) return mySendResponse(res, { status: 401, message: 'Akses Tidak Sah.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return mySendResponse(res, { status: 401, message: 'Akses Tidak Sah.' });

    req.authData = decoded;
    next();
  });
}
/** eslint-enable consistent-return */
