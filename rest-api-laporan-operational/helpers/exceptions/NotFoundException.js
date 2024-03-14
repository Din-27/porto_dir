export default class NotFoundException extends Error {
  constructor(message = 'Data tidak ditemukan') {
    super(message);
  }
}
