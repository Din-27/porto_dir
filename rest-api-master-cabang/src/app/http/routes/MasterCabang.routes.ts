import authorizeMiddlware from '../middleware/auth/authorization';
import validateRequest from '../middleware/validate/validateRequest';
import { Router, requestHandler } from '@knittotextile/knitto-core-backend';
import { MasterPusatDto } from '../controller/master-cabang/MasterPusat.dto';
import { MasterCabangDto } from '../controller/master-cabang/MasterCabang.dto';
import { DownloadFile, GetHistoryAdjustController, GetHistoryEditMasterCabangController, GetMasterCabangController, HitungController, SaveMasterCabangController, SaveMasterPusatInCabangController } from '../controller/master-cabang/MasterCabang.controller';

const defaultRouter = Router();

defaultRouter.get('/cabang/master', authorizeMiddlware, requestHandler(GetMasterCabangController));
defaultRouter.get('/cabang/history', authorizeMiddlware, GetHistoryEditMasterCabangController);
defaultRouter.get('/cabang/adjust/history', authorizeMiddlware, GetHistoryAdjustController);
defaultRouter.post('/cabang/hitung/:sesi', authorizeMiddlware, requestHandler(HitungController));
defaultRouter.get('/cabang/download', DownloadFile);

defaultRouter.post('/cabang/save', [
	authorizeMiddlware,
	validateRequest({ type: MasterCabangDto, requestType: 'body' })
], requestHandler(SaveMasterCabangController));
defaultRouter.post('/pusat/save', [
	authorizeMiddlware,
	validateRequest({ type: MasterPusatDto, requestType: 'body' })
], requestHandler(SaveMasterPusatInCabangController));

export default defaultRouter;
