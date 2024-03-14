import { Router, requestHandler } from '@knittotextile/knitto-core-backend';
import { LoginController, checkAccessUserController } from '../controller/user/user.controller';
import authorizeMiddlware from '../middleware/auth/authorization';
import { UserDto } from '../controller/user/user.dto';
import validateRequest from '../middleware/validate/validateRequest';

const defaultRouter = Router();

defaultRouter.post('/login', validateRequest({ type: UserDto, requestType: 'body' }), requestHandler(LoginController));
defaultRouter.get('/usercheck', authorizeMiddlware, requestHandler(checkAccessUserController));

export default defaultRouter;
