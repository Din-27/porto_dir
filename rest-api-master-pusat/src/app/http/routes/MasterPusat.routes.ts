import authorizeMiddlware from '../middleware/auth/authorization';
import validateRequest from '../middleware/validate/validateRequest';
import { Router, requestHandler } from '@knittotextile/knitto-core-backend';
import { MasterPusatDto } from '../controller/master-pusat/MasterPusat.dto';
import { GetHistoryEditMasterPusatController, GetMasterPusatController, SaveMasterPusatController } from '../controller/master-pusat/MasterPusat.controller';

const defaultRouter = Router();

defaultRouter.get('/pusat/master', authorizeMiddlware, requestHandler(GetMasterPusatController));
defaultRouter.get('/pusat/history', authorizeMiddlware, GetHistoryEditMasterPusatController);
defaultRouter.post('/pusat/save', [authorizeMiddlware, validateRequest({ type: MasterPusatDto, requestType: 'body' })], requestHandler(SaveMasterPusatController));

export default defaultRouter;
