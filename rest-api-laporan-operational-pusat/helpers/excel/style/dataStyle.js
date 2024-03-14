exports.DataStyle = (wb) => {
    return wb.createStyle({
        alignment: {
            horizontal: 'center', // Center alignment for data cells
        },
        border: {
            top: { style: 'thin', color: 'dddddd' }, // 2px top border
            right: { style: 'thin', color: 'dddddd' }, // 2px right border
            bottom: { style: 'thin', color: 'dddddd' }, // 2px bottom border
            left: { style: 'thin', color: 'dddddd' }, // 2px left border
        },
    });
}