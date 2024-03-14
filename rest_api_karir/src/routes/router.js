const router = require('express').Router()
const { auth } = require('../../auth/auth')
const { upload } = require('../../config/conn/tabel')
const { handleLogin } = require('../controllers/hire/login')
const { handleEmailAuth, handleResendLinkFromEmail, checkAuthorized } = require('../controllers/employer/login')
const { handleDashboardEmployee, handlePhotoPengerjaan } = require('../controllers/employer/dashboard')
const { handlePrintTestAQ, handlePrintTestButaWarna, handlePrintTestMatematika } = require('../controllers/hire/report_to_hrd')
const { handlePersonalPerson, handlePersonalPersonAdditional, handlePersonalPersonAttachments, getDataPersonalPerson, 
    getDataPersonalPersonAdditional } = require('../controllers/employer/information_form')
const { allBankSoalMatematika, addBankSoalMatematika, bankSoalMatematikaByJenis, updateBankSoalMatematika, 
    deleteBankSoalMatematika } = require('../controllers/hire/bank_soal')
const { getListEmployerTest, handleSearch, detailPenilaianAq, detailPenilaianMatematikaSubtest_1,
    detailPenilaianMatematikaSubtest_2, detailPenilaianMatematikaSubtest_3, penilaianMatematikaSubtest, photo_pengerjaan, 
    detailTesButaWarna, 
    download_attachments} = require('../controllers/hire/dashboard')
const { handleTestColorBlind, handleTestAq, getTestAq, getAllTestMatematika, getTestMatematikaByJenis,
    handleTestMatematikaSubtest_1a, handleTestMatematikaSubtest_1b, handleTestMatematikaSubtest_1c, handleTestMatematika_2,
    getTestMatematika_2, getTestMatematika_3, handleTestMatematika_3 } = require('../controllers/employer/test')
const { isAuthorized } = require('../../auth/checkingAuth')

//Endpoint pelamar
router.post('/auth', handleEmailAuth)
router.post('/resend', handleResendLinkFromEmail)
// router.get('/check-token', isAuthorized, checkAuthorized)
router.post('/dashboard', isAuthorized, handleDashboardEmployee)
router.get('/personal-information-form', isAuthorized, getDataPersonalPerson)
router.post('/personal-information-form', isAuthorized, handlePersonalPerson)
router.get('/additional-information-form', isAuthorized, getDataPersonalPersonAdditional)
router.post('/additional-information-form', isAuthorized, handlePersonalPersonAdditional)
router.post('/attachment-information-form', [isAuthorized, upload.fields([
    { name: 'cv_pelamar', maxCount: 1 },
    { name: 'ktp_pelamar', maxCount: 1 },
    { name: 'ijazah_pelamar', maxCount: 1 }
])], handlePersonalPersonAttachments)
router.post('/photo-pengerjaan', [
    isAuthorized,
    upload.fields([
    {name : 'photo_1', maxCount: 1},
    {name : 'photo_3', maxCount: 1},
    {name : 'photo_2', maxCount: 1}
])], handlePhotoPengerjaan)

router.get('/test-aq', isAuthorized, getTestAq)
router.post('/test-aq', isAuthorized, handleTestAq)
router.get('/test-matematika', isAuthorized, getAllTestMatematika)
router.get('/test-matematika/:jenis_test', getTestMatematikaByJenis)
router.post('/test-matematika_1a', isAuthorized, handleTestMatematikaSubtest_1a)
router.post('/test-matematika_1b', isAuthorized, handleTestMatematikaSubtest_1b)
router.post('/test-matematika_1c', isAuthorized, handleTestMatematikaSubtest_1c)

router.get('/test-matematika_2', isAuthorized, getTestMatematika_2)
router.post('/test-matematika_2', isAuthorized, handleTestMatematika_2)

router.get('/test-matematika_3', isAuthorized, getTestMatematika_3)
router.post('/test-matematika_3', isAuthorized, handleTestMatematika_3)

//test buta warna 1
router.post('/tes-blind-color', [isAuthorized, upload.single('buta_warna')], handleTestColorBlind)



//recruiter 11
router.post('/login', handleLogin)
router.post('/search', auth, handleSearch)
router.post('/print-test-aq', auth, handlePrintTestAQ)
router.post('/print-test-matematika', auth, handlePrintTestMatematika)
router.post('/print-test-buta-warna', auth, handlePrintTestButaWarna)
router.post('/detail-test-aq', auth, detailPenilaianAq)
router.post('/get-photo-pengerjaan', auth, photo_pengerjaan)
router.get('/dashboard-hire', getListEmployerTest)
router.post('/download-attachment', download_attachments)
router.post('/detail-test-buta-warna', auth, detailTesButaWarna)
router.post('/detail-matematika', auth, penilaianMatematikaSubtest)
router.get('/detail-subtest-1/:id_identitas', auth, detailPenilaianMatematikaSubtest_1)
router.get('/detail-subtest-2/:id_identitas', auth, detailPenilaianMatematikaSubtest_2)
router.get('/detail-subtest-3/:id_identitas', auth, detailPenilaianMatematikaSubtest_3)

//subtest
router.get('/bank-soal-matematika', allBankSoalMatematika)
router.get('/bank-soal-matematika/:jenis_test', auth, bankSoalMatematikaByJenis)
router.post('/add-bank-soal-matematika/:jenis_test/:id_soal', auth, addBankSoalMatematika)
router.patch('/update-bank-soal-matematika', auth, updateBankSoalMatematika)
router.delete('/delete-bank-soal-matematika', auth, deleteBankSoalMatematika)

module.exports = router