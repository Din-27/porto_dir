export const KapitalisasiKata = (str: string) => {
	const search = '_';
	const replaceWith = ' ';
	str = str.split(search).join(replaceWith);

	return str.replace(/\w\S*/g, function (kata) {
		const kataBaru = kata.slice(0, 1).toUpperCase() + kata.substr(1);
		return kataBaru;
	});
};
