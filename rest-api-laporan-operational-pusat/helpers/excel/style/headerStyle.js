exports.HeaderStyle = (wb) => {
    // Define styles for header and data cells
    return wb.createStyle({
        fill: {
            type: 'pattern',
            patternType: 'solid',
            fgColor: 'B6D7A8'
        },
        font: {
            bold: true, // Bold font for header
        },
        alignment: {
            horizontal: 'center', // Center alignment
        },
        border: {
            top: { style: 'thin', color: 'dddddd' }, // 2px top border
            right: { style: 'thin', color: 'dddddd' }, // 2px right border
            bottom: { style: 'thin', color: 'dddddd' }, // 2px bottom border
            left: { style: 'thin', color: 'dddddd' }, // 2px left border
        },
    });
}