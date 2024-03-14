import { DateTime } from 'luxon';

export function msToTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return formattedTime;
}

export function timeToMilliseconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
  return totalMilliseconds;
}

export function msToDurationString(millisecond) {
  const ms = Math.abs(millisecond);
  const day = Math.floor(ms / 86400000);
  let sisa = ms % 86400000;
  const hour = Math.floor(sisa / 3600000);
  sisa %= 3600000;
  const minutes = Math.floor(sisa / 60000);

  let result = `${day} Hari ${hour} Jam ${minutes} menit`;
  if (millisecond < 0) {
    result = `- ${result}`;
  }

  return result;
}

export const stringDay = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export function dayStringToNumber(day) {
  return stringDay.findIndex((val) => val === day);
}

export function dayNumberToString(dayNumber) {
  return stringDay[dayNumber];
}

export function fractionToTime(fraction, useSecond = false) {
  let totalSeconds = fraction * 24 * 60 * 60;

  if (Number.isNaN(totalSeconds)) {
    totalSeconds = 0;
  }

  return DateTime.fromObject({ hour: 0, minute: 0, second: 0 })
    .plus({ seconds: totalSeconds })
    .toFormat(useSecond ? 'HH:mm:ss' : 'HH:mm');
}
